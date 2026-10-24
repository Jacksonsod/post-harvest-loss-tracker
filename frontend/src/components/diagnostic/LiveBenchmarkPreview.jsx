import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Info, TrendingUp, ShieldCheck } from 'lucide-react';

export default function LiveBenchmarkPreview({ district, crop, season }) {
  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!district || !crop) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    api.getBenchmark(district, crop, season)
      .then((data) => {
        if (isMounted) setBenchmark(data);
      })
      .catch((err) => {
        if (isMounted) {
          setBenchmark(null);
          setError(err.message || 'No direct benchmark found');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [district, crop, season]);

  if (!district || !crop) return null;

  return (
    <div className="bg-slate-50/70 border border-black/[0.05] rounded-2xl p-4 shadow-2xs">
      <div className="flex items-center justify-between pb-2 border-b border-black/[0.04] mb-3">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800">
          <Info className="w-3.5 h-3.5 text-emerald-600" />
          <span className="uppercase text-[11px]">NISR SAS Survey Benchmark</span>
        </div>
        {benchmark && (
          <span className="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-white text-cyan-800 border border-black/[0.06] shadow-2xs">
            {benchmark.benchmark_source.replace('_', ' ')}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-slate-400 animate-pulse font-mono py-1">
          Loading NISR SAS 2024–2025 survey benchmarks...
        </div>
      ) : error ? (
        <div className="text-xs text-amber-700 py-1 font-mono">
          {error}. National fallback metrics will apply.
        </div>
      ) : benchmark ? (
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white p-2.5 rounded-xl border border-black/[0.04] shadow-2xs">
            <span className="text-[10px] text-slate-400 block font-mono font-bold">EXPECTED LOSS</span>
            <span className="text-sm font-black text-emerald-700 font-mono tnum">
              {benchmark.benchmark_loss_rate_pct.toFixed(2)}%
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-black/[0.04] shadow-2xs">
            <span className="text-[10px] text-slate-400 block font-mono font-bold">MARKET FARMGATE</span>
            <span className="text-sm font-black text-amber-800 font-mono tnum">
              {benchmark.avg_selling_price_rwf_per_kg ? `${Math.round(benchmark.avg_selling_price_rwf_per_kg)}` : '520'} <span className="text-[9.5px] font-normal text-slate-400">RWF/kg</span>
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-black/[0.04] shadow-2xs">
            <span className="text-[10px] text-slate-400 block font-mono font-bold">NST2 THRESHOLD</span>
            <span className="text-[11px] font-mono font-bold text-slate-800 block mt-0.5">
              &le;{(benchmark.benchmark_loss_rate_pct * 0.85).toFixed(1)}% <span className="text-[9.5px] text-emerald-700 font-normal">Safe</span>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
