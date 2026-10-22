import React from 'react';
import { DISTRICT_LOSS_RANKINGS, DISTRICT_CAUSE_INTENSITY } from '../../data/nationalMetrics';
import { Flame, AlertTriangle, ShieldAlert, Award } from 'lucide-react';

export default function DistrictHotspots({ 
  selectedDistrict, 
  onSelectDistrict, 
  activeCause 
}) {
  let rankedDistricts = [...DISTRICT_LOSS_RANKINGS];

  if (activeCause && activeCause !== 'all') {
    rankedDistricts.sort((a, b) => {
      const shareA = DISTRICT_CAUSE_INTENSITY[a.district]?.[activeCause] || 0;
      const shareB = DISTRICT_CAUSE_INTENSITY[b.district]?.[activeCause] || 0;
      return shareB - shareA;
    });
  }

  const top10 = rankedDistricts.slice(0, 10);

  return (
    <div className="bg-white border border-black/[0.05] rounded-[28px] p-6 flex flex-col h-[560px] shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300">
      {/* Header Strip */}
      <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] mb-3.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 animate-pulse" />
          </div>
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase truncate">
            {activeCause && activeCause !== 'all'
              ? `${activeCause.replace('_', ' ').toUpperCase()} HOTSPOTS`
              : 'DISTRICT LOSS HOTSPOTS'}
          </h3>
        </div>
        <span className="text-[9px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-black/[0.04] flex-shrink-0">
          TOP 10
        </span>
      </div>

      {/* District Hotspots List */}
      <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 no-scrollbar">
        {top10.map((d, index) => {
          const isSelected = selectedDistrict === d.district;
          const causeIntensity = activeCause && activeCause !== 'all' 
            ? DISTRICT_CAUSE_INTENSITY[d.district]?.[activeCause] || 0
            : null;

          const isCritical = index < 3;
          const medalColor = index === 0 
            ? 'bg-amber-100 text-amber-900 border-amber-300' 
            : index === 1 
            ? 'bg-slate-200 text-slate-800 border-slate-300' 
            : index === 2 
            ? 'bg-amber-50 text-amber-800 border-amber-200' 
            : 'bg-slate-100 text-slate-600 border-black/[0.04]';

          return (
            <div
              key={d.district}
              onClick={() => onSelectDistrict(d.district === selectedDistrict ? null : d.district)}
              className={`p-3.5 px-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
                isSelected
                  ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                  : 'bg-slate-50/70 border-black/[0.04] hover:border-black/[0.1] hover:bg-slate-100/80 hover:-translate-y-0.5 hover:shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-mono text-[10px] font-black border ${medalColor}`}>
                    {index + 1}
                  </span>
                  <span className={`font-bold text-xs ${isSelected ? 'text-emerald-950 font-black' : 'text-slate-900'}`}>
                    {d.district}
                  </span>
                  {isCritical && (!activeCause || activeCause === 'all') && (
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 font-black">
                      CRITICAL
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-mono font-extrabold text-slate-900 text-xs tnum">
                    {causeIntensity !== null ? `${causeIntensity}%` : `${d.avg_loss_rate_pct}%`}
                  </span>
                  <span className="text-[9px] text-slate-400 block font-mono">
                    {causeIntensity !== null ? 'driver intensity' : 'avg loss rate'}
                  </span>
                </div>
              </div>

              {/* Loss bar visual */}
              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCritical ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, ((causeIntensity !== null ? causeIntensity : d.avg_loss_rate_pct) / 20) * 100)}%`
                  }}
                />
              </div>

              {/* Sub-label with top crop and NST2 gap */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5 font-mono">
                <span>Top Crop: <strong className="text-slate-800 font-semibold">{d.top_crop}</strong></span>
                <span className="text-rose-700 font-bold">{d.top_crop_rate}% loss</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
