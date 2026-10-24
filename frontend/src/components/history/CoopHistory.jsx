import React, { useState, useEffect } from 'react';
import HistoryTrendChart from './HistoryTrendChart';
import AssessmentTable from './AssessmentTable';
import { api } from '../../api/client';
import { CAUSE_LABELS } from '../../data/staticData';
import { 
  Building2, 
  TrendingDown, 
  TrendingUp,
  AlertCircle, 
  Calendar,
  Layers,
  ChevronDown,
  ClipboardList,
  Calculator,
  ShieldCheck,
  Scale
} from 'lucide-react';

export default function CoopHistory({ 
  coops = [],
  selectedCoop, 
  onSelectCoop,
  onNavigateToPlanSeason, 
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
    numericAvgLoss <= 10.0 ? 'Grade A: Resilient' :
    numericAvgLoss <= 14.0 ? 'Grade B: Monitored' :
    'Grade C: At-Risk';

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
  const topCauseMeta = CAUSE_LABELS[cumulativeCauses[0]?.key];

  return (
    <div className="space-y-6">
      {/* Executive Cooperative Resilience Banner */}
      <div className="bg-white/95 rounded-[28px] border border-black/[0.06] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Interactive Cooperative Selector Dropdown */}
              <div className="relative inline-flex items-center">
                <select
                  value={selectedCoop?.id || ''}
                  onChange={(e) => {
                    const coopId = Number(e.target.value);
                    const found = coops.find((c) => c.id === coopId);
                    if (found && onSelectCoop) onSelectCoop(found);
                  }}
                  className="text-sm sm:text-base font-bold text-slate-900 bg-slate-50 hover:bg-slate-100 border border-black/[0.08] rounded-xl pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all shadow-2xs appearance-none font-mono"
                  aria-label="Switch cooperative"
                >
                  {coops.map((coop) => (
                    <option key={coop.id} value={coop.id}>
                      {coop.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-black/[0.05] font-semibold">
                {selectedCoop?.district} District
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                NISR-COOP-#{String(selectedCoop?.id || '01').padStart(2, '0')}
              </span>
            </div>

            {/* Performance Status & Trajectory */}
            <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium flex-wrap pt-0.5">
              <span className={`text-[10.5px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${gradeColor}`}>
                {complianceGrade}
              </span>
              <span className={`flex items-center gap-1 font-mono font-bold text-[11px] ${
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
          onClick={onNavigateToPlanSeason}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm shadow-emerald-700/20 flex items-center gap-2 self-start md:self-auto shrink-0 cursor-pointer"
        >
          <Calculator className="w-3.5 h-3.5 text-emerald-200" />
          <span>Plan Season Mitigation</span>
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
              No historical records yet for {selectedCoop?.name || 'this cooperative'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Explore predictive yield simulations and storage infrastructure dividends for upcoming seasons.
            </p>
          </div>
          <button
            onClick={onNavigateToPlanSeason}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-emerald-700/20 active:scale-95 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-200" />
            <span>Plan season mitigation</span>
          </button>
        </div>
      ) : (
        <>
          {/* 4-KPI Ceramic Intelligence Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Monitored Seasons */}
            <div className="bg-white/95 rounded-2xl border border-black/[0.06] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                  Recorded Seasons
                </span>
                <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xs shadow-2xs">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-black text-slate-900 tnum">{totalSeasons}</span>
                  <span className="text-[11px] font-mono font-semibold text-slate-500">
                    {totalHarvestedKg > 0 ? `~${(totalHarvestedKg / 1000).toFixed(0)}t logged` : ''}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Aggregated seasonal harvest records
                </span>
              </div>
            </div>

            {/* Weighted Multi-Season Loss Rate */}
            <div className="bg-white/95 rounded-2xl border border-black/[0.06] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                  Weighted Avg Loss
                </span>
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-xs shadow-2xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-black text-emerald-700 tnum">{avgLoss}%</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    numericAvgLoss <= 10.22 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {numericAvgLoss <= 10.22 ? 'Below Nat’l' : 'Above Nat’l'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  vs. 10.22% National SAS Baseline
                </span>
              </div>
            </div>

            {/* Cumulative Revenue Forfeited */}
            <div className="bg-white/95 rounded-2xl border border-black/[0.06] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                  Revenue Forfeited
                </span>
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center text-xs shadow-2xs">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-2xl font-mono font-black text-amber-800 tnum block">
                  {totalRwfLost > 0 ? `~${(totalRwfLost / 1000000).toFixed(2)}M RWF` : '0 RWF'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {totalLossKg > 0 ? `${(totalLossKg / 1000).toFixed(1)} tons depleted` : 'Zero volume depleted'}
                </span>
              </div>
            </div>

            {/* Primary Loss Driver */}
            <div className="bg-white/95 rounded-2xl border border-black/[0.06] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                  Primary Loss Driver
                </span>
                <div 
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-xs shadow-2xs"
                  style={{ backgroundColor: `${topCauseMeta?.hex || '#10B981'}15`, color: topCauseMeta?.hex || '#10B981' }}
                >
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <span 
                  className="text-xl font-mono font-black capitalize truncate block"
                  style={{ color: topCauseMeta?.hex || '#0F172A' }}
                >
                  {topRecurringCause}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block">
                  {cumulativeCauses[0]?.pct || 0}% share of cumulative loss
                </span>
              </div>
            </div>
          </div>

          {/* Multi-Season Supply Chain Driver Matrix */}
          {cumulativeCauses.length > 0 && (
            <div className="bg-white/95 rounded-[28px] border border-black/[0.06] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/[0.05]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-tight">
                      Supply Chain Loss Allocation
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Cumulative volume lost across reported post-harvest stages
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-black/[0.04]">
                  Total Loss: <span className="text-emerald-700 font-extrabold">{(totalLossKg / 1000).toFixed(1)} tons</span>
                </span>
              </div>

              {/* Segmented Loss Allocation Track */}
              <div className="w-full h-3.5 rounded-full bg-slate-100 p-0.5 flex overflow-hidden border border-black/[0.04] shadow-inner gap-0.5">
                {cumulativeCauses.map((c) => {
                  const cMeta = CAUSE_LABELS[c.key];
                  return (
                    <div
                      key={c.key}
                      style={{ 
                        width: `${Math.max(c.pct, 2)}%`,
                        backgroundColor: cMeta?.hex || '#10B981'
                      }}
                      className="h-full rounded-full transition-all duration-300"
                      title={`${c.name}: ${c.pct}% (${(c.kg / 1000).toFixed(1)}t)`}
                    />
                  );
                })}
              </div>

              {/* Interactive Driver Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                {cumulativeCauses.slice(0, 6).map((c) => {
                  const cMeta = CAUSE_LABELS[c.key];
                  return (
                    <div 
                      key={c.key}
                      className="bg-slate-50/70 hover:bg-slate-100/80 rounded-xl p-2.5 border border-black/[0.04] transition-all flex flex-col justify-between gap-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: cMeta?.hex || '#10B981' }} 
                        />
                        <span className="text-[11px] font-mono font-medium text-slate-600 truncate" title={c.name}>
                          {c.name}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs font-mono">
                        <span className="font-bold text-slate-900 tnum">{c.pct}%</span>
                        <span className="text-[10px] text-slate-400 tnum">{(c.kg / 1000).toFixed(1)}t</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seasonal Trend Chart Card */}
          <div className="bg-white/95 rounded-[28px] border border-black/[0.06] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.05]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold tracking-tight text-slate-900 uppercase">
                    Seasonal Loss Trajectory
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Multi-season performance vs. district benchmark & NST2 target
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-black/[0.05] font-bold">
                {assessments.length} SEASONS
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
              onNavigateToPlanSeason={onNavigateToPlanSeason}
            />
          </div>
        </>
      )}
    </div>
  );
}
