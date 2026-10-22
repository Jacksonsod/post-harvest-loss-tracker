import React from 'react';
import CauseDonutChart from './CauseDonutChart';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Lightbulb, 
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Layers
} from 'lucide-react';

const TACTICAL_ACTIONS = {
  insects_pests: [
    { 
      title: 'PICS Hermetic Bag Adoption', 
      desc: 'Seal dried grains in multi-layer hermetic bags to asphyxiate weevils and prevent grain borer proliferation.',
      effort: 'Immediate Adoption',
      impact: 'High Impact'
    },
    { 
      title: 'Moisture Cutoff Validation', 
      desc: 'Enforce strict 13.5% kernel moisture threshold using portable digital moisture meters prior to bagging.',
      effort: 'Pre-Bagging Gate',
      impact: 'Critical'
    },
    { 
      title: 'Raised Pallet Stacking', 
      desc: 'Maintain 50cm clearance from warehouse walls and 15cm off bare concrete using wooden pallets.',
      effort: 'Warehouse Protocol',
      impact: 'Medium Impact'
    }
  ],
  theft: [
    { 
      title: 'Cooperative Night Watch Rotation', 
      desc: 'Schedule 2-person watch shifts across field drying grounds during peak desiccation window.',
      effort: 'Community Rota',
      impact: 'High Impact'
    },
    { 
      title: 'Secure Centralized Aggregation', 
      desc: 'Transfer field-staged grain to locked cooperative warehouses within 24 hours of harvest.',
      effort: 'Transit Window',
      impact: 'High Impact'
    },
    { 
      title: 'Traceability Serial Seals', 
      desc: 'Fasten tamper-evident numbered zip-tags on all aggregated bags before transit.',
      effort: 'Logistics Protocol',
      impact: 'Medium Impact'
    }
  ],
  stalks_fallen: [
    { 
      title: 'Timely Harvest Trigger', 
      desc: 'Harvest within 7 days of physiological maturity to prevent stem rot and stalk breakage under rain.',
      effort: 'Timing Window',
      impact: 'High Impact'
    },
    { 
      title: 'Lodging-Resistant Seed Selection', 
      desc: 'Transition cooperative farmers to certified stiff-stem hybrid varieties (e.g. RHM 104).',
      effort: 'Next Season Planning',
      impact: 'High Impact'
    }
  ],
  storage: [
    { 
      title: 'Ventilated Solar Cribs', 
      desc: 'Erect narrow wire-mesh drying cribs facing prevailing winds to accelerate moisture removal.',
      effort: 'Facility Upgrade',
      impact: 'High Impact'
    },
    { 
      title: 'Warehouse Fumigation Protocol', 
      desc: 'Conduct bi-monthly certified phosphine fumigation in sealed grain storage units.',
      effort: 'Certified Service',
      impact: 'Critical'
    }
  ],
  default: [
    { 
      title: 'Immediate Crop Handling Training', 
      desc: 'Train harvesters on gentle handling to avoid micro-punctures and bruising.',
      effort: 'Field Workshop',
      impact: 'Medium Impact'
    },
    { 
      title: 'Moisture Testing Routine', 
      desc: 'Ensure moisture content meets national quality standards before bulk storage.',
      effort: 'Quality Control',
      impact: 'High Impact'
    },
    { 
      title: 'Direct Market Offtake Agreements', 
      desc: 'Pre-contract crop sales to minimize storage duration at the cooperative facility.',
      effort: 'Commercial Linkage',
      impact: 'High Impact'
    }
  ]
};

export default function ResultCard({ 
  result, 
  onOpenReportModal, 
  coopName, 
  cropName, 
  districtName 
}) {
  if (!result) return null;

  const isLow = result.risk_category === 'Low';
  const isMedium = result.risk_category === 'Medium';
  const isHigh = result.risk_category === 'High';

  const riskBadgeColor = 
    isLow ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
    isMedium ? 'bg-amber-50 text-amber-800 border-amber-300' :
    'bg-rose-50 text-rose-800 border-rose-300';

  const riskIcon = 
    isLow ? <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" /> :
    isMedium ? <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" /> :
    <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />;

  const gap = result.loss_rate_pct - result.benchmark_loss_rate_pct;
  const dominantKey = result.dominant_cause || 'default';
  const actions = TACTICAL_ACTIONS[dominantKey] || TACTICAL_ACTIONS.default;

  // Calculate economic recovery potential if brought to NST2 target of 5.0%
  const targetPct = 5.0;
  const recoverableRatio = result.loss_rate_pct > targetPct 
    ? (result.loss_rate_pct - targetPct) / result.loss_rate_pct 
    : 0;
  const recoveryPotentialRwf = result.estimated_loss_value_rwf 
    ? Math.round(result.estimated_loss_value_rwf * recoverableRatio)
    : 0;

  return (
    <div className="bg-white/95 border border-black/[0.06] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs space-y-5 animate-in fade-in duration-300">
      {/* Top Banner: Risk Status & Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-black/[0.04] gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-black/[0.05] shadow-2xs">
            {riskIcon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${riskBadgeColor}`}>
                {result.risk_category.toUpperCase()} RISK CLASSIFICATION
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ASSESSMENT #{result.assessment_id}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-1">
              Assessment for {coopName || 'Cooperative'} • <span className="text-emerald-700 font-semibold">{cropName}</span> in {districtName}
            </h3>
          </div>
        </div>

        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all active:scale-[0.96] shadow-xs shrink-0 self-start sm:self-auto"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export Official Report</span>
        </button>
      </div>

      {/* Visual Risk Continuum Meter Bar */}
      <div className="bg-slate-50/70 p-4 rounded-2xl border border-black/[0.04]">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="font-mono text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
            Risk Continuum Meter:
          </span>
          <span className="font-mono text-xs font-black text-slate-900">
            {result.loss_rate_pct.toFixed(1)}% Measured Loss
          </span>
        </div>

        {/* Multi-segment Gradient Gauge */}
        <div className="relative w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
          <div className="w-[42%] h-full bg-emerald-500" title="Low Risk Zone (<= 10.6%)" />
          <div className="w-[15%] h-full bg-amber-400" title="Medium Risk Zone (10.6% - 14.3%)" />
          <div className="w-[43%] h-full bg-rose-500" title="High Risk Zone (> 14.3%)" />
        </div>

        {/* Labels below Gauge */}
        <div className="flex justify-between items-center text-[9.5px] font-mono text-slate-400 mt-1.5 px-0.5">
          <span>0% (Resilient)</span>
          <span className="text-emerald-700 font-bold">10.6% (NST2 Baseline)</span>
          <span className="text-rose-600 font-bold">14.3% (Threshold)</span>
          <span>25%+ (Severe)</span>
        </div>
      </div>

      {/* Primary KPI Grid (4 Columns including Economic Recovery Potential) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Actual Loss Rate */}
        <div className="bg-white p-4 rounded-2xl border border-black/[0.05] shadow-2xs">
          <span className="text-[11px] text-slate-500 block mb-1">Cooperative Loss Rate</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-black text-slate-900 tnum">
              {result.loss_rate_pct.toFixed(1)}%
            </span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
              gap <= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
            }`}>
              {gap > 0 ? `+${gap.toFixed(1)}%` : `${gap.toFixed(1)}%`}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            Ref: {result.benchmark_loss_rate_pct.toFixed(1)}%
          </span>
        </div>

        {/* Economic Translation in RWF */}
        <div className="bg-white p-4 rounded-2xl border border-black/[0.05] shadow-2xs">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-rose-600" />
            <span>Financial Loss</span>
          </div>
          <span className="text-2xl font-mono font-black text-rose-800 tnum block">
            {result.estimated_loss_value_rwf 
              ? `${(result.estimated_loss_value_rwf / 1000000).toFixed(2)}M RWF` 
              : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            At 520 RWF/kg farmgate price
          </span>
        </div>

        {/* Economic Recovery Potential */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold">NST2 Recovery Potential</span>
          </div>
          <span className="text-2xl font-mono font-black text-emerald-800 tnum block">
            {recoveryPotentialRwf > 0 
              ? `+${(recoveryPotentialRwf / 1000000).toFixed(2)}M RWF`
              : 'Fully Compliant'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            If reduced to ≤5% NST2 target
          </span>
        </div>

        {/* Dominant Loss Cause */}
        <div className="bg-white p-4 rounded-2xl border border-black/[0.05] shadow-2xs">
          <span className="text-[11px] text-slate-500 block mb-1">Leading Loss Driver</span>
          <span className="text-base font-mono font-bold text-slate-900 capitalize block truncate">
            {result.dominant_cause ? result.dominant_cause.replace('_', ' ') : 'Not Specified'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            {result.dominant_cause_is_estimated 
              ? 'NISR crop average' 
              : 'Itemized entry'}
          </span>
        </div>
      </div>

      {/* Two Columns: Action Engine Recommendation + Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
        {/* Action Engine Prescription Card */}
        <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200/70 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 mb-2">
              <Lightbulb className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                NST2 MITIGATION ACTION DIRECTIVE
              </h4>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans mt-2 font-medium">
              {result.recommendation}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-200/70 flex items-center justify-between text-[11px] text-slate-600 font-mono">
            <span>Aligned with NST2 Target: ≤5.0% Loss</span>
            <span className="text-emerald-700 font-bold bg-emerald-100/60 px-2.5 py-0.5 rounded-full text-[10px]">
              CERTIFIED NISR PROTOCOL
            </span>
          </div>
        </div>

        {/* Cause-of-Loss Donut Chart */}
        <div className="bg-white p-4 rounded-2xl border border-black/[0.05] shadow-2xs">
          <CauseDonutChart 
            breakdownPct={result.cause_of_loss_breakdown_pct} 
            isEstimated={result.dominant_cause_is_estimated}
          />
        </div>
      </div>

      {/* Prescriptive Tactical Action Checklist */}
      <div className="bg-white p-5 rounded-2xl border border-black/[0.05] shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              PRESCRIPTIVE TACTICAL INTERVENTIONS
            </h4>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
            {actions.length} ACTIONS READY
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {actions.map((act, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-50/70 border border-black/[0.04] text-xs flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-mono shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-[9.5px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-black/[0.05]">
                    {act.effort}
                  </span>
                </div>
                <h5 className="font-bold text-slate-900 leading-tight mb-1">{act.title}</h5>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                  {act.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-[10px] font-mono text-emerald-700 font-bold">
                <span>{act.impact}</span>
                <span className="text-slate-400">NST2 Aligned</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
