import React from 'react';
import { 
  Radar, 
  ClipboardCheck, 
  TrendingDown, 
  Database, 
  FileText,
  Calendar,
  ChevronDown
} from 'lucide-react';

export const SEASONS_LIST = [
  { id: 'all', label: 'All Seasons (2024–25)', badge: '134k plots' },
  { id: '2024-A', label: 'Season 2024 A', badge: 'Maize & Cereals' },
  { id: '2024-B', label: 'Season 2024 B', badge: 'Legumes & Tubers' },
  { id: '2024-C', label: 'Season 2024 C', badge: 'Marshland Crops' },
  { id: '2025-A', label: 'Season 2025 A', badge: 'Maize & Cereals' },
  { id: '2025-B', label: 'Season 2025 B', badge: 'Legumes & Tubers' },
];

export default function Navigation({ 
  activeTab, 
  onSelectTab, 
  activeSeason = 'all', 
  onSelectSeason, 
  onOpenReportModal 
}) {
  const tabs = [
    { id: 'situation_room', label: 'Situation Room', icon: Radar },
    { id: 'diagnostic', label: 'Diagnostic Engine', icon: ClipboardCheck },
    { id: 'history', label: 'Performance Trends', icon: TrendingDown },
    { id: 'explorer', label: 'Benchmark Explorer', icon: Database },
  ];

  return (
    <div className="border-b border-black/[0.05] bg-white/70 backdrop-blur-xl sticky top-0 z-30 px-4 lg:px-8 py-2.5 transition-all">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4 flex-nowrap">
        {/* Left: Tab Navigation Segmented Bar */}
        <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-black/[0.04] overflow-x-auto no-scrollbar shrink-0 shadow-2xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-[0.97] ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-bold border border-black/[0.04]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Integrated Season Switcher Dropdown & Export Action */}
        <div className="flex items-center gap-2.5 flex-nowrap shrink-0">
          {/* Season Dropdown Capsule */}
          <div className="flex items-center bg-white border border-black/[0.07] hover:border-black/[0.15] rounded-full px-3 py-1 transition-all shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0 mr-1.5" />
            <select
              value={activeSeason}
              onChange={(e) => onSelectSeason && onSelectSeason(e.target.value)}
              aria-label="Filter dataset by season"
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1 appearance-none hover:text-slate-950 transition-colors"
            >
              {SEASONS_LIST.map((s) => (
                <option key={s.id} value={s.id} className="bg-white text-slate-900 font-medium">
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none shrink-0" />
          </div>

          {/* Quick Action: Printable Advisory Report */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all active:scale-[0.96] shadow-xs hover:shadow-sm shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Export Advisory Report</span>
            <span className="sm:hidden">Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
