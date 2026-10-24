import React from 'react';
import { Target, AlertTriangle, ArrowRight, Info, CheckCircle2 } from 'lucide-react';

export default function DistrictTooltip({ hoveredDistrict, mousePos }) {
  if (!hoveredDistrict) return null;

  const district = hoveredDistrict.name;
  const isWithoutData = hoveredDistrict.isWithoutData;
  const dData = hoveredDistrict.data;
  const nationalRef = hoveredDistrict.nationalReference || 10.22;

  return (
    <div
      className="fixed pointer-events-none z-50 bg-white/95 border border-black/[0.08] rounded-2xl p-4 shadow-[0_16px_36px_rgba(0,0,0,0.12)] backdrop-blur-xl w-72 text-xs font-mono text-slate-800 transition-transform duration-75 animate-in fade-in zoom-in-95"
      style={{
        left: `${Math.min(window.innerWidth - 310, mousePos.x + 18)}px`,
        top: `${Math.max(20, mousePos.y - 60)}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/[0.05] pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900 uppercase text-xs tracking-wide">
            {district} DISTRICT
          </span>
        </div>
        {isWithoutData ? (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-black/[0.05]">
            NO DATA
          </span>
        ) : (
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
            dData?.avg_loss_rate_pct >= nationalRef * 1.25 ? 'bg-rose-50 text-rose-700 border border-rose-200' :
            dData?.avg_loss_rate_pct >= nationalRef ? 'bg-amber-50 text-amber-800 border border-amber-200' :
            'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            {dData?.avg_loss_rate_pct >= nationalRef * 1.25 ? 'HIGH RISK' :
             dData?.avg_loss_rate_pct >= nationalRef ? 'ELEVATED' : 'RESILIENT'}
          </span>
        )}
      </div>

      {/* Metrics */}
      {isWithoutData ? (
        <div className="py-2 text-[11px] text-slate-500 font-sans">
          Not enough survey observations in NISR SAS dataset for this specific crop and season combination.
        </div>
      ) : dData ? (
        <div className="space-y-2 text-[11px]">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500 font-medium">Average Loss Rate:</span>
              <span className="font-black text-xs tnum text-slate-900">
                {dData.avg_loss_rate_pct?.toFixed(2)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  dData.avg_loss_rate_pct >= nationalRef ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (dData.avg_loss_rate_pct / 20) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              ≈ {Math.round(dData.avg_loss_rate_pct)} kg lost per 100 kg harvested
            </span>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-black/[0.04]">
            <span className="text-slate-500 font-medium">Survey Base:</span>
            <span className="font-bold text-slate-800">
              {dData.n_records?.toLocaleString()} plots surveyed
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">vs National Reference:</span>
            <span className={`font-bold ${
              dData.avg_loss_rate_pct >= nationalRef ? 'text-rose-600' : 'text-emerald-700'
            }`}>
              {dData.avg_loss_rate_pct >= nationalRef
                ? `+${(dData.avg_loss_rate_pct - nationalRef).toFixed(2)}% higher`
                : `-${(nationalRef - dData.avg_loss_rate_pct).toFixed(2)}% lower`}
            </span>
          </div>

          {dData.high_volatility && (
            <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[9.5px] text-amber-800 font-sans">
              ⚠️ Highly variable harvest loss observed in survey records.
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-3 pt-2 border-t border-black/[0.05] text-[10px] text-slate-500 font-medium flex items-center justify-between">
        <span>Click district to select</span>
        <ArrowRight className="w-3 h-3 text-slate-400" />
      </div>
    </div>
  );
}
