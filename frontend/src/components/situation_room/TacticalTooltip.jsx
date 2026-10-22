import React from 'react';
import { DISTRICT_LOSS_RATES, DISTRICT_CAUSE_INTENSITY, DISTRICT_LOSS_RANKINGS } from '../../data/nationalMetrics';
import { PRESEEDED_COOPERATIVES } from '../../data/cooperativeLocations';
import { Target, AlertTriangle, ArrowRight } from 'lucide-react';

export default function TacticalTooltip({ hoveredDistrict, mousePos }) {
  if (!hoveredDistrict) return null;

  const district = hoveredDistrict.name;
  const lossRate = DISTRICT_LOSS_RATES[district] || 11.5;
  const causes = DISTRICT_CAUSE_INTENSITY[district] || {};
  const topCauseEntry = Object.entries(causes).sort((a, b) => b[1] - a[1])[0];
  const topCauseName = topCauseEntry ? topCauseEntry[0].replace('_', ' ') : 'pests';
  const topCausePct = topCauseEntry ? topCauseEntry[1] : 0;
  const districtStats = DISTRICT_LOSS_RANKINGS.find(d => d.district.toLowerCase() === district.toLowerCase());

  const coopsInDistrict = PRESEEDED_COOPERATIVES.filter(c => c.district === district);

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
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              lossRate >= 13 ? 'bg-rose-400' : 'bg-emerald-400'
            }`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              lossRate >= 13 ? 'bg-rose-500' : 'bg-emerald-500'
            }`} />
          </span>
          <span className="font-extrabold text-slate-900 uppercase text-xs tracking-wide">
            {district} DISTRICT
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold ${
          lossRate >= 13.5 ? 'bg-rose-50 text-rose-700 border border-rose-200/80' :
          lossRate >= 11.5 ? 'bg-amber-50 text-amber-800 border border-amber-200/80' :
          'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
        }`}>
          {lossRate >= 13.5 ? 'HOTSPOT' : lossRate >= 11.5 ? 'ELEVATED' : 'STABLE'}
        </span>
      </div>

      {/* Metrics */}
      <div className="space-y-2 text-[11px]">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-500 font-medium">Post-Harvest Loss Rate:</span>
            <span className={`font-extrabold text-xs tnum ${lossRate >= 13 ? 'text-rose-600' : 'text-slate-900'}`}>
              {lossRate.toFixed(2)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                lossRate >= 13.5 ? 'bg-rose-500' : lossRate >= 11.5 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (lossRate / 20) * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-0.5">
          <span className="text-slate-500 font-medium">Primary Vulnerability:</span>
          <span className="text-amber-800 font-bold capitalize bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/50">
            {topCauseName} ({topCausePct}%)
          </span>
        </div>

        {districtStats?.top_crop && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Top Vulnerable Crop:</span>
            <span className="text-slate-800 font-bold">{districtStats.top_crop} ({districtStats.top_crop_rate}%)</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Monitored Coops:</span>
          <span className="text-emerald-700 font-bold">{coopsInDistrict.length} Cooperatives</span>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-black/[0.05] text-[10px] text-slate-500 font-medium flex items-center justify-between">
        <span className="text-slate-600">Click district to lock & dispatch</span>
        <ArrowRight className="w-3 h-3 text-slate-400" />
      </div>
    </div>
  );
}
