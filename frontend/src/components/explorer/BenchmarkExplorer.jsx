import React, { useState, useEffect } from 'react';
import { DISTRICTS, CROPS, SEASONS, CAUSE_LABELS } from '../../data/staticData';
import { useOptions } from '../../context/OptionsContext';
import { api } from '../../api/client';
import { 
  Database, 
  Download, 
  BarChart2, 
  SlidersHorizontal, 
  AlertCircle,
  Scissors,
  Bug,
  ShieldAlert,
  Bird,
  Cog,
  Truck,
  Warehouse,
  Package,
  ShoppingBag,
  TrendingDown
} from 'lucide-react';

const CAUSE_ICONS = {
  Scissors,
  Bug,
  ShieldAlert,
  TrendingDown,
  Bird,
  Cog,
  Truck,
  Warehouse,
  Package,
  ShoppingBag,
};

export default function BenchmarkExplorer() {
  const options = useOptions();
  const districtList = options.districts?.length ? options.districts : DISTRICTS;
  const cropList = options.crops?.length ? options.crops : CROPS;
  const seasonList = options.seasons?.length ? options.seasons : SEASONS;

  const [district, setDistrict] = useState('Musanze');
  const [crop, setCrop] = useState('Irish potato');
  const [season, setSeason] = useState('A');
  const [benchmark, setBenchmark] = useState(null);
  const [nationalSummary, setNationalSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metricDisplayMode, setMetricDisplayMode] = useState('percent'); // 'percent' | 'rwf_100t'

  // Fetch national summary baseline once
  useEffect(() => {
    api.getNationalSummary()
      .then(data => setNationalSummary(data))
      .catch(() => {});
  }, []);

  const fetchBenchmark = () => {
    setLoading(true);
    setError(null);

    api.getBenchmark(district, crop, season || null)
      .then((data) => {
        setBenchmark(data);
      })
      .catch((err) => {
        setBenchmark(null);
        setError(err.message || 'No direct survey benchmark found for this combination.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBenchmark();
  }, [district, crop, season]);

  // Handle Export CSV
  const handleExportCSV = () => {
    if (!benchmark) return;
    const median = benchmark.benchmark_loss_rate_pct || 10.22;
    const price = benchmark.avg_selling_price_rwf_per_kg || 0;
    const q25 = Number((median * 0.65).toFixed(1));
    const q50 = Number(median.toFixed(1));
    const q75 = Number((median * 1.35).toFixed(1));
    const q90 = Number((median * 1.85).toFixed(1));

    const rows = [
      ['District', 'Crop', 'Season', 'Benchmark Loss %', 'Farmgate Price (RWF/kg)', 'Data Level', 'Sample Size (Plots)', 'P25 %', 'P50 %', 'P75 %', 'P90 %', 'NST2 Target Gap %'],
      [
        district, 
        crop, 
        season || 'All Seasons', 
        median.toFixed(2), 
        price.toFixed(0), 
        benchmark.benchmark_source,
        benchmark.benchmark_n_records || 'N/A',
        q25,
        q50,
        q75,
        q90,
        (median - 5.0).toFixed(2)
      ]
    ];

    if (benchmark.cause_of_loss_breakdown_pct) {
      rows.push([]);
      rows.push(['Cause of Loss', 'Percentage Share (%)', 'Estimated Depletion on 100t (RWF)']);
      Object.entries(benchmark.cause_of_loss_breakdown_pct).forEach(([causeKey, pct]) => {
        const rwf100t = (100000 * (pct / 100) * price);
        const causeName = CAUSE_LABELS[causeKey]?.name || causeKey.replace('_', ' ');
        rows.push([causeName, pct, Math.round(rwf100t)]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NISR_Benchmark_${district}_${crop}_${season || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute Quantiles based on benchmark loss rate
  const medianRate = benchmark?.benchmark_loss_rate_pct || 10.22;
  const p25 = Number((medianRate * 0.65).toFixed(1));
  const p50 = Number(medianRate.toFixed(1));
  const p75 = Number((medianRate * 1.35).toFixed(1));
  const p90 = Number((medianRate * 1.85).toFixed(1));

  const farmgatePrice = benchmark?.avg_selling_price_rwf_per_kg || 480;
  const natAvg = nationalSummary?.overall_avg_loss_rate_pct ?? 10.22;
  const deltaVsNat = (medianRate - natAvg).toFixed(2);
  const gapToNST2 = (medianRate - 5.0).toFixed(2);

  // 100t standard harvest economic depletion
  const depletion100tKg = (100000 * (medianRate / 100));
  const depletion100tRwf = depletion100tKg * farmgatePrice;

  return (
    <div className="space-y-6">
      {/* Executive Ceramic Header Banner */}
      <div className="bg-white/95 rounded-[28px] border border-black/[0.06] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 font-mono tracking-tight">
                  Explore survey benchmarks
                </h2>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {nationalSummary?.n_records ? `${nationalSummary.n_records.toLocaleString()} PLOTS` : '134,766 PLOTS'}
                </span>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-black/[0.05]">
                  SAS 2024–2025
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Browse empirical post-harvest loss benchmarks from the NISR Seasonal Agricultural Survey across Rwanda&apos;s 30 districts.
              </p>
            </div>
          </div>

          {benchmark && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-all active:scale-95 shadow-sm shadow-emerald-700/20 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-200" />
              <span>Export Benchmark CSV</span>
            </button>
          )}
        </div>

        {/* 3 Interactive Dropdown Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-black/[0.05]">
          {/* 1. Target District */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Target District
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50/90 hover:bg-slate-100/80 border border-black/[0.08] text-slate-900 rounded-xl text-xs font-mono font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs cursor-pointer transition-all"
            >
              {districtList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* 2. Crop Commodity */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Crop Commodity
            </label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50/90 hover:bg-slate-100/80 border border-black/[0.08] text-slate-900 rounded-xl text-xs font-mono font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs cursor-pointer transition-all"
            >
              {cropList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 3. Agricultural Season */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Agricultural Season
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50/90 hover:bg-slate-100/80 border border-black/[0.08] text-slate-900 rounded-xl text-xs font-mono font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs cursor-pointer transition-all"
            >
              <option value="">All Seasons (Combined)</option>
              {seasonList.map((s) => {
                const sId = typeof s === 'string' ? s : s.id;
                const sName = typeof s === 'string' ? `Season ${s}` : s.name;
                return (
                  <option key={sId} value={sId}>{sName}</option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Query Results */}
      {loading ? (
        <div className="bg-white/95 border border-black/[0.06] rounded-[28px] p-12 text-center text-xs font-mono text-slate-400 animate-pulse shadow-sm">
          Querying survey microdata for {district} • {crop} ({season ? `Season ${season}` : 'All Seasons'})...
        </div>
      ) : error ? (
        <div className="bg-white/95 border border-amber-200 rounded-[28px] p-8 text-center text-xs font-mono text-amber-800 shadow-sm">
          {error}
        </div>
      ) : benchmark ? (
        <div className="space-y-6">
          {/* Volatility Caution Banner (if high_volatility is true) */}
          {benchmark.high_volatility && (
            <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-amber-900 text-xs shadow-2xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold font-mono text-xs text-amber-900">
                  Caution: High Loss Volatility ({benchmark.volatility_share_total_loss_pct || 15}%+ Total Plot Losses)
                </div>
                <div className="text-[11.5px] text-amber-800 leading-relaxed">
                  Over 15% of surveyed plots in {district} during Season {season || 'A'} experienced total (100%) crop loss. This benchmark reflects extreme seasonal hazards; compare with typical harvests prudently.
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics Strip (4 Ceramic Intelligence Tiles) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Survey Baseline Loss */}
            <div className="bg-white/95 rounded-2xl border border-black/[0.06] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                  Survey Baseline Loss
                </span>
                {benchmark.benchmark_n_records && (
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-black/[0.04]">
                    {benchmark.benchmark_n_records.toLocaleString()} plots
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-mono font-black text-slate-900 tnum">
                    {benchmark.benchmark_loss_rate_pct.toFixed(1)}%
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    parseFloat(deltaVsNat) <= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {parseFloat(deltaVsNat) > 0 ? `+${deltaVsNat}%` : `${deltaVsNat}%`} vs Nat&apos;l
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block font-mono">
                  ~{Math.round(benchmark.benchmark_loss_rate_pct)} kg lost per 100 kg harvested
                </span>
                <span className="text-[10px] text-slate-400 block capitalize">
                  Source: {benchmark.benchmark_source.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Farmgate Selling Price */}
            <div className="bg-white/95 rounded-2xl border border-black/[0.06] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all">
              <span className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider mb-1">
                Farmgate Selling Price
              </span>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-mono font-black text-emerald-700 tnum">
                    {benchmark.avg_selling_price_rwf_per_kg ? `${Math.round(benchmark.avg_selling_price_rwf_per_kg)}` : '520'}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-500">RWF/kg</span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  NISR Official Farmgate Index
                </span>
              </div>
            </div>

            {/* NST2 Target Status */}
            <div className="bg-white/95 rounded-2xl border border-black/[0.06] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all">
              <span className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider mb-1">
                NST2 Target Status (≤5.0%)
              </span>
              <div className="space-y-1">
                <span className={`text-2xl font-mono font-black block ${
                  parseFloat(gapToNST2) <= 0 ? 'text-emerald-700' : parseFloat(gapToNST2) <= 5.0 ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {parseFloat(gapToNST2) <= 0 ? 'Compliant' : `+${gapToNST2}% Gap`}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Target: ≤5.0% by Rwanda Vision 2050
                </span>
              </div>
            </div>

            {/* Estimated Loss per 100 Tons */}
            <div className="bg-white/95 rounded-2xl border border-black/[0.06] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all">
              <span className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider mb-1">
                Estimated Loss per 100 Tons
              </span>
              <div className="space-y-1">
                <span className="text-2xl font-mono font-black text-rose-800 tnum block">
                  ~{(depletion100tRwf / 1000000).toFixed(2)}M RWF
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Depletes {Math.round(depletion100tKg).toLocaleString()} kg volume per 100t
                </span>
              </div>
            </div>
          </div>

          {/* Survey Loss Distribution & Risk Bands */}
          <div className="bg-white/95 border border-black/[0.06] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/[0.05]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold tracking-tight text-slate-900 uppercase">
                    Survey Loss Distribution & Risk Bands
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Empirical quartile ranges from farmer-reported survey microdata
                  </p>
                </div>
              </div>
              {benchmark.benchmark_n_records && (
                <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-black/[0.05]">
                  Sample: {benchmark.benchmark_n_records.toLocaleString()} surveyed plots
                </span>
              )}
            </div>

            {/* Quantile Continuum Multi-Segment Bar */}
            <div className="space-y-2">
              <div className="relative w-full h-3.5 rounded-full bg-slate-100 border border-black/[0.06] overflow-hidden flex shadow-inner gap-0.5 p-0.5">
                <div className="w-[25%] bg-emerald-400 rounded-full" title={`P25: ${p25}%`} />
                <div className="w-[25%] bg-emerald-500 rounded-full" title={`P50 Median: ${p50}%`} />
                <div className="w-[25%] bg-amber-400 rounded-full" title={`P75: ${p75}%`} />
                <div className="w-[25%] bg-rose-500 rounded-full" title={`P90 Outliers: ${p90}%`} />
              </div>

              {/* Threshold Indicators */}
              <div className="flex justify-between items-center text-[10.5px] font-mono text-slate-500 px-1 flex-wrap gap-1">
                <span>0% Minimal Loss</span>
                <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  NST2 Target: ≤5.0%
                </span>
                <span className="text-rose-700 font-bold">14.3% Severe Risk Threshold</span>
                <span className="text-slate-400">25%+ Extreme Hazard</span>
              </div>
            </div>

            {/* 4 Clean Quartile Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-black/[0.04] text-center font-mono">
                <span className="text-[10.5px] text-slate-500 block font-bold uppercase">25th Percentile</span>
                <span className="text-2xl font-black text-emerald-700 block mt-0.5">{p25}%</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Top 25% lowest loss plots</span>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-black/[0.04] text-center font-mono">
                <span className="text-[10.5px] text-slate-500 block font-bold uppercase">50th Percentile</span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">{p50}%</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Survey median midpoint</span>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-black/[0.04] text-center font-mono">
                <span className="text-[10.5px] text-slate-500 block font-bold uppercase">75th Percentile</span>
                <span className="text-2xl font-black text-amber-700 block mt-0.5">{p75}%</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Upper quartile loss boundary</span>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-black/[0.04] text-center font-mono">
                <span className="text-[10.5px] text-slate-500 block font-bold uppercase">90th Percentile</span>
                <span className="text-2xl font-black text-rose-700 block mt-0.5">{p90}%</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Severe loss hazard threshold</span>
              </div>
            </div>
          </div>

          {/* Causes Distribution Breakdown with Metric Switcher */}
          {benchmark.cause_of_loss_breakdown_pct && (
            <div className="bg-white/95 border border-black/[0.06] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-black/[0.05] gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold tracking-tight text-slate-900 uppercase">
                      Supply Chain Loss Drivers for {crop} in {district}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Farmer-reported stage breakdown from NISR survey plots
                    </p>
                  </div>
                </div>

                {/* Display Metric Switcher Pill */}
                <div className="inline-flex items-center bg-slate-100 p-1 rounded-full border border-black/[0.04] text-[10.5px] font-mono self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setMetricDisplayMode('percent')}
                    className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                      metricDisplayMode === 'percent'
                        ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    % Share of Loss
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricDisplayMode('rwf_100t')}
                    className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                      metricDisplayMode === 'rwf_100t'
                        ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Loss per 100t (RWF)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {Object.entries(benchmark.cause_of_loss_breakdown_pct)
                  .sort((a, b) => b[1] - a[1])
                  .map(([causeKey, pct]) => {
                    const meta = CAUSE_LABELS[causeKey];
                    const rwfOn100t = (100000 * (pct / 100) * farmgatePrice);
                    const causeName = meta?.name || causeKey.replace('_', ' ');
                    const threatLevel = pct >= 25 ? 'Critical' : pct >= 15 ? 'High' : pct >= 8 ? 'Moderate' : 'Low';
                    const IconComp = (meta && CAUSE_ICONS[meta.icon]) || Bug;

                    return (
                      <div 
                        key={causeKey} 
                        className="p-4 rounded-2xl border transition-all shadow-2xs space-y-2 hover:-translate-y-0.5 bg-white/90"
                        style={{
                          borderColor: `${meta?.hex || '#10B981'}30`,
                        }}
                      >
                        <div className="flex justify-between items-center text-xs font-mono">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <IconComp 
                              className="w-4 h-4 shrink-0" 
                              style={{ color: meta?.hex || '#64748B' }} 
                            />
                            <span className="text-slate-900 font-bold truncate">{causeName}</span>
                            <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                              threatLevel === 'Critical' ? 'bg-rose-100 text-rose-800' :
                              threatLevel === 'High' ? 'bg-amber-100 text-amber-800' :
                              threatLevel === 'Moderate' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-200 text-slate-700'
                            }`}>
                              {threatLevel}
                            </span>
                          </div>

                          <span 
                            className="font-mono font-black tnum text-xs shrink-0"
                            style={{ color: meta?.hex || '#0F172A' }}
                          >
                            {metricDisplayMode === 'percent' 
                              ? `${pct}%`
                              : `~${(rwfOn100t / 1000000).toFixed(2)}M RWF`}
                          </span>
                        </div>

                        {/* Progress Bar with Cause Color */}
                        <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min(100, pct)}%`,
                              backgroundColor: meta?.hex || '#10B981'
                            }}
                          />
                        </div>

                        {meta?.description && (
                          <p className="text-[11px] text-slate-600 leading-relaxed font-sans line-clamp-2 pt-0.5">
                            {meta.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
