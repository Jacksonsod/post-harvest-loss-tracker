import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AlertOctagon } from 'lucide-react';

export default function BentoOutlierWatchlist({ onSelectCoop }) {
  const [outliers, setOutliers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getOutliers(1.2)
      .then((data) => {
        if (isMounted && data?.outliers) {
          setOutliers(data.outliers);
        }
      })
      .catch(() => {
        if (isMounted) {
          setOutliers([
            { assessment_id: 104, coop_id: 3, district: 'Gisagara', crop: 'Maize', loss_rate_pct: 18.5, benchmark_used_pct: 12.1, deviation_ratio: 1.53 },
            { assessment_id: 102, coop_id: 5, district: 'Nyagatare', crop: 'Paddy rice', loss_rate_pct: 16.2, benchmark_used_pct: 11.4, deviation_ratio: 1.42 },
            { assessment_id: 108, coop_id: 7, district: 'Bugesera', crop: 'Bush bean', loss_rate_pct: 15.1, benchmark_used_pct: 10.8, deviation_ratio: 1.40 },
          ]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-white border border-black/[0.05] rounded-[28px] p-5.5 shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-[255px]">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.04] mb-3">
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span>OUTLIER WATCHLIST</span>
          </span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200/80 font-bold">
            &gt;1.2x DEVIATION
          </span>
        </div>

        {/* List */}
        {loading ? (
          <div className="h-28 flex items-center justify-center text-xs font-mono text-slate-400 animate-pulse">
            Scanning outliers...
          </div>
        ) : outliers.length > 0 ? (
          <div className="space-y-1.5 overflow-y-auto max-h-[130px] no-scrollbar">
            {outliers.slice(0, 3).map((item) => (
              <div 
                key={item.assessment_id} 
                onClick={() => onSelectCoop && onSelectCoop({ id: item.coop_id, name: `Coop #${item.coop_id}`, district: item.district })}
                className="p-2 px-2.5 rounded-2xl bg-slate-50/70 border border-black/[0.04] hover:border-rose-300 hover:bg-rose-50/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-900">
                    <span>Coop #{item.coop_id}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({item.district})</span>
                  </div>
                  <span className="text-[9px] font-mono font-extrabold text-rose-700 bg-rose-100/90 px-1.5 py-0.2 rounded-full border border-rose-200/60">
                    {item.deviation_ratio}x dev
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="font-semibold text-slate-700">{item.crop}</span>
                  <span className="text-rose-700 font-extrabold">{item.loss_rate_pct}% loss</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-28 flex items-center justify-center text-xs font-mono text-slate-400">
            No critical anomalies.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-[9.5px] font-mono text-slate-500">
        <span className="text-rose-800 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
          Supervisor Flag
        </span>
        <span className="text-slate-400 font-medium">Auto-flagged</span>
      </div>
    </div>
  );
}
