import React, { useState, useEffect } from 'react';
import { DISTRICTS, CROPS, SEASONS, CAUSES_ORDER, CAUSE_LABELS } from '../../data/staticData';
import { useOptions } from '../../context/OptionsContext';
import LiveBenchmarkPreview from './LiveBenchmarkPreview';
import { 
  ClipboardList, 
  Sparkles, 
  Sliders, 
  AlertCircle, 
  CheckCircle2, 
  Send,
  Zap,
  Activity,
  Layers
} from 'lucide-react';

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

  const [district, setDistrict] = useState(selectedCoop?.district || districtList[0] || 'Musanze');
  const [crop, setCrop] = useState(selectedCoop?.primaryCrop || 'Maize');
  const [season, setSeason] = useState('A');
  const [harvestedQtyKg, setHarvestedQtyKg] = useState('50000');
  
  // Dual-mode state: 'express' vs 'diagnostic'
  const [mode, setMode] = useState('diagnostic');

  // Express mode input
  const [totalLossKg, setTotalLossKg] = useState('6000');

  // Diagnostic mode inputs (10 causes in kg)
  const [causeLosses, setCauseLosses] = useState({
    theft: 500,
    insects_pests: 3200,
    birds_animals: 300,
    stalks_fallen: 800,
    harvesting_damage: 200,
    transport: 200,
    storage: 600,
    processing: 100,
    packaging: 50,
    sale: 50,
  });

  const [formValidationError, setFormValidationError] = useState(null);

  // Sync district and primary crop if selected cooperative changes
  useEffect(() => {
    if (selectedCoop?.district) {
      setDistrict(selectedCoop.district);
    }
    if (selectedCoop?.primaryCrop) {
      setCrop(selectedCoop.primaryCrop);
    }
  }, [selectedCoop]);

  // Compute calculated total loss based on active mode
  const currentTotalLoss = mode === 'express'
    ? parseFloat(totalLossKg) || 0
    : Object.values(causeLosses).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

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
        causeLosses: mode === 'diagnostic' ? causeLosses : null,
      });
    }
  }, [district, crop, season, parsedHarvested, currentTotalLoss, currentLossRatePct, mode, causeLosses, onLiveChange]);

  const handleCauseChange = (key, val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setCauseLosses(prev => ({ ...prev, [key]: num }));
  };

  const handleExpressPreset = (pct) => {
    if (parsedHarvested > 0) {
      const calculated = Math.round(parsedHarvested * (pct / 100));
      setTotalLossKg(String(calculated));
    }
  };

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
      coop_id: selectedCoop.id,
      district,
      crop,
      season: season || null,
      harvested_qty_kg: parsedHarvested,
    };

    if (mode === 'express') {
      payload.total_loss_kg = currentTotalLoss;
    } else {
      payload.loss_by_cause_kg = causeLosses;
    }

    onSubmit(payload);
  };

  return (
    <div className="bg-white/95 rounded-[28px] border border-black/[0.06] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs space-y-5">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-black/[0.05] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800">
              ASSESSMENT INTAKE
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-emerald-600" />
            <span>Check your harvest losses</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Logging harvest for <strong className="text-slate-800 font-semibold">{selectedCoop?.name || 'Selected Cooperative'}</strong>
          </p>
        </div>

        {/* Dual Mode Switcher Pill */}
        <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-full border border-black/[0.04] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('express')}
            className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'express'
                ? 'bg-white text-slate-900 shadow-xs border border-black/[0.04]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Express</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('diagnostic')}
            className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'diagnostic'
                ? 'bg-white text-slate-900 shadow-xs border border-black/[0.04]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3 h-3 text-emerald-600" />
            <span>10 Causes</span>
          </button>
        </div>
      </div>

      {(formValidationError || error) && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{formValidationError || error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Context Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* District */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider font-mono">
              District
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/80 border border-black/[0.06] text-slate-900 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs transition-all"
            >
              {districtList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Crop */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider font-mono">
              Crop Commodity
            </label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/80 border border-black/[0.06] text-slate-900 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs transition-all"
            >
              {cropList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Season */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider font-mono">
              Season
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/80 border border-black/[0.06] text-slate-900 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs transition-all"
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

          {/* Harvested Quantity with Quick Presets */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider font-mono">
                Harvested (kg)
              </label>
              <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                {parsedHarvested > 0 ? `${(parsedHarvested / 1000).toFixed(1)} t` : '0 t'}
              </span>
            </div>
            <input
              type="number"
              min="1"
              required
              value={harvestedQtyKg}
              onChange={(e) => setHarvestedQtyKg(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full px-3 py-2 bg-slate-50/80 border border-black/[0.06] text-slate-900 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs transition-all"
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 mt-2">
              {[10000, 25000, 50000, 100000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setHarvestedQtyKg(String(preset))}
                  className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full border transition-all ${
                    harvestedQtyKg === String(preset)
                      ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                      : 'bg-slate-100/90 text-slate-600 border-black/[0.04] hover:bg-slate-200'
                  }`}
                >
                  {preset / 1000}t
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Live Benchmark Preview Card */}
        <LiveBenchmarkPreview district={district} crop={crop} season={season} />

        {/* Step 3: Loss Input (Express vs Diagnostic) */}
        {mode === 'express' ? (
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-black/[0.05] space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-800">
                  Total Post-Harvest Loss Quantity (kg)
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Enter estimated total loss or choose an express severity benchmark:
                </p>
              </div>

              {/* Express Severity Preset Steppers */}
              <div className="flex items-center gap-1.5">
                {[
                  { label: '5% Low', pct: 5 },
                  { label: '10% Normal', pct: 10 },
                  { label: '15% Elevated', pct: 15 },
                  { label: '20% Severe', pct: 20 },
                ].map((item) => (
                  <button
                    key={item.pct}
                    type="button"
                    onClick={() => handleExpressPreset(item.pct)}
                    className="px-2 py-1 rounded-full text-[10px] font-mono font-bold bg-white border border-black/[0.06] text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-all shadow-2xs active:scale-95"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max={harvestedQtyKg}
                value={totalLossKg}
                onChange={(e) => setTotalLossKg(e.target.value)}
                className="w-full max-w-xs px-3.5 py-2.5 bg-white border border-black/[0.08] rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs font-bold"
              />
              <div className="text-xs font-mono text-slate-600 bg-white px-3 py-2.5 rounded-xl border border-black/[0.06] shadow-2xs">
                Loss Rate: <strong className="text-emerald-700 font-extrabold">{currentLossRatePct}%</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              In Express mode, the backend automatically attributes the dominant loss driver based on NISR national crop baseline distributions.
            </p>
          </div>
        ) : (
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-black/[0.05] space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>Itemized Loss Quantities by Cause (kg)</span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-black/[0.05]">
                    10 NISR Dimensions
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Enter volume lost at each supply chain stage. Percentages update in real time.
                </p>
              </div>
              <div className="text-left sm:text-right bg-white px-3 py-1.5 rounded-xl border border-black/[0.05] shadow-2xs">
                <span className="text-[10.5px] text-slate-500 font-mono">Running Loss Total: </span>
                <span className="text-xs font-mono font-black text-emerald-700 tnum">
                  {currentTotalLoss.toLocaleString()} kg ({currentLossRatePct}%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {CAUSES_ORDER.map((cKey) => {
                const meta = CAUSE_LABELS[cKey];
                const causeKg = causeLosses[cKey] || 0;
                const sharePct = currentTotalLoss > 0 
                  ? ((causeKg / currentTotalLoss) * 100).toFixed(0) 
                  : 0;

                return (
                  <div 
                    key={cKey} 
                    className="bg-white p-3 rounded-xl border border-black/[0.06] hover:border-black/[0.12] transition-all shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <label 
                          className="block text-[11px] font-mono text-slate-800 font-semibold truncate" 
                          title={meta?.name || cKey}
                        >
                          {meta?.name || cKey}
                        </label>
                        <span className="text-[9.5px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full shrink-0">
                          {sharePct}%
                        </span>
                      </div>
                      
                      {/* Mini progress bar of cause share */}
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, sharePct)}%` }}
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={causeLosses[cKey]}
                        onChange={(e) => handleCauseChange(cKey, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50/80 border border-black/[0.06] rounded-lg text-xs font-mono text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 pr-7"
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] font-mono text-slate-400 pointer-events-none">
                        kg
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Summary Strip & Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-black/[0.05]">
          <div className="text-xs font-mono text-slate-600 flex flex-wrap items-center gap-2 sm:gap-3">
            <span>Harvest: <strong className="text-slate-900 font-bold tnum">{parsedHarvested.toLocaleString()} kg</strong></span>
            <span className="text-slate-300">•</span>
            <span>Loss: <strong className="text-rose-700 font-bold tnum">{currentTotalLoss.toLocaleString()} kg</strong></span>
            <span className="text-slate-300">•</span>
            <span>Loss Rate: <strong className="text-amber-700 font-bold tnum">{currentLossRatePct}%</strong></span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating assessment...</span>
              </span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Submit harvest assessment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
