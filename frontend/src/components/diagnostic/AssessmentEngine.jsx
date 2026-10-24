import React, { useState } from 'react';
import IntakeForm from './IntakeForm';
import ResultCard from './ResultCard';
import { api } from '../../api/client';
import { CAUSE_LABELS } from '../../data/staticData';
import { 
  ClipboardCheck, 
  DollarSign, 
  RotateCcw,
  CheckCircle2,
  Scale
} from 'lucide-react';

export default function AssessmentEngine({ 
  coops = [],
  selectedCoop, 
  onSelectCoop,
  onOpenNewCoopModal,
  onAssessmentCompleted,
  onOpenReportModal 
}) {
  const [latestResult, setLatestResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submittedMeta, setSubmittedMeta] = useState(null);
  const [liveDraft, setLiveDraft] = useState(null);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await api.submitAssessment(payload);
      setLatestResult(result);
      setSubmittedMeta({
        coopName: selectedCoop?.name || 'Harvest Evaluation',
        cropName: payload.crop,
        districtName: payload.district,
      });
      if (onAssessmentCompleted) {
        onAssessmentCompleted(result);
      }
    } catch (err) {
      setError(err.message || 'Assessment failed to process. Ensure service is reachable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Projected metrics from live draft
  const projectedLossRate = liveDraft?.lossRatePct || 9.4;
  const projectedLossKg = liveDraft?.totalLossKg || 4700;
  const projectedHarvestedKg = liveDraft?.harvestedQtyKg || 50000;
  const projectedRetainedKg = Math.max(0, projectedHarvestedKg - projectedLossKg);
  const retainedPct = projectedHarvestedKg > 0 ? ((projectedRetainedKg / projectedHarvestedKg) * 100).toFixed(1) : '90.6';
  const lostPct = projectedHarvestedKg > 0 ? ((projectedLossKg / projectedHarvestedKg) * 100).toFixed(1) : '9.4';

  const pricePerKg = 520; // Official Rwandan farmgate index price
  const projectedLossRwf = projectedLossKg * pricePerKg;
  const projectedRetainedRwf = projectedRetainedKg * pricePerKg;
  const projectedRisk = projectedLossRate <= 10.6 ? 'Low' : projectedLossRate > 14.3 ? 'High' : 'Medium';

  // Compute top bottleneck from live draft
  const causeEntries = liveDraft?.causeLosses ? Object.entries(liveDraft.causeLosses) : [];
  const sortedCauses = causeEntries.sort((a, b) => b[1] - a[1]);
  const topCauseKey = sortedCauses[0]?.[0] || 'storage';
  const topCauseKg = sortedCauses[0]?.[1] || 0;
  const topCausePct = projectedLossKg > 0 ? Math.round((topCauseKg / projectedLossKg) * 100) : 0;
  const topCauseMeta = CAUSE_LABELS[topCauseKey] || { name: 'Storage Spoilage', hex: '#0284C7', shortName: 'Storage' };

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-white/95 rounded-[28px] border border-black/[0.06] p-5 lg:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 font-mono tracking-tight uppercase">
                Assess Harvest Loss
              </h2>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                NISR SAS 2024–2025
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-black/[0.05]">
                {liveDraft?.crop || 'Maize'} in {liveDraft?.district || 'Musanze'} (Season {liveDraft?.season || 'A'})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Compare actual harvest quantities and losses against official NISR survey benchmarks.
            </p>
          </div>
        </div>

        {/* NST2 Alignment Metric Capsule */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto bg-slate-50/80 p-2.5 px-4 rounded-2xl border border-black/[0.05]">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              NST2 TARGET STATUS
            </div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <span>Goal: ≤5.0% Loss</span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                projectedLossRate <= 5.0 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : projectedLossRate <= 10.6 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {projectedLossRate <= 5.0 ? 'Compliant' : projectedLossRate <= 10.6 ? 'Moderate Gap' : 'Action Required'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Intake Controls (Span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <IntakeForm
            selectedCoop={selectedCoop}
            onSubmit={handleSubmit}
            onLiveChange={setLiveDraft}
            isSubmitting={isSubmitting}
            error={error}
          />
        </div>

        {/* Right Column: Live Projected Scorecard OR Submitted Result Card (Span 7) */}
        <div className="lg:col-span-7 space-y-4">
          {latestResult ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>OFFICIAL ASSESSMENT LOGGED</span>
                </span>
                <button
                  onClick={() => setLatestResult(null)}
                  className="text-xs font-mono text-slate-500 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Evaluate Another Harvest</span>
                </button>
              </div>
              <ResultCard
                result={latestResult}
                coopName={submittedMeta?.coopName}
                cropName={submittedMeta?.cropName}
                districtName={submittedMeta?.districtName}
                onOpenReportModal={onOpenReportModal}
              />
            </div>
          ) : (
            /* Live Real-Time Projection Scorecard (Pre-submission) */
            <div className="bg-white/95 border border-black/[0.06] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs space-y-5 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.04]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                    Real-Time Loss Evaluation
                  </h3>
                </div>
                <span className="text-[10.5px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                  {liveDraft?.crop || 'Maize'} in {liveDraft?.district || 'Musanze'}
                </span>
              </div>

              {/* Loss Rate Position Bar */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-black/[0.04]">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-mono text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                    Loss Rate Position:
                  </span>
                  <span className="font-mono text-xs font-black text-slate-900">
                    {projectedLossRate}% Loss Rate ({projectedRisk} Risk)
                  </span>
                </div>
                <div className="relative w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                  <div className="w-[42%] h-full bg-emerald-500" title="Low Risk Zone (≤10.6%)" />
                  <div className="w-[15%] h-full bg-amber-400" title="Medium Risk Zone (10.6% - 14.3%)" />
                  <div className="w-[43%] h-full bg-rose-500" title="High Risk Zone (>14.3%)" />
                </div>
                <div className="flex justify-between items-center text-[9.5px] font-mono text-slate-400 mt-1.5 px-0.5">
                  <span>0% Safe</span>
                  <span className="text-emerald-700 font-bold">10.6% NST2 Baseline</span>
                  <span className="text-rose-600 font-bold">14.3% Threshold</span>
                  <span>25%+ Severe</span>
                </div>
              </div>

              {/* Yield Retention & Financial Balance */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-black/[0.04] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[10.5px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Yield & Financial Balance ({pricePerKg} RWF/kg)</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-800">
                    Gross: {((projectedHarvestedKg * pricePerKg) / 1000000).toFixed(2)}M RWF
                  </span>
                </div>

                {/* Bi-color Funnel Bar */}
                <div className="w-full h-3.5 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                  <div 
                    className="h-full bg-emerald-600 transition-all duration-300" 
                    style={{ width: `${retainedPct}%` }}
                  />
                  <div 
                    className="h-full bg-rose-500 transition-all duration-300" 
                    style={{ width: `${lostPct}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                    <span className="text-[10px] text-emerald-700 font-bold font-mono uppercase block">Retained Harvest</span>
                    <span className="text-lg font-mono font-black text-emerald-800 block mt-0.5">
                      {(projectedRetainedRwf / 1000000).toFixed(2)}M RWF
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      {projectedRetainedKg.toLocaleString()} kg ({retainedPct}%)
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-rose-200/80 shadow-2xs">
                    <span className="text-[10px] text-rose-700 font-bold font-mono uppercase block">Estimated Financial Loss</span>
                    <span className="text-lg font-mono font-black text-rose-800 block mt-0.5">
                      {(projectedLossRwf / 1000000).toFixed(2)}M RWF
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      {projectedLossKg.toLocaleString()} kg ({lostPct}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Dominant Loss Bottleneck & Recommended Action */}
              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-2xs space-y-2">
                <span className="text-[10.5px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                  Primary Loss Bottleneck:
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: topCauseMeta.hex }} />
                    <span className="text-sm font-mono font-bold text-slate-900">{topCauseMeta.name}</span>
                  </div>
                  <span 
                    className="text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-full border" 
                    style={{
                      backgroundColor: `${topCauseMeta.hex}15`,
                      color: topCauseMeta.hex,
                      borderColor: `${topCauseMeta.hex}30`
                    }}
                  >
                    {topCausePct}% of loss ({topCauseKg.toLocaleString()} kg)
                  </span>
                </div>
                <p className="text-xs text-slate-600 pt-1.5 border-t border-black/[0.04] leading-relaxed">
                  Key intervention: <strong>Hermetic bag adoption, solar drying cribs, and moisture validation prior to bulk storage.</strong>
                </p>
              </div>

              {/* KPI Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-black/[0.05] shadow-2xs">
                  <span className="text-[10.5px] text-slate-500 block mb-1 font-mono uppercase">Loss Rate</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-mono font-black text-slate-900 tnum">
                      {projectedLossRate}%
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      projectedLossRate <= 10.22 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {projectedLossRate <= 10.22 ? 'Below Nat’l' : 'Above Nat’l'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                    vs. 10.22% National Benchmark
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-black/[0.05] shadow-2xs">
                  <span className="text-[10.5px] text-slate-500 block mb-1 font-mono uppercase">Cash Loss</span>
                  <span className="text-xl font-mono font-black text-slate-900 tnum block">
                    ~{(projectedLossRwf / 1000000).toFixed(2)}M RWF
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                    {Math.round(projectedLossKg).toLocaleString()} kg depleted
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-black/[0.05] shadow-2xs">
                  <span className="text-[10.5px] text-slate-500 block mb-1 font-mono uppercase">Risk Level</span>
                  <span className={`text-base font-mono font-black uppercase block ${
                    projectedRisk === 'Low' ? 'text-emerald-700' : projectedRisk === 'Medium' ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {projectedRisk} Risk
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                    {liveDraft?.crop || 'Maize'} in {liveDraft?.district || 'Musanze'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
