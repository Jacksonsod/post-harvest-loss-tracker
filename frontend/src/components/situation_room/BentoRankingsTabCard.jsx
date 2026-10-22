import React, { useState } from 'react';
import { DISTRICT_LOSS_RANKINGS, DISTRICT_CAUSE_INTENSITY, TOP_VULNERABLE_CROPS } from '../../data/nationalMetrics';
import { Flame, Wheat, DollarSign, TrendingDown, ArrowUpRight } from 'lucide-react';

export default function BentoRankingsTabCard({ 
  selectedDistrict, 
  onSelectDistrict, 
  activeCause 
}) {
  const [activeTab, setActiveTab] = useState('hotspots'); // 'hotspots' | 'commodities'

  // Sort districts based on active cause or overall loss rate
  let rankedDistricts = [...DISTRICT_LOSS_RANKINGS];
  if (activeCause && activeCause !== 'all') {
    rankedDistricts.sort((a, b) => {
      const shareA = DISTRICT_CAUSE_INTENSITY[a.district]?.[activeCause] || 0;
      const shareB = DISTRICT_CAUSE_INTENSITY[b.district]?.[activeCause] || 0;
      return shareB - shareA;
    });
  }
  const top10Districts = rankedDistricts.slice(0, 10);
  const topCrops = TOP_VULNERABLE_CROPS.slice(0, 8);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col h-[520px]">
      {/* Tab Switcher Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 flex-shrink-0">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('hotspots')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
              activeTab === 'hotspots'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span>District Hotspots</span>
          </button>
          <button
            onClick={() => setActiveTab('commodities')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
              activeTab === 'commodities'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wheat className="w-3.5 h-3.5 text-amber-600" />
            <span>Commodities</span>
          </button>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-50 text-slate-500 font-bold border border-slate-200 hidden sm:inline-block">
          SAS 2024–25
        </span>
      </div>

      {/* Content Viewport with Custom Scroll */}
      <div className="space-y-2 overflow-y-auto pr-1 flex-1 no-scrollbar">
        {activeTab === 'hotspots' ? (
          top10Districts.map((d, index) => {
            const isSelected = selectedDistrict?.toLowerCase() === d.district.toLowerCase();
            const causeIntensity = activeCause && activeCause !== 'all' 
              ? DISTRICT_CAUSE_INTENSITY[d.district]?.[activeCause] || 0
              : null;

            return (
              <div
                key={d.district}
                onClick={() => onSelectDistrict(d.district === selectedDistrict ? null : d.district)}
                className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-cyan-50 border-cyan-400 shadow-2xs'
                    : 'bg-slate-50/80 border-slate-200/70 hover:border-slate-300 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                      index < 3 ? 'bg-rose-100 text-rose-700 font-extrabold' : 'bg-slate-200 text-slate-700'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className={`font-semibold ${isSelected ? 'text-cyan-900 font-bold' : 'text-slate-900'}`}>
                      {d.district}
                    </span>
                    {index < 3 && !activeCause && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                        HOTSPOT
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-extrabold text-slate-900 text-xs tnum">
                      {causeIntensity !== null ? `${causeIntensity}%` : `${d.avg_loss_rate_pct}%`}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {causeIntensity !== null ? 'cause share' : 'avg loss'}
                    </span>
                  </div>
                </div>

                {/* Loss bar visual */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      index < 3 ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{
                      width: `${Math.min(100, ((causeIntensity !== null ? causeIntensity : d.avg_loss_rate_pct) / 20) * 100)}%`
                    }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5 font-mono">
                  <span>Top Crop: <strong className="text-slate-800">{d.top_crop}</strong></span>
                  <span>{d.top_crop_rate}% loss</span>
                </div>
              </div>
            );
          })
        ) : (
          topCrops.map((c, idx) => {
            return (
              <div
                key={c.crop}
                className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-slate-400">#{idx + 1}</span>
                      <h4 className="text-xs font-bold text-slate-900">{c.crop}</h4>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                      Driver: <span className="text-amber-700 font-semibold capitalize">{c.dominant_cause?.replace('_', ' ')}</span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-extrabold text-rose-600 tnum block">
                      {c.loss_rate_pct}% loss
                    </span>
                    {c.price_rwf_per_kg && (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 tnum block">
                        {Math.round(c.price_rwf_per_kg)} RWF/kg
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                    style={{ width: `${Math.min(100, (c.loss_rate_pct / 20) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Card Footer Summary */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500 flex-shrink-0">
        <span>Click district row to lock map target</span>
        <span className="text-slate-400 font-medium">Sorted by severity</span>
      </div>
    </div>
  );
}
