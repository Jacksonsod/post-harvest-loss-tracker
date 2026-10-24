import React, { useState } from 'react';
import { 
  Radar, 
  ClipboardCheck, 
  TrendingDown, 
  Database, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Activity,
  Menu,
  X,
  Calculator,
  Info
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onSelectTab,
  onOpenReportModal,
  isBackendLive,
  isCollapsed,
  onToggleCollapse,
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { id: 'national_picture', label: 'National picture', icon: Radar },
    { id: 'check_losses', label: 'Check my losses', icon: ClipboardCheck },
    { id: 'plan_season', label: 'Plan next season', icon: Calculator },
    { id: 'coop_progress', label: "My cooperative's progress", icon: TrendingDown },
    { id: 'explore_data', label: 'Explore the data', icon: Database },
    { id: 'about_data', label: 'About the data', icon: Info },
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
              RWANDA HARVEST LOSS TRACKER
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">
              NISR Agricultural Statistics
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-black/[0.05] text-[10px] font-mono font-bold text-slate-700">
            <span className={`w-1.5 h-1.5 rounded-full ${isBackendLive ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
            {isBackendLive ? 'Connected' : 'Connecting...'}
          </span>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
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
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop collapse state (~10% slimmer)
          isCollapsed ? 'lg:w-[68px]' : 'lg:w-[242px]'
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
                      HARVEST LOSS TRACKER
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold block">
                    NISR SAS 2024–2025
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Collapse / Expand Toggle Button */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 items-center justify-center transition-all border border-black/[0.04] active:scale-90 cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Middle Segment: Navigation Tabs */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-3 no-scrollbar">
          {!isCollapsed && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
              MODULES
            </span>
          )}

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-200 text-left border cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-950 font-bold border-emerald-200/90 shadow-2xs ring-1 ring-emerald-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent font-medium'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {!isCollapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}
                  {!isCollapsed && isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 shadow-2xs" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Segment: Export Advisory Report + System Health Status */}
        <div className="p-3 border-t border-black/[0.05] space-y-2 bg-slate-50/50">
          {!isCollapsed ? (
            <>
              <button
                onClick={onOpenReportModal}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-all active:scale-[0.98] shadow-sm shadow-emerald-700/20 border border-emerald-800/40 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                <span>Export Advisory Report</span>
              </button>

              <div className="flex items-center justify-between px-1 pt-1 text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                  <span className="font-bold text-slate-700">
                    {isBackendLive ? 'Connected' : 'Connecting...'}
                  </span>
                </span>
                <span className="text-slate-400">NISR SAS</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onOpenReportModal}
                className="w-10 h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center transition-all shadow-sm shadow-emerald-700/20 border border-emerald-800/40 cursor-pointer active:scale-95"
                title="Export Advisory Report"
              >
                <FileText className="w-4 h-4 text-emerald-200" />
              </button>
              <div 
                className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} 
                title={isBackendLive ? 'Connected' : 'Connecting...'}
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
