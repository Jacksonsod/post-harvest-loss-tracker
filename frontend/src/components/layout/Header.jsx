import React from 'react';
import { Activity } from 'lucide-react';

export default function Header({ 
  isBackendLive = true 
}) {
  return (
    <header className="border-b border-black/[0.06] bg-white/90 backdrop-blur-xl px-4 lg:px-8 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all">
      <div className="flex items-center justify-between gap-3 max-w-[1720px] mx-auto w-full">
        {/* Left: Clean Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black tracking-wide text-slate-900 uppercase font-mono">
                RWANDA SITUATION ROOM
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                NST2
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
                NISR SAS 2024–25
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              National Post-Harvest Loss Tracker
            </p>
          </div>
        </div>

        {/* Right: Clean Backend Status indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-black/[0.07] text-[11px] shadow-2xs shrink-0">
          <span className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-amber-500'} animate-pulse`} />
          <span className="font-mono text-slate-700 font-bold text-[10px]">
            {isBackendLive ? 'API LIVE' : 'DEMO'}
          </span>
        </div>
      </div>
    </header>
  );
}
