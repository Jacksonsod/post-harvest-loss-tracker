import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Warehouse } from 'lucide-react';

export default function BentoStorageComparison() {
  const [selectedCrop, setSelectedCrop] = useState('Maize');
  const [storageData, setStorageData] = useState([]);
  const [loading, setLoading] = useState(false);

  const storageCrops = ['Maize', 'Bush bean', 'Climbing bean', 'Cassava', 'Irish potato', 'Sorghum', 'Soybean', 'Sweet potato'];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getStorageComparison(selectedCrop)
      .then((data) => {
        if (isMounted && data?.storage_types) {
          setStorageData(data.storage_types);
        }
      })
      .catch(() => {
        if (isMounted) {
          if (selectedCrop === 'Maize') {
            setStorageData([
              { storage_type: 'Other storage', avg_loss_rate_pct: 13.61, n_records: 8 },
              { storage_type: 'Own storage', avg_loss_rate_pct: 21.27, n_records: 1513 },
              { storage_type: 'Public storage', avg_loss_rate_pct: 25.75, n_records: 21 },
              { storage_type: 'Cooperative storage', avg_loss_rate_pct: 55.63, n_records: 17 },
            ]);
          } else {
            setStorageData([
              { storage_type: 'Own storage', avg_loss_rate_pct: 17.49, n_records: 1940 },
              { storage_type: 'Public storage', avg_loss_rate_pct: 7.17, n_records: 25 },
              { storage_type: 'Cooperative storage', avg_loss_rate_pct: 39.3, n_records: 9 },
            ]);
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCrop]);

  return (
    <div className="bg-white border border-black/[0.05] rounded-[28px] p-5.5 shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-[255px]">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.04] mb-3">
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-indigo-600" />
            <span>STORAGE LOSS</span>
          </span>

          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="text-[10px] font-mono font-bold bg-slate-100/90 border border-black/[0.04] rounded-full px-2.5 py-0.5 text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {storageCrops.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Content & Bars */}
        {loading ? (
          <div className="h-28 flex items-center justify-center text-xs font-mono text-slate-400 animate-pulse">
            Querying benchmarks...
          </div>
        ) : storageData.length > 0 ? (
          <div className="space-y-2 overflow-y-auto max-h-[125px] no-scrollbar pr-0.5">
            {storageData.map((item) => {
              const loss = item.avg_loss_rate_pct;
              const isHigh = loss > 25;
              const isLow = loss < 15;
              const barColor = isLow ? 'bg-emerald-500' : isHigh ? 'bg-rose-500' : 'bg-amber-500';
              const cleanType = item.storage_type
                .replace('Storage owned by Cooperatives/private companies', 'Cooperative/Private')
                .replace('(specify)', '')
                .replace('Storage owned by ', '');

              return (
                <div key={item.storage_type}>
                  <div className="flex items-center justify-between text-[11px] font-mono mb-0.5">
                    <span className="text-slate-700 font-semibold truncate max-w-[125px]" title={item.storage_type}>
                      {cleanType}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9.5px] text-slate-400">({item.n_records})</span>
                      <span className={`font-bold font-mono tnum ${isLow ? 'text-emerald-700' : isHigh ? 'text-rose-700' : 'text-amber-700'}`}>
                        {loss.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100/90 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(100, (loss / 60) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-28 flex items-center justify-center text-xs font-mono text-slate-400">
            No data.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-[9.5px] font-mono text-slate-500">
        <span className="text-indigo-800 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
          Hermetic PICS Bags
        </span>
        <span className="text-slate-400 font-medium">Cuts loss &gt;50%</span>
      </div>
    </div>
  );
}
