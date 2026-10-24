import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ShieldCheck, Target, TrendingDown, ArrowRight, Award, Info } from 'lucide-react';

export default function PolicyActionBox({ onNavigateToCheckLosses, onNavigateToPlanSeason }) {
  const [policy, setPolicy] = useState(null);
  const [national, setNational] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getPolicyAlignment().catch(() => null),
      api.getNationalSummary().catch(() => null),
    ]).then(([pData, nData]) => {
      if (isMounted) {
        if (pData) setPolicy(pData);
        if (nData) setNational(nData);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const baseline = policy?.national_baseline_2023_pct || 13.8;
  const target = policy?.national_target_2029_pct || 5.0;
  const current = policy?.survey_derived_current_estimate_pct || national?.overall_avg_loss_rate_pct || 10.22;
  const currentGap = (current - target).toFixed(1);

  return (
    <div className="bg-white/95 border border-black/[0.06] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-tight text-slate-900 uppercase">
              National Policy Alignment — Rwanda NST2 Target
            </h3>
            <span className="text-[10px] text-slate-400 font-mono block">
              Official government goals vs. NISR SAS survey-derived benchmarks
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToPlanSeason && (
            <button
              onClick={onNavigateToPlanSeason}
              className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs"
            >
              <span>Plan next season</span>
              <ArrowRight className="w-3 h-3 text-emerald-400" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Official 2023 Baseline */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-black/[0.04] font-mono">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            OFFICIAL 2023 BASELINE
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-700 tnum">{baseline}%</span>
            <span className="text-xs text-slate-400 font-medium">loss</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1 font-sans">
            Source: Rwanda NST2 (presented to Parliament, August 2026)
          </span>
        </div>

        {/* Card 2: SAS Survey Derived Current Rate */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-500/20 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-800 font-bold uppercase">
              CURRENT SURVEY ESTIMATE
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
              SAS 2024–25
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-emerald-700 tnum">{current}%</span>
            <span className="text-xs text-emerald-600 font-medium">≈ 10 kg per 100 kg</span>
          </div>
          <span className="text-[10px] text-slate-600 block mt-1 font-sans">
            134,766 plots surveyed across all 30 districts
          </span>
        </div>

        {/* Card 3: Official 2029 NST2 Target */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase block">
              OFFICIAL 2029 TARGET
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-white tnum">≤ {target}%</span>
              <span className="text-[10px] text-slate-300">target threshold</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
            <span>Remaining national gap:</span>
            <span className="text-amber-300 font-bold">+{currentGap}% to goal</span>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 font-mono bg-slate-50/50 p-2.5 rounded-xl border border-black/[0.04]">
        * Note: The 10.22% figure is computed from the 2024–2025 NISR Seasonal Agricultural Survey data. It is shown for analytical context alongside the official government baseline (13.8%) and target (≤5.0%), not as an official policy replacement.
      </div>
    </div>
  );
}
