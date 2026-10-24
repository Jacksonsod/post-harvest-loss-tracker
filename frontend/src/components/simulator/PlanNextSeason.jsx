import React, { useState } from 'react';
import BentoPreHarvestSimulator from '../situation_room/BentoPreHarvestSimulator';
import BentoStorageComparison from '../situation_room/BentoStorageComparison';
import BentoDispatchCard from '../situation_room/BentoDispatchCard';
import { Calculator } from 'lucide-react';

export default function PlanNextSeason({ selectedCoop }) {
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
                NST2 ≤5.0% TARGET
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Simulate pre-harvest loss risks, compare storage infrastructure efficacy, and review district extension priorities.
            </p>
          </div>
        </div>
      </div>

      {/* Main 12-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Interactive Pre-Harvest Risk Simulator (Span 7) */}
        <div className="lg:col-span-7 flex flex-col">
          <BentoPreHarvestSimulator 
            selectedDistrict={selectedDistrict} 
            onDistrictChange={setSelectedDistrict}
          />
        </div>

        {/* Right Column: Storage Technology Efficacy Matrix & Extension Priorities (Span 5) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <BentoStorageComparison />
          <BentoDispatchCard selectedDistrict={selectedDistrict} />
        </div>
      </div>
    </div>
  );
}
