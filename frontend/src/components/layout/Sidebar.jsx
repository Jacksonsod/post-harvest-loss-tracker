import React, { useState } from 'react';
import { 
  Radar, 
  ClipboardCheck, 
  TrendingDown, 
  Database, 
  FileText,
  Calendar,
  ChevronDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Activity,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { SEASONS_LIST } from './Navigation';

export default function Sidebar({
  activeTab,
  onSelectTab,
  activeSeason,
  onSelectSeason,
  coops = [],
  selectedCoop,
  onSelectCoop,
  onOpenNewCoopModal,
  onOpenReportModal,
  isBackendLive,
  isCollapsed,
  onToggleCollapse,
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { id: 'situation_room', label: 'Situation Room', icon: Radar, badge: 'ADM2 Map' },
    { id: 'diagnostic', label: 'Diagnostic Engine', icon: ClipboardCheck, badge: 'Loss Intake' },
    { id: 'history', label: 'Performance Trends', icon: TrendingDown, badge: 'Audit Trail' },
    { id: 'explorer', label: 'Benchmark Explorer', icon: Database, badge: 'SAS 2024-25' },
  ];

  const handleSelectNav = (id) => {
    onSelectTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header (Visible on screens < lg) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 border-b border-black/[0.06] backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-mono font-black text-slate-900 tracking-wider uppercase block">
              RWANDA SITUATION ROOM
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">
              NISR Post-Harvest Loss Tracker
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-black/[0.05] text-[10px] font-mono font-bold text-slate-700">
            <span className={`w-1.5 h-1.5 rounded-full ${isBackendLive ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
            {isBackendLive ? 'API LIVE' : 'DEMO'}
          </span>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Main Sidebar (Desktop fixed left rail, Mobile slide-in drawer) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen bg-white border-r border-black/[0.06] shadow-[2px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out flex flex-col justify-between ${
          // Mobile state
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop collapse state
          isCollapsed ? 'lg:w-[76px]' : 'lg:w-[272px]'
        }`}
      >
        {/* Top Segment: Brand & Authority */}
        <div className="p-4 border-b border-black/[0.05]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                <Activity className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-black text-slate-900 tracking-wider uppercase truncate">
                      NISR SITUATION ROOM
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold block">
                    NST2 • SAS 2024–25
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Collapse / Expand Toggle Button */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 items-center justify-center transition-all border border-black/[0.04] active:scale-90"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Middle Segment: Cooperative Selector + Navigation Tabs + Season Filter */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 no-scrollbar">
          {/* Active Cooperative Selector Capsule */}
          {!isCollapsed ? (
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-black/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-600" />
                  <span>ACTIVE COOPERATIVE</span>
                </span>
                <button
                  onClick={onOpenNewCoopModal}
                  className="text-[10px] font-mono font-bold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md transition-all flex items-center gap-0.5 shadow-2xs active:scale-95"
                  title="Register new cooperative"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>New</span>
                </button>
              </div>

              <div className="relative">
                <select
                  value={selectedCoop?.id || ''}
                  onChange={(e) => {
                    const coopId = Number(e.target.value);
                    const found = coops.find((c) => c.id === coopId);
                    if (found) onSelectCoop(found);
                  }}
                  className="w-full text-xs font-semibold bg-white border border-black/[0.08] hover:border-black/[0.15] rounded-xl px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-2xs truncate pr-6 appearance-none transition-all"
                  aria-label="Select active cooperative"
                >
                  {coops.map((coop) => (
                    <option key={coop.id} value={coop.id} className="text-slate-900 font-medium">
                      {coop.name} ({coop.district})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>

              {selectedCoop && (
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-0.5">
                  <span className="truncate">{selectedCoop.district || 'District Base'}</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60 shrink-0">
                    ID #{String(selectedCoop.id).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={onToggleCollapse}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-black/[0.05] flex items-center justify-center transition-all"
                title={`Active: ${selectedCoop?.name || 'Cooperative'} (Click to expand)`}
              >
                <Building2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Items */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                PLATFORM MODULES
              </span>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between overflow-hidden">
                      <span className="truncate">{item.label}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                        isActive 
                          ? 'bg-white/15 text-white' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Season Filter Dropdown */}
          {!isCollapsed ? (
            <div className="pt-2 border-t border-black/[0.04]">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1.5">
                SEASON FILTER
              </span>
              <div className="relative">
                <select
                  value={activeSeason}
                  onChange={(e) => onSelectSeason && onSelectSeason(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-black/[0.08] hover:border-black/[0.15] rounded-xl px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-2xs truncate pr-6 appearance-none transition-all"
                  aria-label="Filter dataset by season"
                >
                  {SEASONS_LIST.map((s) => (
                    <option key={s.id} value={s.id} className="text-slate-900 font-medium">
                      {s.label}
                    </option>
                  ))}
                </select>
                <Calendar className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          ) : (
            <div className="flex justify-center pt-2 border-t border-black/[0.04]">
              <button
                onClick={onToggleCollapse}
                className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all"
                title={`Season: ${activeSeason} (Click to expand)`}
              >
                <Calendar className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Segment: Export Advisory Report + System Health Status */}
        <div className="p-3 border-t border-black/[0.05] space-y-2 bg-slate-50/50">
          {!isCollapsed ? (
            <>
              <button
                onClick={onOpenReportModal}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Export Advisory Report</span>
              </button>

              <div className="flex items-center justify-between px-1 pt-1 text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                  <span className="font-bold text-slate-700">
                    {isBackendLive ? 'BACKEND LIVE' : 'DEMO MODE'}
                  </span>
                </span>
                <span className="text-slate-400">NISR SAS</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onOpenReportModal}
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition-all shadow-xs"
                title="Export Advisory Report"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
              </button>
              <div 
                className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} 
                title={isBackendLive ? 'API LIVE' : 'DEMO MODE'}
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}