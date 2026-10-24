import React, { useState, useEffect } from 'react';
import DistrictChoropleth from './DistrictChoropleth';
import DistrictTooltip from './DistrictTooltip';
import DistrictHotspots from './DistrictHotspots';
import CropRanking from './CropRanking';
import PolicyActionBox from './PolicyActionBox';
import { api } from '../../api/client';
import { useOptions } from '../../context/OptionsContext';
import { RWANDA_VIEWBOX } from '../../data/rwandaDistrictPaths';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter, 
  MapPin, 
  Compass, 
  Layers, 
  Sparkles,
  Info,
  Calendar,
  Wheat,
  ShieldAlert
} from 'lucide-react';

const HUMAN_CAUSE_NAMES = {
  harvesting_damage: 'Harvesting damage',
  insects_pests: 'Insects and pests',
  stalks_fallen: 'Stalks fallen / Lodging',
  processing: 'Processing losses',
  birds_animals: 'Birds and wild animals',
  theft: 'Theft (Field & Barn)',
  transport: 'Transport losses',
  sale: 'Market and sales',
  packaging: 'Packaging damage',
  storage: 'Storage spoilage'
};

export default function SituationRoomMap({ 
  selectedCoop, 
  onSelectCoop,
  activeSeason = 'all',
  onSelectSeason,
  onNavigateToCheckLosses,
  onNavigateToPlanSeason
}) {
  const { crops } = useOptions();
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Map Data from API
  const [mapData, setMapData] = useState({
    national_reference_pct: 10.22,
    districts: [],
    districts_without_data: [],
  });
  const [nationalSummary, setNationalSummary] = useState(null);
  const [loadingMap, setLoadingMap] = useState(true);

  // Map Controls HUD
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeCause, setActiveCause] = useState('all');

  useEffect(() => {
    let isMounted = true;
    setLoadingMap(true);

    const seasonParam = activeSeason === 'all' ? null : activeSeason;
    const cropParam = selectedCrop === 'all' ? null : selectedCrop;

    Promise.all([
      api.getMap(seasonParam, cropParam).catch(() => null),
      api.getNationalSummary().catch(() => null),
    ]).then(([mRes, nRes]) => {
      if (isMounted) {
        if (mRes) {
          setMapData(mRes);
        }
        if (nRes) {
          setNationalSummary(nRes);
        }
        setLoadingMap(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeSeason, selectedCrop]);

  const districtDataMap = {};
  mapData.districts.forEach((d) => {
    districtDataMap[d.district] = d;
  });

  const handleHoverDistrict = (districtName, e, dData, isWithoutData) => {
    setHoveredDistrict({ 
      name: districtName, 
      data: dData, 
      isWithoutData, 
      nationalReference: mapData.national_reference_pct 
    });
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
    setSelectedCrop('all');
  };

  const natRef = mapData.national_reference_pct || 10.22;
  const causeBreakdown = nationalSummary?.cause_breakdown_all_crops_pct || {};

  return (
    <div className="space-y-4" onMouseMove={handleMouseMove}>
      {/* 1. Executive Context & Filter Bar */}
      <div className="bg-white/95 rounded-2xl border border-black/[0.06] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 font-mono tracking-tight uppercase">
              National Picture — Where are losses worst?
            </h2>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              NISR SAS 2024–2025
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            National average: <strong className="text-slate-800 font-mono font-bold">{natRef.toFixed(2)}%</strong> loss
            <span className="text-slate-400 mx-1.5">•</span>
            <span>≈ {Math.round(natRef)} kg lost out of every 100 kg harvested</span>
          </p>
        </div>

        {/* Filter Controls: Crop & Quick Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Crop Selector */}
          <div className="flex items-center bg-slate-50 border border-black/[0.07] rounded-xl px-3 py-1.5 text-xs font-mono">
            <Wheat className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer pr-1"
              aria-label="Filter map by crop commodity"
            >
              <option value="all">All Crops (National Average)</option>
              {crops.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {selectedCrop !== 'all' && (
            <button
              onClick={() => setSelectedCrop('all')}
              className="text-xs font-mono font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* 2. Cause Breakdown Pill Bar */}
      {Object.keys(causeBreakdown).length > 0 && (
        <div className="bg-white/90 backdrop-blur-md border border-black/[0.06] rounded-2xl p-2 px-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-emerald-600" />
            <span>NATIONAL CAUSES:</span>
          </span>
          {Object.entries(causeBreakdown).map(([causeKey, share]) => (
            <div
              key={causeKey}
              className="px-2.5 py-1 rounded-full bg-slate-50 border border-black/[0.05] text-[11px] font-mono text-slate-700 whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span className="font-medium">{HUMAN_CAUSE_NAMES[causeKey] || causeKey.replace('_', ' ')}</span>
              <span className="font-bold text-slate-900 bg-white px-1.5 py-0.2 rounded border border-black/[0.05]">
                {share}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 3. Core Spatial Layout: Cartography (Left 6), Hotspots (Mid 3), Vulnerable Crops (Right 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Rwanda Cartography Card (Span 6) */}
        <div className="lg:col-span-6 bg-white border border-black/[0.05] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between h-[560px] relative overflow-hidden">
          {/* Card Top Strip */}
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] mb-3 flex-shrink-0 z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>RWANDA DISTRICT MAP</span>
              </span>
              <span className="text-[9px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-black/[0.04]">
                30 DISTRICTS
              </span>
            </div>

            {/* Zoom Controls HUD */}
            <div className="flex items-center gap-1.5">
              <div className="flex bg-slate-100/90 border border-black/[0.04] rounded-xl p-0.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                  className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-all active:scale-95"
                  title="Zoom In"
                  aria-label="Zoom in on map"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                  className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-all active:scale-95"
                  title="Zoom Out"
                  aria-label="Zoom out on map"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetView}
                  className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-all active:scale-95"
                  title="Reset Map View"
                  aria-label="Reset map view"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Map SVG Canvas Viewport */}
          <div className="flex-1 w-full h-full relative flex items-center justify-center overflow-hidden">
            {loadingMap ? (
              <div className="text-xs font-mono text-slate-400 animate-pulse flex items-center gap-2">
                <span>Loading survey microdata map...</span>
              </div>
            ) : (
              <svg
                viewBox={RWANDA_VIEWBOX}
                className="w-full h-full max-h-[440px] transition-transform duration-300 ease-out select-none"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                }}
              >
                <DistrictChoropleth
                  selectedDistrict={selectedDistrict}
                  hoveredDistrict={hoveredDistrict}
                  districtMapData={districtDataMap}
                  districtsWithoutData={mapData.districts_without_data || []}
                  nationalReference={natRef}
                  onHoverDistrict={handleHoverDistrict}
                  onLeaveDistrict={handleLeaveDistrict}
                  onSelectDistrict={setSelectedDistrict}
                />
              </svg>
            )}
          </div>

          {/* Card Bottom: Legend */}
          <div className="pt-3 border-t border-black/[0.04] flex items-center justify-between text-[10px] font-mono text-slate-500 z-10 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-400 uppercase">Scale vs Ref ({natRef.toFixed(1)}%):</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#86EFAC]" />
                <span>&lt;80%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#FEF08A]" />
                <span>80–100%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#FED7AA]" />
                <span>100–125%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#FCA5A5]" />
                <span>&gt;125%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#E2E8F0]" />
                <span>No Data</span>
              </div>
            </div>
            <span className="text-[9.5px] text-slate-400">geoBoundaries Rwanda Districts</span>
          </div>
        </div>

        {/* Middle: Where Losses Are Highest (Span 3, h-[560px]) */}
        <div className="lg:col-span-3">
          <DistrictHotspots
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
            districts={mapData.districts}
            nationalReference={natRef}
          />
        </div>

        {/* Right: Vulnerable Commodities (Span 3, h-[560px]) */}
        <div className="lg:col-span-3">
          <CropRanking
            activeCause={activeCause}
          />
        </div>
      </div>

      {/* 4. Policy Mitigation Alignment Box */}
      <PolicyActionBox
        onNavigateToCheckLosses={onNavigateToCheckLosses}
        onNavigateToPlanSeason={onNavigateToPlanSeason}
      />

      {/* Hover Tooltip Overlay */}
      {hoveredDistrict && (
        <DistrictTooltip
          hoveredDistrict={hoveredDistrict}
          mousePos={mousePos}
        />
      )}
    </div>
  );
}
