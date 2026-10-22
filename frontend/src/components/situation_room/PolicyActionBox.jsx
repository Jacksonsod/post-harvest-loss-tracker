import React from 'react';
import { CAUSE_METADATA } from '../../data/nationalMetrics';
import { Wrench, ShieldAlert } from 'lucide-react';

export default function PolicyActionBox({ activeCause, onSelectCause }) {
  const currentCause = activeCause && activeCause !== 'all' 
    ? CAUSE_METADATA[activeCause] 
    : CAUSE_METADATA['insects_pests'];

  if (!currentCause) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-50/60 via-white to-emerald-50/60 border border-black/[0.05] rounded-[26px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Cause Identity & Stats */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white flex-shrink-0 shadow-xs mt-0.5">
            <Wrench className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9.5px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-extrabold uppercase">
                NST2 MITIGATION ACTION ENGINE
              </span>
              <span className="text-xs font-mono font-extrabold text-slate-800">
                {currentCause.name} ({currentCause.share}% National Share)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 font-sans leading-relaxed max-w-2xl font-medium">
              {currentCause.actionAdvice}
            </p>
          </div>
        </div>

        {/* Right: Key Focus Hotspots */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/95 p-3 px-4 rounded-2xl border border-black/[0.05] text-xs shadow-xs">
          <div>
            <span className="text-[9.5px] text-slate-400 block font-mono font-bold uppercase tracking-wider">TARGET DISTRICTS:</span>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {currentCause.hotspotDistricts.map(d => (
                <span key={d} className="px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-800 text-[10.5px] font-bold border border-black/[0.06] shadow-2xs">
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t sm:border-t-0 sm:border-l border-black/[0.05] pt-2 sm:pt-0 sm:pl-3">
            <span className="text-[9.5px] text-slate-400 block font-mono font-bold uppercase tracking-wider">TARGET CROPS:</span>
            <span className="text-slate-900 text-[11px] font-extrabold">
              {currentCause.primaryCrops.join(', ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
