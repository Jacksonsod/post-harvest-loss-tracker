import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, Building2, Database } from 'lucide-react';

export default function CoopSelectPopover({ coops = [], selectedCoop, onSelectCoop }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const popoverRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredCoops = coops.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.district && c.district.toLowerCase().includes(q)) ||
      String(c.id).includes(q)
    );
  });

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Popover Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-slate-900 bg-slate-50 hover:bg-slate-100/90 border border-black/[0.08] rounded-xl px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all shadow-2xs font-mono group"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate max-w-[240px] sm:max-w-[340px] text-left">
          {selectedCoop?.name || 'Select Cooperative'}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`} 
        />
      </button>

      {/* Floating Ceramic Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-[300px] sm:w-[460px] bg-white rounded-2xl border border-black/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-2.5 space-y-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          {/* Header Search & Live Data Tag */}
          <div className="space-y-2 pb-1 border-b border-black/[0.05]">
            <div className="flex items-center justify-between text-[10.5px] font-mono px-1">
              <span className="text-slate-400 uppercase font-bold tracking-wider">
                Select Active Cooperative
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Registry ({coops.length} Coops)</span>
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="Search cooperative by name or district..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs font-mono pl-8 pr-3 py-1.5 bg-slate-50 border border-black/[0.06] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* List of Cooperatives */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1" role="listbox">
            {filteredCoops.length === 0 ? (
              <div className="p-4 text-center text-xs font-mono text-slate-400">
                No cooperatives match &quot;{search}&quot;
              </div>
            ) : (
              filteredCoops.map((coop) => {
                const isSelected = selectedCoop?.id === coop.id;
                return (
                  <button
                    key={coop.id}
                    type="button"
                    onClick={() => {
                      if (onSelectCoop) onSelectCoop(coop);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    role="option"
                    aria-selected={isSelected}
                    className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200/90 shadow-2xs'
                        : 'hover:bg-slate-50/90 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-xs font-mono font-bold truncate">
                        {coop.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10.5px] font-mono text-slate-500">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-black/[0.04]">
                          {coop.district} District
                        </span>
                        <span>NISR-COOP-#{String(coop.id).padStart(2, '0')}</span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Data Source Indicator */}
          <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-slate-400" />
              <span>NISR SAS Database</span>
            </span>
            <span>Surveyed Farm Records</span>
          </div>
        </div>
      )}
    </div>
  );
}
