import React, { useState } from 'react';
import BentoPreHarvestSimulator from '../situation_room/BentoPreHarvestSimulator';
import BentoStorageComparison from '../situation_room/BentoStorageComparison';
import BentoDispatchCard from '../situation_room/BentoDispatchCard';
import { Calculator, Sparkles, ShieldCheck, ArrowRight, Info, CheckCircle2 } from 'lucide-react';

export default function PlanNextSeason({ selectedCoop, onNavigateToCheckLosses }) {
  const [selectedDistrict, setSelectedDistrict] = useState(selectedCoop?.district || 'Musanze');

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-white/95 rounded-[28px] border border-black/[0.06] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 font-mono tracking-tight uppercase">
                Plan Next Season
              </h2>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                PREDICTIVE YIELD FORECASTER
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-black/[0.05]">
                NST2 ≤5.0% TARGET ALIGNED
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Forecast expected post-harvest loss volume and economic risk prior to harvest, and evaluate storage infrastructure dividends.
            </p>
          </div>
        </div>

        {selectedCoop && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-black/[0.06] text-xs font-mono">
            <span className="text-slate-400">Context:</span>
            <span className="font-bold text-slate-800">{selectedCoop.name}</span>
            <span className="text-emerald-700 font-semibold">({selectedCoop.district})</span>
          </div>
        )}
      </div>

      {/* Main 12-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Interactive Pre-Harvest Risk Simulator (Span 7) */}
        <div className="lg:col-span-7 flex flex-col">
          <BentoPreHarvestSimulator 
            selectedDistrict={selectedDistrict} 
          />
        </div>

        {/* Right Column: Storage Technology Efficacy Matrix & Dispatch Alerts (Span 5) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <BentoStorageComparison />
          <BentoDispatchCard selectedDistrict={selectedDistrict} />
        </div>
      </div>

      {/* Guidance Footer Bar */}
      <div className="bg-slate-50 border border-black/[0.05] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Already completed harvest collection? Record your actual losses to benchmark against this season's targets.
          </span>
        </div>
        {onNavigateToCheckLosses && (
          <button
            onClick={onNavigateToCheckLosses}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shrink-0 active:scale-95"
          >
            <span>Check my losses</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        )}
      </div>
    </div>
  );
}
