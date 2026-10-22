import React from 'react';
import { Calendar } from 'lucide-react';

export const SEASONS_LIST = [
  { id: '2024-A', label: '2024 A', desc: 'Season 2024A (Maize & Cereals)' },
  { id: '2024-B', label: '2024 B', desc: 'Season 2024B (Legumes & Tubers)' },
  { id: '2024-C', label: '2024 C', desc: 'Season 2024C (Marshland Crops)' },
  { id: '2025-A', label: '2025 A', desc: 'Season 2025A (Maize & Cereals)' },
  { id: '2025-B', label: '2025 B', desc: 'Season 2025B (Legumes & Tubers)' },
  { id: 'all', label: 'ALL SEASONS', desc: 'Combined NISR 2024–2025 Baseline (134,766 plots)' },
];

export default function SeasonTimeline({ activeSeason, onSelectSeason }) {
  const currentSeasonObj = SEASONS_LIST.find((s) => s.id === activeSeason) || SEASONS_LIST[5];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-black/[0.05] rounded-2xl p-3 px-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2.5 text-xs text-slate-700">
        <div className="w-6 h-6 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-3.5 h-3.5" />
        </div>
        <span className="font-mono text-[10.5px] uppercase tracking-wider font-bold text-slate-400">SURVEY TIMELINE:</span>
        <span className="font-bold text-slate-800 text-xs hidden md:inline">{currentSeasonObj.desc}</span>
      </div>

      <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-black/[0.04]">
        {SEASONS_LIST.map((season) => {
          const isActive = activeSeason === season.id;
          return (
            <button
              key={season.id}
              onClick={() => onSelectSeason(season.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {season.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
