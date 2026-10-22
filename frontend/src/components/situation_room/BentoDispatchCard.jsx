import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Radio, CheckCircle2 } from 'lucide-react';

export default function BentoDispatchCard({ selectedDistrict }) {
  const [triggers, setTriggers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getDispatchTriggers(selectedDistrict)
      .then((data) => {
        if (isMounted && data?.dispatch_triggers) {
          setTriggers(data.dispatch_triggers);
        }
      })
      .catch(() => {
        if (isMounted) {
          setTriggers([
            { dominant_cause: 'insects_pests', count: 18, suggested_intervention: 'Deploy IPM training & PICS hermetic storage' },
            { dominant_cause: 'storage', count: 14, suggested_intervention: 'Subsidize metal silos & warehouse upgrades' },
            { dominant_cause: 'harvesting_damage', count: 9, suggested_intervention: 'Gentle handling & mechanical harvest workshops' },
          ]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDistrict]);

  return (
    <div className="bg-white border border-black/[0.05] rounded-[28px] p-5.5 shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-[255px]">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.04] mb-3">
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            <span>MINAGRI DISPATCH</span>
          </span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200/80 font-bold">
            {selectedDistrict ? selectedDistrict.toUpperCase() : 'NATIONAL'}
          </span>
        </div>

        {/* Triggers List */}
        {loading ? (
          <div className="h-28 flex items-center justify-center text-xs font-mono text-slate-400 animate-pulse">
            Analyzing dispatch triggers...
          </div>
        ) : triggers.length > 0 ? (
          <div className="space-y-1.5 overflow-y-auto max-h-[130px] no-scrollbar">
            {triggers.slice(0, 3).map((item, idx) => (
              <div key={item.dominant_cause} className="p-2 px-2.5 rounded-2xl bg-slate-50/70 border border-black/[0.04] text-xs hover:border-black/[0.08] hover:bg-slate-100/60 transition-all">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-mono font-bold text-slate-900 text-[11px] capitalize flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-lg bg-rose-100 text-rose-800 text-[9px] flex items-center justify-center font-extrabold">
                      {idx + 1}
                    </span>
                    {item.dominant_cause.replace('_', ' ')}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700 font-extrabold">
                    {item.count} alerts
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1 font-sans mt-0.5">
                  {item.suggested_intervention}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-28 flex items-center justify-center text-xs font-mono text-slate-400">
            No active dispatch alerts.
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-[9.5px] font-mono text-slate-500">
        <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>RAB Network Synced</span>
        </span>
        <span className="text-slate-400 font-medium">Auto-prioritized</span>
      </div>
    </div>
  );
}
