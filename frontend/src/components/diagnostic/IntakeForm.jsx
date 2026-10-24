import React, { useState, useEffect } from 'react';
import { DISTRICTS, CROPS, SEASONS, CAUSES_ORDER, CAUSE_LABELS } from '../../data/staticData';
import { useOptions } from '../../context/OptionsContext';
import LiveBenchmarkPreview from './LiveBenchmarkPreview';
import { 
  Zap, 
  AlertCircle, 
  Send,
  Activity,
  Scissors,
  Bug,
  ShieldAlert,
  TrendingDown,
  Bird,
  Cog,
  Truck,
  Warehouse,
  Package,
  ShoppingBag
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

export const DEMO_PROFILES = [
  {
    id: 'typical',
    label: 'Typical Harvest',
    district: 'Musanze',
    crop: 'Maize',
    season: 'A',
    harvestedQtyKg: '50000',
    causeLosses: {
      harvesting_damage: 1200,
      insects_pests: 1200,
      theft: 400,
      stalks_fallen: 500,
      birds_animals: 300,
      processing: 200,
      transport: 300,
      storage: 400,
      packaging: 100,
      sale: 100,
    },
    tag: '9.4% Loss • Benchmark Compliant',
    dotColor: 'bg-emerald-500'
  },
  {
    id: 'storage_rot',
    label: 'Storage Rot Outbreak',
    district: 'Nyagatare',
    crop: 'Maize',
    season: 'A',
    harvestedQtyKg: '50000',
    causeLosses: {
      harvesting_damage: 500,
      insects_pests: 800,
      theft: 300,
      stalks_fallen: 400,
      birds_animals: 200,
      processing: 200,
      transport: 400,
      storage: 5900,
      packaging: 200,
      sale: 200,
    },
    tag: '18.2% Loss • Elevated Storage Loss',
    dotColor: 'bg-amber-500'
  },
  {
    id: 'pest_crisis',
    label: 'Bruchid Pest Crisis',
    district: 'Gatsibo',
    crop: 'Climbing bean',
    season: 'B',
    harvestedQtyKg: '25000',
    causeLosses: {
      harvesting_damage: 400,
      insects_pests: 4200,
      theft: 300,
      stalks_fallen: 200,
      birds_animals: 200,
      processing: 100,
      transport: 200,
      storage: 300,
      packaging: 50,
      sale: 50,
    },
    tag: '24.0% Loss • Severe Pest Damage',
    dotColor: 'bg-rose-500'
  },
];

export default function IntakeForm({
  selectedCoop,
  onSubmit,
  onLiveChange,
  isSubmitting,
  error
}) {
  const options = useOptions();
  const districtList = options.districts?.length ? options.districts : DISTRICTS;
  const cropList = options.crops?.length ? options.crops : CROPS;
  const seasonList = options.seasons?.length ? options.seasons : SEASONS;

  const [activeProfile, setActiveProfile] = useState('typical');
  const [district, setDistrict] = useState(DEMO_PROFILES[0].district);
  const [crop, setCrop] = useState(DEMO_PROFILES[0].crop);
  const [season, setSeason] = useState(DEMO_PROFILES[0].season);
  const [harvestedQtyKg, setHarvestedQtyKg] = useState(DEMO_PROFILES[0].harvestedQtyKg);
  const [causeLosses, setCauseLosses] = useState({ ...DEMO_PROFILES[0].causeLosses });
  const [formValidationError, setFormValidationError] = useState(null);

  const handleSelectProfile = (profile) => {
    setActiveProfile(profile.id);
    setDistrict(profile.district);
    setCrop(profile.crop);
    setSeason(profile.season);
    setHarvestedQtyKg(profile.harvestedQtyKg);
    setCauseLosses({ ...profile.causeLosses });
  };

  const handleCauseChange = (key, val) => {
    setActiveProfile('custom');
    const num = Math.max(0, parseFloat(val) || 0);
    setCauseLosses(prev => ({ ...prev, [key]: num }));
  };

  // Compute calculated total loss
  const currentTotalLoss = Object.values(causeLosses).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const parsedHarvested = parseFloat(harvestedQtyKg) || 0;
  const currentLossRatePct = parsedHarvested > 0 
    ? ((currentTotalLoss / parsedHarvested) * 100).toFixed(1)
    : '0.0';

  // Broadcast live changes to parent for split-screen live scorecard
  useEffect(() => {
    if (onLiveChange && parsedHarvested > 0) {
      onLiveChange({
        district,
        crop,
        season,
        harvestedQtyKg: parsedHarvested,
        totalLossKg: currentTotalLoss,
        lossRatePct: parseFloat(currentLossRatePct),
        causeLosses,
      });
    }
  }, [district, crop, season, parsedHarvested, currentTotalLoss, currentLossRatePct, causeLosses, onLiveChange]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormValidationError(null);

    if (parsedHarvested <= 0) {
      setFormValidationError('Harvested quantity must be greater than 0 kg.');
      return;
    }

    if (currentTotalLoss > parsedHarvested) {
      setFormValidationError(
        `Total loss (${currentTotalLoss.toLocaleString()} kg) cannot exceed harvested quantity (${parsedHarvested.toLocaleString()} kg).`
      );
      return;
    }

    if (currentTotalLoss <= 0) {
      setFormValidationError('Please report at least a minimal crop loss or select a cause.');
      return;
    }

    const payload = {
      coop_id: selectedCoop?.id || 1,
      district,
      crop,
      season: season || null,
      harvested_qty_kg: parsedHarvested,
      loss_by_cause_kg: causeLosses,
    };

    onSubmit(payload);
  };

  return (
    <div className="bg-white/95 rounded-[28px] border border-black/[0.06] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs space-y-5">
      {/* 1-Click Pre-loaded Demo Profiles Bar */}
      <div className="space-y-2 pb-4 border-b border-black/[0.05]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>1-Click Scenarios:</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">Zero typing needed</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DEMO_PROFILES.map((p) => {
            const isSelected = activeProfile === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProfile(p)}
                className={`p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50/80 border-black/[0.05] hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-mono font-bold text-slate-900 truncate">
                    {p.label}
                  </span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${p.dotColor}`} />
                </div>
                <span className="text-[10px] font-mono text-slate-500 block mt-0.5 truncate">
                  {p.district} • {p.crop}
                </span>
                <span className="text-[9.5px] font-mono font-semibold text-slate-600 block mt-1">
                  {p.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {(formValidationError || error) && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{formValidationError || error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Context Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* District */}
          <div>
            <label className="block text-[10.5px] font-bold text-slate-600 mb-1 font-mono uppercase tracking-wider">
              District
            </label>
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setActiveProfile('custom');
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50/90 border border-black/[0.07] text-slate-900 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs transition-all cursor-pointer"
            >
              {districtList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Crop */}
          <div>
            <label className="block text-[10.5px] font-bold text-slate-600 mb-1 font-mono uppercase tracking-wider">
              Crop Commodity
            </label>
            <select
              value={crop}
              onChange={(e) => {
                setCrop(e.target.value);
                setActiveProfile('custom');
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50/90 border border-black/[0.07] text-slate-900 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs transition-all cursor-pointer"
            >
              {cropList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Season */}
          <div>
            <label className="block text-[10.5px] font-bold text-slate-600 mb-1 font-mono uppercase tracking-wider">
              Season
            </label>
            <select
              value={season}
              onChange={(e) => {
                setSeason(e.target.value);
                setActiveProfile('custom');
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50/90 border border-black/[0.07] text-slate-900 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs transition-all cursor-pointer"
            >
              {seasonList.map((s) => {
                const sId = typeof s === 'string' ? s : s.id;
                const sName = typeof s === 'string' ? `Season ${s}` : s.name;
                return (
                  <option key={sId} value={sId}>{sName}</option>
                );
              })}
            </select>
          </div>

          {/* Harvested Quantity */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10.5px] font-bold text-slate-600 font-mono uppercase tracking-wider">
                Harvest (kg)
              </label>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                {parsedHarvested > 0 ? `${(parsedHarvested / 1000).toFixed(0)}t` : '0t'}
              </span>
            </div>
            <input
              type="number"
              min="1"
              required
              value={harvestedQtyKg}
              onChange={(e) => {
                setHarvestedQtyKg(e.target.value);
                setActiveProfile('custom');
              }}
              placeholder="e.g. 50000"
              className="w-full px-2.5 py-1.5 bg-slate-50/90 border border-black/[0.07] text-slate-900 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs font-bold transition-all"
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 mt-1.5">
              {[10000, 25000, 50000, 100000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setHarvestedQtyKg(String(preset));
                    setActiveProfile('custom');
                  }}
                  className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                    harvestedQtyKg === String(preset)
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold shadow-2xs ring-1 ring-emerald-500/20'
                      : 'bg-slate-100/90 text-slate-600 border-black/[0.04] hover:bg-slate-200'
                  }`}
                >
                  {preset / 1000}t
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Survey Benchmark Reference */}
        <LiveBenchmarkPreview district={district} crop={crop} season={season} />

        {/* Itemized 10 Causes Loss Grid */}
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-black/[0.05] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-800 uppercase tracking-wider">
              Loss Quantities by Cause (kg)
            </span>
            <div className="bg-white px-2.5 py-1 rounded-lg border border-black/[0.05] text-xs font-mono">
              <span className="text-slate-500 text-[10.5px]">Total Loss: </span>
              <strong className="text-emerald-700 font-extrabold tnum">{currentTotalLoss.toLocaleString()} kg</strong>
              <span className="text-slate-400 mx-1">•</span>
              <strong className="text-slate-900 font-extrabold">{currentLossRatePct}%</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {CAUSES_ORDER.map((cKey) => {
              const meta = CAUSE_LABELS[cKey];
              const causeKg = causeLosses[cKey] || 0;
              const sharePct = currentTotalLoss > 0 
                ? ((causeKg / currentTotalLoss) * 100).toFixed(0) 
                : 0;
              const IconComp = (meta && CAUSE_ICONS[meta.icon]) || Bug;

              return (
                <div 
                  key={cKey} 
                  className="bg-white p-2.5 rounded-xl border border-black/[0.06] hover:border-black/[0.12] transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <IconComp 
                          className="w-3.5 h-3.5 shrink-0" 
                          style={{ color: meta?.hex || '#64748B' }} 
                        />
                        <label 
                          className="block text-[10.5px] font-mono text-slate-800 font-semibold truncate" 
                          title={meta?.name || cKey}
                        >
                          {meta?.shortName || meta?.name || cKey}
                        </label>
                      </div>
                      <span 
                        className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full shrink-0 border"
                        style={{
                          backgroundColor: `${meta?.hex || '#10B981'}15`,
                          color: meta?.hex || '#10B981',
                          borderColor: `${meta?.hex || '#10B981'}30`,
                        }}
                      >
                        {sharePct}%
                      </span>
                    </div>
                    
                    {/* Progress indicator */}
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, sharePct)}%`,
                          backgroundColor: meta?.hex || '#10B981'
                        }}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={causeLosses[cKey]}
                      onChange={(e) => handleCauseChange(cKey, e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50/80 border border-black/[0.06] rounded-lg text-xs font-mono text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 pr-6"
                    />
                    <span className="absolute right-1.5 top-1 text-[9.5px] font-mono text-slate-400 pointer-events-none">
                      kg
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Strip & Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-black/[0.05]">
          <div className="text-xs font-mono text-slate-600 flex flex-wrap items-center gap-2">
            <span>Harvest: <strong className="text-slate-900 font-bold tnum">{parsedHarvested.toLocaleString()} kg</strong></span>
            <span className="text-slate-300">•</span>
            <span>Loss: <strong className="text-rose-700 font-bold tnum">{currentTotalLoss.toLocaleString()} kg</strong></span>
            <span className="text-slate-300">•</span>
            <span>Loss Rate: <strong className="text-amber-700 font-bold tnum">{currentLossRatePct}%</strong></span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm shadow-emerald-700/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating assessment...</span>
              </span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-emerald-200" />
                <span>Submit harvest assessment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
