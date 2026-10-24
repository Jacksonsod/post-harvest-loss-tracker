import React, { useState } from 'react';
import LayersPanel from './LayersPanel';
import DistrictChoropleth from './DistrictChoropleth';
import CoopNodesLayer from './CoopNodesLayer';
import TacticalTooltip from './TacticalTooltip';
import DistrictHotspots from './DistrictHotspots';
import CropRanking from './CropRanking';
import PolicyActionBox from './PolicyActionBox';
import BentoPreHarvestSimulator from './BentoPreHarvestSimulator';
import BentoStorageComparison from './BentoStorageComparison';
import BentoDispatchCard from './BentoDispatchCard';

import { RWANDA_VIEWBOX } from '../../data/rwandaDistrictPaths';
import { CAUSES_ORDER } from '../../data/staticData';
import { CAUSE_METADATA, DISTRICT_LOSS_RANKINGS } from '../../data/nationalMetrics';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter,
  MapPin,
  Compass,
  Layers,
  Sparkles
} from 'lucide-react';

export default function SituationRoomMap({ 
  selectedCoop, 
  onSelectCoop,
  activeSeason = 'all',
  onSelectSeason,
  onNavigateToDiagnostic 
}) {
  const [activeCause, setActiveCause] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [layers, setLayers] = useState({
    hotspots: true,
    coops: true,
    pests: true,
    storage: true,
    transit: true,
  });

  const [zoomLevel, setZoomLevel] = useState(1);
  const [is3DMode, setIs3DMode] = useState(false);
  const [showLayersDropdown, setShowLayersDropdown] = useState(false);

  const toggleLayer = (layerId) => {
    setLayers((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  const handleHoverDistrict = (districtName, e) => {
    setHoveredDistrict({ name: districtName });
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (hoveredDistrict) {
      setMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleLeaveDistrict = () => {
    setHoveredDistrict(null);
  };

  const handleResetView = () => {
    setSelectedDistrict(null);
    setZoomLevel(1);
    setIs3DMode(false);
  };

  const activeDistrictName = selectedDistrict || hoveredDistrict?.name;
  const activeDistrictStats = activeDistrictName 
    ? DISTRICT_LOSS_RANKINGS.find((d) => d.district.toLowerCase() === activeDistrictName.toLowerCase())
    : null;

  return (
    <div className="space-y-4" onMouseMove={handleMouseMove}>
      {/* 1. Root-Cause Re-shading Streamlined Ceramic Pill Bar */}
      <div className="bg-white/90 backdrop-blur-md border border-black/[0.06] rounded-2xl p-2 px-3.5 flex items-center justify-between gap-3 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all">
        {/* Left Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 shrink-0">
          <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Filter className="w-3 h-3" />
          </div>
          <span className="hidden sm:inline text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Loss Driver:
          </span>
        </div>

        {/* Scrollable / Responsive Pills with hidden scrollbar and clean badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
          <button
            onClick={() => setActiveCause('all')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-all duration-150 whitespace-nowrap active:scale-95 shrink-0 ${
              activeCause === 'all'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 font-medium'
            }`}
          >
            <span>All Causes</span>
            <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
              activeCause === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-500'
            }`}>
              100%
            </span>
          </button>

          {CAUSES_ORDER.map((cKey) => {
            const meta = CAUSE_METADATA[cKey];
            if (!meta) return null;
            const isActive = activeCause === cKey;
            
            const shortNames = {
              insects_pests: 'Insects & Pests',
              theft: 'Field & Barn Theft',
              stalks_fallen: 'Lodging / Ground Fall',
              birds_animals: 'Wildlife & Birds',
              harvesting_damage: 'Harvesting',
              processing: 'Processing',
              storage: 'Storage Decay',
              transport: 'Transport',
              packaging: 'Packaging',
              sale: 'Market Spoilage'
            };
            const label = shortNames[cKey] || meta.name;

            return (
              <button
                key={cKey}
                onClick={() => setActiveCause(isActive ? 'all' : cKey)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-150 whitespace-nowrap active:scale-95 shrink-0 ${
                  isActive
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'bg-white text-slate-700 border border-black/[0.06] hover:border-black/[0.14] hover:bg-slate-50 font-medium'
                }`}
              >
                <span>{label}</span>
                <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {meta.share}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Reset on Right if Filtered */}
        {activeCause !== 'all' && (
          <button
            onClick={() => setActiveCause('all')}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-full border border-rose-200/60 transition-all shrink-0 active:scale-95 flex items-center gap-1 shadow-2xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="text-[10.5px] hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* 4. Core Bento Grid: Spatial Cartography (Left 50%), District Hotspots (Mid 25%), Vulnerable Commodities (Right 25%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Full-Bleed Rwanda Cartography Bento Card (Span 6) */}
        <div className="lg:col-span-6 bg-white border border-black/[0.05] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between h-[560px] relative overflow-hidden">
          {/* Card Top Strip */}
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] mb-3 flex-shrink-0 z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>RWANDA ADM2 ATLAS</span>
              </span>
              <span className="text-[9px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-black/[0.04]">
                30 DISTRICTS
              </span>
            </div>

            {/* Map Controls HUD */}
            <div className="flex items-center gap-1.5">
              {/* Layers toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowLayersDropdown(!showLayersDropdown)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 border border-black/[0.04] rounded-xl transition-all active:scale-95"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Layers</span>
                </button>
                {showLayersDropdown && (
                  <div className="absolute top-full right-0 mt-2 z-30 w-56 bg-white/95 border border-black/[0.08] rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    <LayersPanel layers={layers} onToggleLayer={toggleLayer} />
                  </div>
                )}
              </div>

              {/* 2D / 3D Mode */}
              <div className="flex bg-slate-100/90 border border-black/[0.04] rounded-xl p-0.5">
                <button
                  onClick={() => setIs3DMode(false)}
                  className={`px-2 py-0.5 text-[10.5px] font-mono font-bold rounded-lg transition-all ${
                    !is3DMode ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  2D
                </button>
                <button
                  onClick={() => setIs3DMode(true)}
                  className={`px-2 py-0.5 text-[10.5px] font-mono font-bold rounded-lg transition-all ${
                    is3DMode ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  3D
                </button>
              </div>

              {/* Zoom & Reset */}
              <div className="flex items-center bg-slate-100/80 border border-black/[0.04] rounded-xl overflow-hidden">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.2))}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors border-l border-black/[0.04]"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetView}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors border-l border-black/[0.04]"
                  title="Reset View"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Map Surface */}
          <div className="relative flex-1 w-full rounded-2xl overflow-hidden bg-slate-50/70 border border-black/[0.03] tactical-grid flex items-center justify-center">
            {/* S-Tier Floating Cartography HUD Badge */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-3 bg-white/95 border border-black/[0.08] px-3.5 py-2 rounded-2xl shadow-lg text-xs font-mono backdrop-blur-xl transition-all duration-200">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  activeDistrictStats?.avg_loss_rate_pct > 12.5 
                    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' 
                    : activeDistrictStats?.avg_loss_rate_pct > 10 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
                } animate-pulse`} />
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  {selectedDistrict ? 'DISTRICT FOCUS' : hoveredDistrict ? 'INSPECTING' : 'NATIONAL BASELINE'}:
                </span>
                <span className="text-slate-900 font-black uppercase text-xs">
                  {activeDistrictName || 'All Rwanda (30 Dist.)'}
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-black/[0.08] text-[11px]">
                <span className="font-extrabold text-slate-900">
                  {activeDistrictStats ? `${activeDistrictStats.avg_loss_rate_pct}%` : '11.82%'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Top: <strong className="text-slate-800">{activeDistrictStats ? activeDistrictStats.top_crop : 'Fruits'}</strong>
                </span>
              </div>

              {selectedDistrict && (
                <button
                  onClick={() => setSelectedDistrict(null)}
                  className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-[10px] font-bold transition-colors"
                  title="Clear district focus"
                >
                  ✕ CLEAR
                </button>
              )}
            </div>

            {/* SVG Choropleth & Radar Nodes */}
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-300 p-2"
              style={{
                transform: `scale(${zoomLevel}) ${is3DMode ? 'rotateX(22deg) rotateZ(-3deg)' : ''}`,
                transformOrigin: 'center center',
              }}
            >
              <svg
                viewBox={RWANDA_VIEWBOX}
                className="w-full h-full max-h-[440px] drop-shadow-2xs"
              >
                <DistrictChoropleth
                  selectedDistrict={selectedDistrict}
                  hoveredDistrict={hoveredDistrict}
                  activeCause={activeCause}
                  isHotspotsLayerActive={layers.hotspots}
                  onHoverDistrict={handleHoverDistrict}
                  onLeaveDistrict={handleLeaveDistrict}
                  onSelectDistrict={setSelectedDistrict}
                />

                <CoopNodesLayer
                  selectedCoop={selectedCoop}
                  onSelectCoop={onSelectCoop}
                  isCoopsLayerActive={layers.coops}
                  isPestsLayerActive={layers.pests}
                  isStorageLayerActive={layers.storage}
                  isTransitLayerActive={layers.transit}
                />
              </svg>
            </div>

            {/* Minimal Map Legend in Corner */}
            <div className="absolute bottom-3 right-3 z-10 bg-white/90 border border-black/[0.06] rounded-xl p-1.5 px-2.5 shadow-xs backdrop-blur-md text-[9.5px] font-mono text-slate-600 hidden sm:block">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#86EFAC]" />
                  <span>&lt;10%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FDE047]" />
                  <span>10-12.5%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FCA5A5]" />
                  <span>&gt;12.5%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: District Hotspots Card (Span 3, h-[520px]) */}
        <div className="lg:col-span-3">
          <DistrictHotspots
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
            activeCause={activeCause}
          />
        </div>

        {/* Right: Vulnerable Commodities Card (Span 3, h-[560px]) */}
        <div className="lg:col-span-3">
          <CropRanking
            activeCause={activeCause}
          />
        </div>
      </div>

      {/* 5. Executive Scenario Simulation & Predictive Intelligence Hub */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>EXECUTIVE PREDICTIVE INTELLIGENCE & SCENARIO HUB</span>
            </span>
            <span className="text-[9.5px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-black/[0.04]">
              NST2 ≤5.0% TARGET • REAL-TIME BENCHMARKS
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Interactive Field Risk Forecast & Infrastructure Technology Decision Matrix
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-4 flex flex-col">
            <BentoPreHarvestSimulator selectedDistrict={selectedDistrict} />
          </div>
          <div className="lg:col-span-4 flex flex-col">
            <BentoStorageComparison />
          </div>
          <div className="lg:col-span-4 flex flex-col">
            <BentoDispatchCard selectedDistrict={selectedDistrict} />
          </div>
        </div>
      </div>

      {/* 6. Policy Mitigation Action Box Banner */}
      <PolicyActionBox
        activeCause={activeCause}
        onSelectCause={setActiveCause}
      />

      {/* Hover Tooltip Overlay (Floating Glass Card) */}
      {hoveredDistrict && (
        <TacticalTooltip
          hoveredDistrict={hoveredDistrict}
          mousePos={mousePos}
        />
      )}
    </div>
  );
}
