import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { CAUSE_LABELS } from '../../data/staticData';
import { Wheat, DollarSign, Percent, TrendingUp, Sparkles, Filter } from 'lucide-react';

const CROP_ICONS = {
  Fruits: '🍎',
  'Dessert banana': '🍌',
  'Paddy rice': '🌾',
  Maize: '🌽',
  'Banana for beer': '🍌',
  'Cooking banana': '🍌',
  'Climbing bean': '🫘',
  Pea: '🟢',
  'Irish potato': '🥔',
  Vegetables: '🥬',
  Wheat: '🌾',
  Cassava: '🌿',
};

export default function CropRanking({ 
  activeCause = 'all',
  selectedCrop = 'all',
  onSelectCrop
}) {
  const [metricMode, setMetricMode] = useState('loss_pct'); // 'loss_pct' | 'value_at_risk'
  const [cropsData, setCropsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getByCrop()
      .then((res) => {
        if (isMounted && res?.crops) {
          setCropsData(res.crops);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate Value at Risk per 100 tons (100,000 kg)
  const cropsWithMetrics = cropsData.map((c) => {
    const rate = c.avg_loss_rate_pct || 0;
    const price = c.avg_selling_price_rwf_per_kg || 480;
    const lossValueRwfPer100t = (100000 * (rate / 100) * price);
    return {
      crop: c.crop,
      dominant_cause: c.dominant_cause,
      loss_rate_pct: rate,
      price_rwf_per_kg: price,
      n_records: c.n_records,
      lossValueRwfPer100t,
      lossValueMillionRwf: (lossValueRwfPer100t / 1000000).toFixed(1),
    };
  });

  // Sort based on active cause filter (matching crops first) then active metric
  const sortedCrops = [...cropsWithMetrics].sort((a, b) => {
    if (activeCause !== 'all') {
      const aMatches = a.dominant_cause === activeCause ? 1 : 0;
      const bMatches = b.dominant_cause === activeCause ? 1 : 0;
      if (aMatches !== bMatches) {
        return bMatches - aMatches;
      }
    }
    if (metricMode === 'value_at_risk') {
      return b.lossValueRwfPer100t - a.lossValueRwfPer100t;
    }
    return b.loss_rate_pct - a.loss_rate_pct;
  });

  const topCrops = sortedCrops.slice(0, 5);
  const activeCauseMeta = activeCause !== 'all' ? CAUSE_LABELS[activeCause] : null;

  return (
    <div className="bg-white border border-black/[0.05] rounded-[28px] p-6 flex flex-col h-[560px] shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300">
      {/* Card Header Strip */}
      <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Wheat className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase truncate">
              VULNERABLE CROPS
            </h3>
            {activeCauseMeta && (
              <span className="text-[9.5px] font-mono text-slate-500 block">
                Highlighting {activeCauseMeta.shortName}
              </span>
            )}
          </div>
        </div>

        {/* Dual-Metric Pill Switcher */}
        <div className="flex items-center bg-slate-100/90 p-0.5 rounded-full border border-black/[0.04] text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setMetricMode('loss_pct')}
            className={`px-2.5 py-0.5 rounded-full transition-all duration-150 cursor-pointer ${
              metricMode === 'loss_pct'
                ? 'bg-white text-slate-900 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            % LOSS
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('value_at_risk')}
            className={`px-2.5 py-0.5 rounded-full transition-all duration-150 cursor-pointer ${
              metricMode === 'value_at_risk'
                ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            RWF RISK
          </button>
        </div>
      </div>

      {/* Commodity List */}
      <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 no-scrollbar">
        {loading ? (
          <div className="h-40 flex items-center justify-center text-xs text-slate-400 font-mono animate-pulse">
            Loading crop microdata...
          </div>
        ) : (
          topCrops.map((c, idx) => {
            const icon = CROP_ICONS[c.crop] || '🌱';
            const maxVal = metricMode === 'value_at_risk' ? 12 : 20;
            const currentVal = metricMode === 'value_at_risk' 
              ? parseFloat(c.lossValueMillionRwf) 
              : c.loss_rate_pct;
            const progressPct = Math.min(100, (currentVal / maxVal) * 100);

            const causeMeta = CAUSE_LABELS[c.dominant_cause];
            const isMatch = activeCause !== 'all' && c.dominant_cause === activeCause;
            const isSelectedCrop = selectedCrop === c.crop;

            return (
              <div
                key={c.crop}
                onClick={() => {
                  if (onSelectCrop) {
                    onSelectCrop(isSelectedCrop ? 'all' : c.crop);
                  }
                }}
                className={`p-3.5 px-4 rounded-2xl transition-all duration-200 cursor-pointer border ${
                  isSelectedCrop
                    ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : isMatch
                    ? 'bg-amber-50/50 border-amber-300 shadow-2xs hover:bg-amber-50/80 hover:-translate-y-0.5'
                    : 'bg-slate-50/70 border-black/[0.04] hover:border-black/[0.1] hover:bg-slate-100/80 hover:-translate-y-0.5 hover:shadow-2xs'
                }`}
                title="Click commodity to filter map and causes"
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10.5px] font-extrabold text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm">{icon}</span>
                      <h4 className="text-xs font-bold text-slate-900">{c.crop}</h4>
                      {isMatch && (
                        <span 
                          className="text-[8.5px] font-mono px-1.5 py-0.2 rounded-full font-black text-white shadow-2xs"
                          style={{ backgroundColor: activeCauseMeta?.hex || '#D97706' }}
                        >
                          TARGET MATCH
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Driver:
                      </span>
                      <span 
                        className="text-[10px] font-mono font-bold capitalize"
                        style={{ color: causeMeta?.hex || '#92400E' }}
                      >
                        {causeMeta?.shortName || c.dominant_cause?.replace('_', ' ') || 'Survey baseline'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    {metricMode === 'loss_pct' ? (
                      <>
                        <span className="text-xs font-mono font-extrabold text-rose-600 tnum block">
                          {c.loss_rate_pct}% loss
                        </span>
                        {c.price_rwf_per_kg && (
                          <span className="text-[9px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-black/[0.06] tnum inline-block mt-0.5">
                            {Math.round(c.price_rwf_per_kg)} RWF/kg
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-mono font-extrabold text-emerald-700 tnum block">
                          ~{c.lossValueMillionRwf}M RWF
                        </span>
                        <span className="text-[9px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60 tnum inline-block mt-0.5">
                          {c.loss_rate_pct}% @ {Math.round(c.price_rwf_per_kg)} RWF
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      metricMode === 'value_at_risk'
                        ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                        : isMatch
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-amber-500 to-rose-500'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Economic Insight Callout */}
      <div className="mt-3.5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-[11px] text-slate-700 flex-shrink-0">
        <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-0.5 text-xs">
          <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Value-at-Risk Insight:</span>
        </div>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          {metricMode === 'value_at_risk'
            ? 'Ranking prioritized by financial capital forfeited per 100t harvest. Paddy rice and beans yield heavy economic damage despite moderate physical loss.'
            : 'Fruits suffer the highest physical loss volume (18.8%). Switch to RWF Risk above to observe price-weighted financial depletion.'}
        </p>
      </div>
    </div>
  );
}
