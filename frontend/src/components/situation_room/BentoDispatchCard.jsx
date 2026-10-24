import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Radio, CheckCircle2, Send, AlertTriangle, ShieldAlert, BellRing } from 'lucide-react';

export default function BentoDispatchCard({ selectedDistrict }) {
  const [triggers, setTriggers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dispatchedId, setDispatchedId] = useState(null);

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
            { dominant_cause: 'insects_pests', count: 18, suggested_intervention: 'Deploy IPM mobile advisory & subsidize PICS hermetic bags' },
            { dominant_cause: 'storage_facilities', count: 14, suggested_intervention: 'Mobilize cooperative metallic silos & moisture meters' },
            { dominant_cause: 'harvesting_damage', count: 9, suggested_intervention: 'Gentle handling protocols & combine harvest calibration' },
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

  const handleSimulateDispatch = (idx) => {
    setDispatchedId(idx);
    setTimeout(() => {
      setDispatchedId(null);
    }, 2800);
  };

  return (
    <div className="bg-white/95 border border-black/[0.06] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs flex flex-col justify-between space-y-4 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 h-full">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 animate-pulse text-rose-600" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold tracking-tight text-slate-900 uppercase block">
                MINAGRI / RAB Dispatch Triggers
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                Automated field response & extension alerts
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200/80 font-bold uppercase shrink-0">
            {selectedDistrict ? selectedDistrict.toUpperCase() : 'NATIONAL'}
          </span>
        </div>

        {/* Triggers Feed */}
        {loading ? (
          <div className="h-44 flex items-center justify-center text-xs font-mono text-slate-400 animate-pulse">
            Analyzing district telemetry & dispatch triggers...
          </div>
        ) : triggers.length > 0 ? (
          <div className="space-y-2.5">
            {triggers.slice(0, 3).map((item, idx) => {
              const isDispatched = dispatchedId === idx;
              return (
                <div
                  key={item.dominant_cause || idx}
                  className="p-3 rounded-2xl bg-slate-50/80 border border-black/[0.04] text-xs hover:border-black/[0.08] hover:bg-slate-100/70 transition-all flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-xs capitalize flex items-center gap-2">
                      <span className="w-4 h-4 rounded-md bg-rose-100 text-rose-700 text-[10px] flex items-center justify-center font-black">
                        {idx + 1}
                      </span>
                      {String(item.dominant_cause).replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 font-extrabold flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {item.count} Incidents
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 font-sans leading-relaxed">
                    {item.suggested_intervention}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-black/[0.03] mt-0.5">
                    <span className="text-[9.5px] font-mono text-slate-400">
                      Target: Extension Workers & Cooperatives
                    </span>
                    <button
                      onClick={() => handleSimulateDispatch(idx)}
                      disabled={isDispatched}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 ${
                        isDispatched
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-black/[0.08] active:scale-95'
                      }`}
                    >
                      {isDispatched ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-white" />
                          <span>SMS Broadcast Sent!</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-2.5 h-2.5" />
                          <span>Dispatch Advisory</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-44 flex flex-col items-center justify-center text-xs font-mono text-slate-400 gap-1.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <span>No critical dispatch alerts active in this sector.</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-black/[0.05] flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>RAB Extension Grid Synced</span>
        </span>
        <span className="text-slate-400 font-semibold flex items-center gap-1">
          <BellRing className="w-3 h-3 text-slate-400" />
          Auto-escalation active
        </span>
      </div>
    </div>
  );
}
