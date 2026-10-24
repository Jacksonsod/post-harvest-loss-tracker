import React from 'react';
import { CAUSE_LABELS } from '../../data/staticData';
import { Flame, AlertTriangle, ShieldAlert, Award } from 'lucide-react';

export default function DistrictHotspots({ 
  selectedDistrict, 
  onSelectDistrict, 
  districts = [],
  nationalReference = 10.22,
  activeCause = 'all'
}) {
  const ranked = [...districts].sort((a, b) => (b.avg_loss_rate_pct || 0) - (a.avg_loss_rate_pct || 0));
  const top10 = ranked.slice(0, 10);
  const activeCauseMeta = activeCause !== 'all' ? CAUSE_LABELS[activeCause] : null;

  return (
    <div className="bg-white border border-black/[0.05] rounded-[28px] p-6 flex flex-col h-[560px] shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300">
      {/* Header Strip */}
      <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] mb-3.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase truncate">
              WHERE LOSSES ARE HIGHEST
            </h3>
            <span className="text-[10px] text-slate-400 font-mono block">
              {activeCauseMeta ? `Survey rate • ${activeCauseMeta.shortName} focus` : 'Ranked by SAS survey loss rate'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {activeCauseMeta && (
            <span 
              className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold text-white shadow-2xs"
              style={{ backgroundColor: activeCauseMeta.hex }}
            >
              {activeCauseMeta.shortName}
            </span>
          )}
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-black/[0.04]">
            TOP 10
          </span>
        </div>
      </div>

      {/* District Hotspots List */}
      <div className="space-y-2 overflow-y-auto pr-1 flex-1 no-scrollbar">
        {top10.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-xs text-slate-400 font-mono animate-pulse">
            Loading district loss rates...
          </div>
        ) : (
          top10.map((d, index) => {
            const isSelected = selectedDistrict === d.district;
            const rate = d.avg_loss_rate_pct || 0;
            const isAbove = rate > nationalReference;
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
                className={`p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                    : 'bg-slate-50/70 border-black/[0.04] hover:border-black/[0.1] hover:bg-slate-100/80 hover:-translate-y-0.5 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-mono text-[10px] font-black border ${medalColor}`}>
                      {index + 1}
                    </span>
                    <span className={`font-bold text-xs ${isSelected ? 'text-emerald-950 font-black' : 'text-slate-900'}`}>
                      {d.district}
                    </span>
                    {d.high_volatility && (
                      <span className="text-[8px] font-mono px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold" title="Unusually variable season">
                        VOLATILE
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-extrabold text-slate-900 text-xs tnum">
                      {rate.toFixed(2)}%
                    </span>
                    <span className={`text-[9px] block font-mono font-bold ${isAbove ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {isAbove ? `+${(rate - nationalReference).toFixed(1)}% vs nat'l` : `-${(nationalReference - rate).toFixed(1)}% vs nat'l`}
                    </span>
                  </div>
                </div>

                {/* Loss bar visual */}
                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      rate > nationalReference * 1.25 ? 'bg-rose-500' : rate > nationalReference ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (rate / 25) * 100)}%` }}
                  />
                </div>

                {/* Sub-label */}
                <div className="flex justify-between items-center text-[9.5px] text-slate-500 mt-1 font-mono">
                  <span>{d.n_records ? `${d.n_records.toLocaleString()} plots` : 'Survey sample'}</span>
                  <span>{d.above_reference ? 'Above Baseline' : 'Within Baseline'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
