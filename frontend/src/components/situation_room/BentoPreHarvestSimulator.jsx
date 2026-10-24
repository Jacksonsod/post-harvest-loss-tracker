import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DISTRICTS, CROPS, SEASONS } from '../../data/staticData';
import { Calculator, TrendingUp, Sparkles, Scale, DollarSign, Sliders } from 'lucide-react';

const COMMON_CROPS = [
  'Maize', 
  'Irish potato', 
  'Paddy rice', 
  'Climbing bean', 
  'Bush bean',
  'Cassava', 
  'Sorghum', 
  'Soybean'
];

export default function BentoPreHarvestSimulator({ selectedDistrict }) {
  const [district, setDistrict] = useState(selectedDistrict || 'Musanze');
  const [crop, setCrop] = useState('Irish potato');
  const [season, setSeason] = useState('A');
  const [harvestKg, setHarvestKg] = useState(50000);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDistrict) {
      setDistrict(selectedDistrict);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getEstimate(district, crop, season, harvestKg)
      .then((data) => {
        if (isMounted) setEstimate(data);
      })
      .catch(() => {
        if (isMounted) {
          const lossRate = crop === 'Fruits' ? 18.8 : crop === 'Paddy rice' ? 15.4 : crop === 'Maize' ? 13.4 : 11.4;
          const lossKg = (harvestKg * lossRate) / 100;
          const price = crop === 'Irish potato' ? 372.41 : crop === 'Paddy rice' ? 567.86 : 520;
          setEstimate({
            district,
            crop,
            season,
            projected_harvest_kg: harvestKg,
            benchmark_loss_rate_pct: lossRate,
            expected_loss_kg: lossKg,
            expected_loss_value_rwf: lossKg * price,
            avg_selling_price_rwf_per_kg: price,
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [district, crop, season, harvestKg]);

  // Calculations for NST2 Target Avoidable Loss Dividend (target <= 5.0%)
  const lossRate = estimate?.benchmark_loss_rate_pct || 11.5;
  const price = estimate?.avg_selling_price_rwf_per_kg || 520;
  const targetPct = 5.0;
  const avoidableRate = Math.max(0, lossRate - targetPct);
  const avoidableKg = (harvestKg * avoidableRate) / 100;
  const avoidableRwf = avoidableKg * price;

  const expectedLossKg = estimate?.expected_loss_kg || ((harvestKg * lossRate) / 100);
  const retainedKg = Math.max(0, harvestKg - expectedLossKg);
  const retainedPct = harvestKg > 0 ? ((retainedKg / harvestKg) * 100).toFixed(1) : 88.5;

  return (
    <div className="bg-white/95 border border-black/[0.06] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs flex flex-col justify-between space-y-4.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 h-full">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold tracking-tight text-slate-900 uppercase block">
                Pre-Harvest Risk Simulator
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                Forecast post-harvest risk prior to field desiccation
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold uppercase shrink-0">
            PREDICTIVE
          </span>
        </div>

        {/* Input Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
              District
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full text-xs font-mono font-semibold bg-slate-50 border border-black/[0.06] rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-2xs truncate cursor-pointer transition-all"
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
              Commodity
            </label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full text-xs font-mono font-semibold bg-slate-50 border border-black/[0.06] rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-2xs truncate cursor-pointer transition-all"
            >
              {COMMON_CROPS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
              Season
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full text-xs font-mono font-semibold bg-slate-50 border border-black/[0.06] rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-2xs cursor-pointer transition-all"
            >
              {SEASONS.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Harvest Yield Slider & Presets */}
        <div className="bg-slate-50/80 p-3 rounded-2xl border border-black/[0.04] space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600 font-semibold flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-emerald-600" />
              <span>Projected Harvest Yield:</span>
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-extrabold text-slate-900 tnum">{harvestKg.toLocaleString()} kg</span>
              <span className="text-[10px] text-slate-400">({(harvestKg / 1000).toFixed(0)} tons)</span>
            </div>
          </div>

          <input
            type="range"
            min="5000"
            max="150000"
            step="5000"
            value={harvestKg}
            onChange={(e) => setHarvestKg(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          />

          {/* Quick Preset Buttons */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[9.5px] font-mono text-slate-400">Quick Scale:</span>
            <div className="flex items-center gap-1.5">
              {[10000, 25000, 50000, 100000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setHarvestKg(preset)}
                  className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold transition-all ${
                    harvestKg === preset
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-black/[0.05] hover:bg-slate-100'
                  }`}
                >
                  {preset / 1000}t
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Computed Predictive Outcomes */}
        {loading ? (
          <div className="p-4 text-center text-xs font-mono text-slate-400 animate-pulse">
            Simulating harvest risk...
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50/70 p-2.5 rounded-2xl border border-black/[0.04]">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">
                  Expected Physical Loss
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-mono font-extrabold text-rose-700 tnum">
                    {Math.round(expectedLossKg).toLocaleString()} kg
                  </span>
                  <span className="text-[10.5px] font-mono font-bold text-rose-600">
                    ({lossRate.toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="bg-slate-50/70 p-2.5 rounded-2xl border border-black/[0.04]">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">
                  Estimated Financial Risk
                </span>
                <span className="text-base font-mono font-extrabold text-amber-800 tnum block">
                  {estimate?.expected_loss_value_rwf 
                    ? `~${(estimate.expected_loss_value_rwf / 1000000).toFixed(2)}M RWF`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* NST2 Avoidable Loss Dividend Callout */}
            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-900 block">
                    NST2 MITIGATION DIVIDEND (≤5.0% TARGET)
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Potential cash saved if loss is cut to national target:
                  </span>
                </div>
              </div>

              <span className="text-sm font-mono font-black text-emerald-800 tnum shrink-0">
                +{avoidableRwf > 0 ? (avoidableRwf / 1000000).toFixed(2) : '0.00'}M RWF
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="pt-2.5 border-t border-black/[0.05] flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>Empirical SAS 2024–2025 Matrix</span>
        <span className="text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-black/[0.04]">
          Ref: {lossRate.toFixed(1)}% benchmark
        </span>
      </div>
    </div>
  );
}