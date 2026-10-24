import React, { useState, useEffect } from 'react';
import HistoryTrendChart from './HistoryTrendChart';
import AssessmentTable from './AssessmentTable';
import { api } from '../../api/client';
import { CAUSE_LABELS } from '../../data/staticData';
import { 
  History, 
  TrendingDown, 
  TrendingUp,
  DollarSign, 
  AlertCircle, 
  BarChart3,
  Award,
  Building2,
  Scale,
  Plus,
  ShieldCheck,
  Layers,
  ArrowRight,
  ChevronDown,
  ClipboardList
} from 'lucide-react';

export default function CoopHistory({ 
  coops = [],
  selectedCoop, 
  onSelectCoop,
  onOpenNewCoopModal,
  onNavigateToDiagnostic, 
  onViewReport 
}) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCoop?.id) return;

    setLoading(true);
    api.getAssessments(selectedCoop.id)
      .then((data) => {
        if (data && Array.isArray(data)) {
          setAssessments(data);
        } else {
          setAssessments([]);
        }
      })
      .catch(() => {
        setAssessments([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedCoop]);

  // Compute summary stats
  const totalSeasons = assessments.length;
  const totalHarvestedKg = assessments.reduce((sum, a) => sum + (a.harvested_qty_kg || 0), 0);
  const totalLossKg = assessments.reduce((sum, a) => sum + (a.total_loss_kg || 0), 0);
  const totalRwfLost = assessments.reduce((sum, a) => sum + (a.estimated_loss_value_rwf || 0), 0);

  const avgLoss = totalHarvestedKg > 0 
    ? ((totalLossKg / totalHarvestedKg) * 100).toFixed(1)
    : (totalSeasons > 0 ? (assessments.reduce((sum, a) => sum + (a.loss_rate_pct || 0), 0) / totalSeasons).toFixed(1) : '0.0');

  // Chronological trajectory analysis
  const sortedChronological = [...assessments].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
  const earliestLoss = sortedChronological[0]?.loss_rate_pct || 0;
  const latestLoss = sortedChronological[sortedChronological.length - 1]?.loss_rate_pct || 0;
  const lossDiff = latestLoss - earliestLoss;

  const trajectoryImproving = lossDiff < 0;
  const trajectoryDeteriorating = lossDiff > 0;
  const trajectoryDeltaLabel = totalSeasons > 1
    ? (trajectoryImproving ? `↓ ${Math.abs(lossDiff).toFixed(1)}% Multi-Season Improvement` : trajectoryDeteriorating ? `↑ ${lossDiff.toFixed(1)}% Risk Elevation` : 'Stable Trajectory')
    : 'Baseline Season Established';

  // Compliance Grade computation
  const numericAvgLoss = parseFloat(avgLoss);
  const complianceGrade = totalSeasons === 0 ? 'Unrated' :
    numericAvgLoss <= 10.0 ? 'GRADE A: RESILIENT' :
    numericAvgLoss <= 14.0 ? 'GRADE B: MONITORED' :
    'GRADE C: AT-RISK';

  const gradeColor = totalSeasons === 0 ? 'bg-slate-100 text-slate-600 border-slate-300' :
    numericAvgLoss <= 10.0 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
    numericAvgLoss <= 14.0 ? 'bg-amber-50 text-amber-800 border-amber-300' :
    'bg-rose-50 text-rose-800 border-rose-300';

  const gapToNST2 = (numericAvgLoss - 5.0).toFixed(1);

  // Cumulative Supply-Chain Breakdown
  const causeTotals = {};
  let totalCauseKg = 0;
  assessments.forEach(a => {
    if (a.cause_breakdown_json) {
      try {
        const parsed = typeof a.cause_breakdown_json === 'string' ? JSON.parse(a.cause_breakdown_json) : a.cause_breakdown_json;
        Object.entries(parsed).forEach(([k, v]) => {
          const val = parseFloat(v) || 0;
          causeTotals[k] = (causeTotals[k] || 0) + val;
          totalCauseKg += val;
        });
      } catch (e) {}
    } else if (a.dominant_cause && a.total_loss_kg) {
      causeTotals[a.dominant_cause] = (causeTotals[a.dominant_cause] || 0) + a.total_loss_kg;
      totalCauseKg += a.total_loss_kg;
    }
  });

  const cumulativeCauses = Object.entries(causeTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({
      key: k,
      name: CAUSE_LABELS[k]?.name || k.replace('_', ' '),
      kg: v,
      pct: totalCauseKg > 0 ? Number(((v / totalCauseKg) * 100).toFixed(0)) : 0
    }));

  const topRecurringCause = cumulativeCauses[0]?.name || 'Storage';

  const causeColorPalette = [
    'bg-emerald-600',
    'bg-amber-500',
    'bg-rose-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-slate-400'
  ];

  return (
    <div className="space-y-6">
      {/* Executive Cooperative Resilience Banner */}
      <div className="bg-white/95 rounded-[28px] border border-black/[0.06] p-5 lg:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              {/* Interactive Cooperative Selector Dropdown */}
              <div className="relative inline-flex items-center">
                <select
                  value={selectedCoop?.id || ''}
                  onChange={(e) => {
                    const coopId = Number(e.target.value);
                    const found = coops.find((c) => c.id === coopId);
                    if (found && onSelectCoop) onSelectCoop(found);
                  }}
                  className="text-sm sm:text-base font-bold text-slate-900 bg-slate-100/90 hover:bg-slate-200/80 border border-black/[0.08] rounded-xl pl-3 pr-8 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all shadow-2xs appearance-none font-mono"
                  aria-label="Switch cooperative for performance history"
                >
                  {coops.map((coop) => (
                    <option key={coop.id} value={coop.id}>
                      {coop.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>

              {onOpenNewCoopModal && (
                <button
                  onClick={onOpenNewCoopModal}
                  className="text-[10.5px] font-mono font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 shadow-2xs active:scale-95"
                  title="Register new cooperative"
                >
                  <Plus className="w-3 h-3" />
                  <span>Register Coop</span>
                </button>
              )}

              <span className="text-[10.5px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-black/[0.05] font-semibold">
                {selectedCoop?.district} DISTRICT
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                NISR-COOP-#{String(selectedCoop?.id || '01').padStart(2, '0')}
              </span>
              <span className={`text-[10.5px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${gradeColor}`}>
                {complianceGrade}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium flex-wrap">
              <span className={`flex items-center gap-1 font-mono font-bold ${
                trajectoryImproving ? 'text-emerald-700' : trajectoryDeteriorating ? 'text-rose-700' : 'text-slate-600'
              }`}>
                {trajectoryImproving ? <TrendingDown className="w-3.5 h-3.5" /> : trajectoryDeteriorating ? <TrendingUp className="w-3.5 h-3.5" /> : null}
                <span>{trajectoryDeltaLabel}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-[11px] text-slate-600">
                {parseFloat(gapToNST2) <= 0 
                  ? 'NST2 Target Met (≤5.0%)' 
                  : `Gap to NST2 Target: +${gapToNST2}%`}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onNavigateToDiagnostic}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center gap-2 self-start md:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Log New Season Harvest</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white/95 rounded-[28px] border border-black/[0.06] p-12 text-center text-xs font-mono text-slate-400 animate-pulse shadow-sm">
          Loading harvest logs for {selectedCoop?.name}...
        </div>
      ) : assessments.length === 0 ? (
        /* Empty State */
        <div className="bg-white/95 rounded-[28px] border border-black/[0.06] p-10 text-center shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center mx-auto shadow-2xs">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-mono font-bold text-slate-900">
              No harvest records yet for {selectedCoop?.name || 'this cooperative'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Submit a harvest loss assessment to establish a performance baseline, calculate savings dividends, and compare against NISR survey benchmarks.
            </p>
          </div>
          <button
            onClick={onNavigateToDiagnostic}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Check losses for this cooperative</span>
          </button>
        </div>
      ) : (
        <>
          {/* 4-KPI Ceramic Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Monitored Seasons */}
            <div className="bg-white/95 border border-black/[0.05] p-5 rounded-2xl shadow-2xs">
              <span className="text-[10.5px] font-mono text-slate-400 font-bold uppercase block mb-1">RECORDED SEASONS</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-black text-slate-900 tnum">{totalSeasons}</span>
                <span className="text-[11px] font-mono font-semibold text-slate-500">
                  {totalHarvestedKg > 0 ? `~${(totalHarvestedKg / 1000).toFixed(0)}t logged` : ''}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Verified cooperative aggregation records
              </span>
            </div>

            {/* Weighted Multi-Season Loss Rate */}
            <div className="bg-white/95 border border-black/[0.05] p-5 rounded-2xl shadow-2xs">
              <span className="text-[10.5px] font-mono text-slate-400 font-bold uppercase block mb-1">WEIGHTED AVERAGE LOSS</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-black text-emerald-700 tnum">{avgLoss}%</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  numericAvgLoss <= 10.22 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
                }`}>
                  {numericAvgLoss <= 10.22 ? 'Below Nat’l' : 'Above Nat’l'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                vs. 10.22% National Average
              </span>
            </div>

            {/* Cumulative Revenue Forfeited */}
            <div className="bg-white/95 border border-black/[0.05] p-5 rounded-2xl shadow-2xs">
              <span className="text-[10.5px] font-mono text-slate-400 font-bold uppercase block mb-1">CUMULATIVE CASH FORFEITED</span>
              <span className="text-2xl font-mono font-black text-amber-800 tnum block">
                {totalRwfLost > 0 ? `~${(totalRwfLost / 1000000).toFixed(2)}M RWF` : '0 RWF'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                {totalLossKg > 0 ? `${(totalLossKg / 1000).toFixed(1)} tons depleted` : 'Zero depletion'}
              </span>
            </div>

            {/* Recurring Bottleneck Driver */}
            <div className="bg-white/95 border border-black/[0.05] p-5 rounded-2xl shadow-2xs">
              <span className="text-[10.5px] font-mono text-slate-400 font-bold uppercase block mb-1">PRIMARY BOTTLENECK</span>
              <span className="text-lg font-mono font-bold text-slate-900 capitalize truncate block">
                {topRecurringCause}
              </span>
              <span className="text-[10px] text-rose-600 font-medium block mt-1">
                Leading driver across recorded harvests
              </span>
            </div>
          </div>

          {/* Multi-Season Supply Chain Driver Matrix */}
          {cumulativeCauses.length > 0 && (
            <div className="bg-white/95 rounded-[28px] border border-black/[0.06] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Supply Chain Loss Allocation</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Proportion of cumulative losses attributed to each supply chain stage across all recorded seasons.
                  </p>
                </div>
                <span className="text-[10.5px] font-mono text-slate-500 font-semibold self-start sm:self-auto bg-slate-50 px-2.5 py-1 rounded-full border border-black/[0.05]">
                  Total Cumulative Loss: <strong className="text-slate-900 font-bold">{(totalLossKg / 1000).toFixed(1)} tons</strong>
                </span>
              </div>

              {/* Multi-segment Cumulative Stacked Bar */}
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                {cumulativeCauses.map((c, i) => (
                  <div
                    key={c.key}
                    style={{ width: `${c.pct}%` }}
                    className={`h-full ${causeColorPalette[i % causeColorPalette.length]} transition-all duration-300`}
                    title={`${c.name}: ${c.pct}% (${(c.kg / 1000).toFixed(1)}t)`}
                  />
                ))}
              </div>

              {/* Legend Chips */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono">
                {cumulativeCauses.slice(0, 5).map((c, i) => (
                  <div key={c.key} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${causeColorPalette[i % causeColorPalette.length]} shrink-0`} />
                    <span className="text-slate-600 font-medium">{c.name}:</span>
                    <strong className="text-slate-900">{c.pct}%</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seasonal Trend Chart Card */}
          <div className="bg-white/95 rounded-[28px] border border-black/[0.06] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.05]">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
                  Season-over-Season Performance Trajectory (vs. District & NST2 Targets)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-black/[0.05] font-bold">
                SEASONAL RECORDS
              </span>
            </div>

            <HistoryTrendChart assessments={assessments} />
          </div>

          {/* Historical Assessment Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-700 uppercase">
                Harvest Assessment History
              </h3>
              <span className="text-[10.5px] font-mono text-slate-400">
                {assessments.length} logged harvests
              </span>
            </div>
            <AssessmentTable 
              assessments={assessments} 
              onViewReport={onViewReport} 
            />
          </div>
        </>
      )}
    </div>
  );
}
