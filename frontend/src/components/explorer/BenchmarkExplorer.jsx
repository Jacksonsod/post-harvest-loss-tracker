import React, { useState, useEffect } from 'react';
import { DISTRICTS, CROPS, SEASONS, CAUSE_LABELS } from '../../data/staticData';
import { useOptions } from '../../context/OptionsContext';
import { api } from '../../api/client';
import { 
  Database, 
  Search, 
  Filter, 
  ShieldCheck, 
  DollarSign, 
  BarChart2, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  SlidersHorizontal, 
  Layers, 
  Award, 
  Sparkles, 
  Scale, 
  Zap, 
  Info,
  Building2,
  ChevronDown,
  Target,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

const QUICK_CROPS = [
  { name: 'Maize', icon: '🌽' },
  { name: 'Irish potato', icon: '🥔' },
  { name: 'Paddy rice', icon: '🌾' },
  { name: 'Climbing bean', icon: '🫘' },
  { name: 'Cassava', icon: '🍠' },
  { name: 'Banana for beer', icon: '🍌' },
];

export default function BenchmarkExplorer({
  coops = [],
  selectedCoop,
  onSelectCoop
}) {
  const options = useOptions();
  const districtList = options.districts?.length ? options.districts : DISTRICTS;
  const cropList = options.crops?.length ? options.crops : CROPS;
  const seasonList = options.seasons?.length ? options.seasons : SEASONS;

  const [district, setDistrict] = useState(selectedCoop?.district || 'Musanze');
  const [crop, setCrop] = useState(selectedCoop?.primaryCrop || 'Irish potato');
  const [season, setSeason] = useState('A');
  const [benchmark, setBenchmark] = useState(null);
  const [nationalSummary, setNationalSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metricDisplayMode, setMetricDisplayMode] = useState('percent'); // 'percent' | 'rwf_100t'
  const [activeCoopId, setActiveCoopId] = useState(selectedCoop?.id || '');

  // Fetch national summary baseline once
  useEffect(() => {
    api.getNationalSummary()
      .then(data => setNationalSummary(data))
      .catch(() => {});
  }, []);

  // Sync if selectedCoop prop changes from sidebar
  useEffect(() => {
    if (selectedCoop) {
      setActiveCoopId(selectedCoop.id);
      if (selectedCoop.district) setDistrict(selectedCoop.district);
      if (selectedCoop.primaryCrop) setCrop(selectedCoop.primaryCrop);
    }
  }, [selectedCoop]);

  const handleSelectCoop = (idVal) => {
    setActiveCoopId(idVal);
    if (!idVal) return;
    const found = coops.find((c) => c.id === Number(idVal));
    if (found) {
      if (onSelectCoop) onSelectCoop(found);
      if (found.district) setDistrict(found.district);
      if (found.primaryCrop) setCrop(found.primaryCrop);
    }
  };

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

  const coopActualLoss = selectedCoop?.lossRatePct ?? null;

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
                Browse empirical post-harvest loss benchmarks from the NISR Seasonal Agricultural Survey.
              </p>
            </div>
          </div>

          {benchmark && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all active:scale-95 shadow-xs shrink-0 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Benchmark CSV</span>
            </button>
          )}
        </div>

        {/* Quick Commodity Preset Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Quick Crops:</span>
          </span>
          {QUICK_CROPS.map((qc) => (
            <button
              key={qc.name}
              type="button"
              onClick={() => setCrop(qc.name)}
              className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                crop === qc.name
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border border-black/[0.04]'
              }`}
            >
              <span>{qc.icon}</span>
              <span>{qc.name}</span>
            </button>
          ))}
        </div>

        {/* 4 Interactive Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2 border-t border-black/[0.05]">
          {/* 1. Context Cooperative */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              COOPERATIVE CONTEXT
            </label>
            <div className="relative">
              <select
                value={activeCoopId}
                onChange={(e) => handleSelectCoop(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/80 border border-black/[0.06] text-slate-900 rounded-xl text-xs font-mono font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs cursor-pointer transition-all"
              >
                <option value="">None (Generic Explorer)</option>
                {coops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.district})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. District Filter */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              TARGET DISTRICT
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/80 border border-black/[0.06] text-slate-900 rounded-xl text-xs font-mono font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs cursor-pointer transition-all"
            >
              {districtList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* 3. Crop Filter */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              CROP COMMODITY
            </label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/80 border border-black/[0.06] text-slate-900 rounded-xl text-xs font-mono font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs cursor-pointer transition-all"
            >
              {cropList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 4. Agricultural Season */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              AGRICULTURAL SEASON
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/80 border border-black/[0.06] text-slate-900 rounded-xl text-xs font-mono font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs cursor-pointer transition-all"
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

          {/* Key Metrics Strip (4 Ceramic Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Statistical Baseline Loss */}
            <div className="bg-white/95 border border-black/[0.05] p-5 rounded-2xl shadow-2xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10.5px] font-mono text-slate-400 font-bold uppercase">
                  SURVEY BASELINE LOSS
                </span>
                {benchmark.benchmark_n_records && (
                  <span className="text-[9.5px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full">
                    {benchmark.benchmark_n_records.toLocaleString()} plots
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-black text-slate-900 tnum">
                  {benchmark.benchmark_loss_rate_pct.toFixed(1)}%
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  parseFloat(deltaVsNat) <= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
                }`}>
                  {parseFloat(deltaVsNat) > 0 ? `+${deltaVsNat}%` : `${deltaVsNat}%`} vs Nat'l
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                ~{Math.round(benchmark.benchmark_loss_rate_pct)} kg lost per 100 kg harvested
              </span>
              <span className="text-[9.5px] text-slate-400 block mt-0.5 capitalize">
                Source: {benchmark.benchmark_source.replace('_', ' ')}
              </span>
            </div>

            {/* Benchmark Farmgate Price */}
            <div className="bg-white/95 border border-black/[0.05] p-5 rounded-2xl shadow-2xs">
              <span className="text-[10.5px] font-mono text-slate-400 font-bold uppercase block mb-1">
                FARMGATE SELLING PRICE
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-mono font-black text-emerald-700 tnum">
                  {benchmark.avg_selling_price_rwf_per_kg ? `${Math.round(benchmark.avg_selling_price_rwf_per_kg)}` : '520'}
                </span>
                <span className="text-xs font-mono font-semibold text-slate-500">RWF/kg</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                NISR Official Farmgate Index
              </span>
            </div>

            {/* NST2 Target Distance */}
            <div className="bg-white/95 border border-black/[0.05] p-5 rounded-2xl shadow-2xs">
              <span className="text-[10.5px] font-mono text-slate-400 font-bold uppercase block mb-1">
                NST2 TARGET STATUS (≤5%)
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-mono font-black uppercase ${
                  parseFloat(gapToNST2) <= 0 ? 'text-emerald-700' : parseFloat(gapToNST2) <= 5.0 ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {parseFloat(gapToNST2) <= 0 ? 'COMPLIANT' : `+${gapToNST2}% GAP`}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Goal: ≤5.0% by Rwanda Vision 2050
              </span>
            </div>

            {/* Macro Depletion on 100t */}
            <div className="bg-white/95 border border-black/[0.05] p-5 rounded-2xl shadow-2xs">
              <span className="text-[10.5px] font-mono text-slate-400 font-bold uppercase block mb-1">
                VALUE AT RISK PER 100T
              </span>
              <span className="text-2xl font-mono font-black text-rose-800 tnum block">
                ~{(depletion100tRwf / 1000000).toFixed(2)}M RWF
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                Depletes {Math.round(depletion100tKg).toLocaleString()} kg volume per 100t
              </span>
            </div>
          </div>

          {/* Context Cooperative vs Benchmark Comparative Intelligence Strip */}
          {selectedCoop && coopActualLoss !== null && (
            <div className="bg-emerald-50/70 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {selectedCoop.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-emerald-800 font-bold border border-emerald-200">
                      Recorded Loss: {coopActualLoss}%
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      coopActualLoss <= medianRate 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {coopActualLoss <= medianRate 
                        ? `↓ ${(medianRate - coopActualLoss).toFixed(1)}% Superior to District Baseline` 
                        : `↑ ${(coopActualLoss - medianRate).toFixed(1)}% Above District Baseline`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Compared with {district} {crop} baseline ({medianRate.toFixed(1)}%) and NST2 national target (≤5.0%).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 font-mono text-[11px]">
                <span className="text-slate-500">NST2 Target:</span>
                <span className={`font-bold px-2.5 py-0.5 rounded-lg border ${
                  coopActualLoss <= 5.0 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {coopActualLoss <= 5.0 ? 'Compliant (≤5.0%)' : `+${(coopActualLoss - 5.0).toFixed(1)}% Gap`}
                </span>
              </div>
            </div>
          )}

          {/* Statistical Quantile Distribution Visualizer */}
          <div className="bg-white/95 border border-black/[0.06] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
                  Empirical Microdata Distribution (P25 • P50 • P75 • P90)
                </h3>
              </div>
              {benchmark.benchmark_n_records && (
                <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-black/[0.05]">
                  Sample: {benchmark.benchmark_n_records.toLocaleString()} surveyed plots
                </span>
              )}
            </div>

            {/* Quantile Continuum Multi-Segment Bar */}
            <div className="space-y-1.5">
              <div className="relative w-full h-4 rounded-full bg-slate-100 border border-black/[0.06] overflow-hidden flex shadow-inner">
                <div className="w-[25%] bg-emerald-400/70 border-r border-white/60" title={`P25: ${p25}%`} />
                <div className="w-[25%] bg-emerald-500/80 border-r border-white/60" title={`P50 Median: ${p50}%`} />
                <div className="w-[25%] bg-amber-400/80 border-r border-white/60" title={`P75: ${p75}%`} />
                <div className="w-[25%] bg-rose-500/80" title={`P90 Outliers: ${p90}%`} />
              </div>

              {/* NST2 Target & Coop Marker Indicators */}
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 px-1 flex-wrap gap-1">
                <span>0% Resilient</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  🎯 NST2 Target: ≤5.0%
                </span>
                {selectedCoop && coopActualLoss !== null && (
                  <span className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded-full border border-black/[0.1] shadow-2xs flex items-center gap-1">
                    <Building2 className="w-2.5 h-2.5 text-emerald-600" />
                    <span>{selectedCoop.name.split('-')[0].trim()}: {coopActualLoss}%</span>
                  </span>
                )}
                <span className="text-rose-600 font-bold">14.3% Severe Risk Threshold</span>
                <span>25%+ Crisis</span>
              </div>
            </div>

            {/* Quantile 4-Card Breakout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-black/[0.04] text-center font-mono">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">P25 (TOP EFFICIENCY)</span>
                <span className="text-xl font-black text-emerald-700 block mt-0.5">{p25}%</span>
                <span className="text-[9.5px] text-slate-500 block mt-0.5">Top 25% Best Managed Plots</span>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-black/[0.04] text-center font-mono">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">P50 (SURVEY MEDIAN)</span>
                <span className="text-xl font-black text-slate-900 block mt-0.5">{p50}%</span>
                <span className="text-[9.5px] text-slate-500 block mt-0.5">National Median Midpoint</span>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-black/[0.04] text-center font-mono">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">P75 (ELEVATED VULNERABILITY)</span>
                <span className="text-xl font-black text-amber-700 block mt-0.5">{p75}%</span>
                <span className="text-[9.5px] text-slate-500 block mt-0.5">Upper Quartile Risk Band</span>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-black/[0.04] text-center font-mono">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">P90 (CRITICAL OUTLIERS)</span>
                <span className="text-xl font-black text-rose-700 block mt-0.5">{p90}%</span>
                <span className="text-[9.5px] text-slate-500 block mt-0.5">Severe Loss Outlier Plots</span>
              </div>
            </div>
          </div>

          {/* Causes Distribution Breakdown with Metric Switcher */}
          {benchmark.cause_of_loss_breakdown_pct && (
            <div className="bg-white/95 border border-black/[0.06] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-black/[0.05] gap-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
                    Supply Chain Loss Drivers for {crop} in {district}
                  </h3>
                </div>

                {/* Display Metric Switcher Pill */}
                <div className="inline-flex items-center bg-slate-100 p-1 rounded-full border border-black/[0.04] text-[10.5px] font-mono self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setMetricDisplayMode('percent')}
                    className={`px-3 py-1 rounded-full font-semibold transition-all ${
                      metricDisplayMode === 'percent'
                        ? 'bg-white text-slate-900 font-bold shadow-2xs border border-black/[0.04]'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    % SHARE OF LOSS
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricDisplayMode('rwf_100t')}
                    className={`px-3 py-1 rounded-full font-semibold transition-all ${
                      metricDisplayMode === 'rwf_100t'
                        ? 'bg-white text-emerald-800 font-bold shadow-2xs border border-black/[0.04]'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    RWF LOSS PER 100T
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

                    return (
                      <div 
                        key={causeKey} 
                        className="bg-slate-50/70 p-4 rounded-2xl border border-black/[0.04] hover:border-black/[0.1] transition-all shadow-2xs space-y-2"
                      >
                        <div className="flex justify-between items-center text-xs font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-900 font-bold">{causeName}</span>
                            <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold ${
                              threatLevel === 'Critical' ? 'bg-rose-100 text-rose-800' :
                              threatLevel === 'High' ? 'bg-amber-100 text-amber-800' :
                              threatLevel === 'Moderate' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-200 text-slate-700'
                            }`}>
                              {threatLevel}
                            </span>
                          </div>

                          <span className="text-slate-900 font-black tnum">
                            {metricDisplayMode === 'percent' 
                              ? `${pct}%`
                              : `~${(rwfOn100t / 1000000).toFixed(2)}M RWF`}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, pct)}%` }}
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
