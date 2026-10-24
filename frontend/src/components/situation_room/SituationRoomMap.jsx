import React, { useState, useEffect } from 'react';
import DistrictChoropleth from './DistrictChoropleth';
import DistrictTooltip from './DistrictTooltip';
import DistrictHotspots from './DistrictHotspots';
import CropRanking from './CropRanking';
import PolicyActionBox from './PolicyActionBox';
import { api } from '../../api/client';
import { useOptions } from '../../context/OptionsContext';
import { RWANDA_VIEWBOX } from '../../data/rwandaDistrictPaths';
import { CAUSE_LABELS } from '../../data/staticData';
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
  ShieldAlert,
  Scissors,
  Bug,
  TrendingDown,
  Bird,
  Cog,
  Truck,
  Warehouse,
  Package,
  ShoppingBag,
  X
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
  const [cropCauseBreakdown, setCropCauseBreakdown] = useState(null);
  const [loadingMap, setLoadingMap] = useState(true);

  // Map Controls HUD
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeCause, setActiveCause] = useState('all');

  useEffect(() => {
    let isMounted = true;
    setLoadingMap(true);

    const seasonParam = activeSeason === 'all' ? null : activeSeason;
    const cropParam = selectedCrop === 'all' ? null : selectedCrop;

    const fetches = [
      api.getMap(seasonParam, cropParam).catch(() => null),
      api.getNationalSummary().catch(() => null),
    ];

    if (cropParam) {
      fetches.push(api.getBenchmark('Gasabo', cropParam, seasonParam).catch(() => null));
    }

    Promise.all(fetches).then(([mRes, nRes, bRes]) => {
      if (isMounted) {
        if (mRes) {
          setMapData(mRes);
        }
        if (nRes) {
          setNationalSummary(nRes);
        }
        if (cropParam && bRes?.cause_of_loss_breakdown_pct) {
          setCropCauseBreakdown(bRes.cause_of_loss_breakdown_pct);
        } else {
          setCropCauseBreakdown(null);
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
    setActiveCause('all');
  };

  const natRef = mapData.national_reference_pct || 10.22;

  // Compute active cause breakdown: crop-specific if crop is selected, otherwise national aggregate
  const activeBreakdown = (selectedCrop !== 'all' && cropCauseBreakdown)
    ? cropCauseBreakdown
    : (nationalSummary?.cause_breakdown_all_crops_pct || {});

  // Sort causes descending (big to low)
  const sortedCauses = Object.entries(activeBreakdown)
    .sort((a, b) => b[1] - a[1]);

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
            {activeSeason !== 'all' && (
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-900 border border-cyan-200">
                Season {activeSeason} Active
              </span>
            )}
            {selectedCrop !== 'all' && (
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                {selectedCrop} Filter Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedCrop === 'all' ? 'National average: ' : `${selectedCrop} benchmark: `}
            <strong className="text-slate-800 font-mono font-bold">{natRef.toFixed(2)}%</strong> loss
            <span className="text-slate-400 mx-1.5">•</span>
            <span>≈ {Math.round(natRef)} kg lost out of every 100 kg harvested</span>
          </p>
        </div>

        {/* Filter Controls: Season, Crop & Quick Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Season Selector */}
          <div className="flex items-center bg-slate-50 border border-black/[0.07] rounded-xl px-3 py-1.5 text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
            <select
              value={activeSeason}
              onChange={(e) => {
                if (onSelectSeason) onSelectSeason(e.target.value);
              }}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer pr-1"
              aria-label="Filter map by agricultural season"
            >
              <option value="all">All Seasons (Combined)</option>
              <option value="A">Season A (Cereal Harvest)</option>
              <option value="B">Season B (Legumes & Tubers)</option>
              <option value="C">Season C (Marshland Crops)</option>
            </select>
          </div>

          {/* Crop Selector */}
          <div className="flex items-center bg-slate-50 border border-black/[0.07] rounded-xl px-3 py-1.5 text-xs font-mono">
            <Wheat className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
            <select
              value={selectedCrop}
              onChange={(e) => {
                setSelectedCrop(e.target.value);
              }}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer pr-1"
              aria-label="Filter map by crop commodity"
            >
              <option value="all">All Crops (National Average)</option>
              {crops.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {(selectedCrop !== 'all' || activeSeason !== 'all' || activeCause !== 'all') && (
            <button
              onClick={() => {
                setSelectedCrop('all');
                if (onSelectSeason) onSelectSeason('all');
                setActiveCause('all');
              }}
              className="text-xs font-mono font-bold text-rose-600 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Cause Breakdown Bar - Sorted Big to Low with Distinct Semantic Colors */}
      {sortedCauses.length > 0 && (
        <div className="space-y-2">
          <div className="relative group">
            <div className="bg-white/95 backdrop-blur-md border border-black/[0.06] rounded-2xl p-2 px-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-2xs scroll-smooth">
              {/* Context Label */}
              <div className="flex items-center gap-1.5 shrink-0 mr-1 font-mono">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {selectedCrop === 'all' ? 'NATIONAL CAUSES:' : `${selectedCrop.toUpperCase()} CAUSES:`}
                </span>
              </div>

              {/* "All Causes" Reset Pill - Crisp Ceramic White */}
              <button
                type="button"
                onClick={() => setActiveCause('all')}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold whitespace-nowrap shrink-0 transition-all duration-200 flex items-center gap-1.5 border cursor-pointer ${
                  activeCause === 'all'
                    ? 'bg-white text-slate-900 border-slate-300 shadow-2xs ring-2 ring-emerald-500/25 scale-[1.02]'
                    : 'bg-slate-50/90 text-slate-600 hover:bg-white hover:text-slate-900 border-black/[0.05]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeCause === 'all' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                <span>All Causes</span>
              </button>

              {/* Individual Cause Pills (Sorted Big-to-Low) */}
              {sortedCauses.map(([causeKey, share]) => {
                const meta = CAUSE_LABELS[causeKey] || {
                  name: causeKey.replace('_', ' '),
                  shortName: causeKey,
                  icon: 'Bug',
                  hex: '#64748B',
                  bgLight: 'bg-slate-50',
                  borderLight: 'border-slate-200',
                  textLight: 'text-slate-800',
                  bgActive: 'bg-slate-800 text-white',
                  badgeLight: 'bg-white text-slate-800',
                  badgeActive: 'bg-white/20 text-white'
                };
                const IconComp = CAUSE_ICONS[meta.icon] || Bug;
                const isSelected = activeCause === causeKey;

                return (
                  <button
                    key={causeKey}
                    type="button"
                    onClick={() => setActiveCause(isSelected ? 'all' : causeKey)}
                    className={`px-2.5 py-1 rounded-full text-[10.5px] font-mono whitespace-nowrap shrink-0 transition-all duration-200 flex items-center gap-1.5 border cursor-pointer ${
                      isSelected
                        ? `${meta.bgActive} font-bold scale-[1.03] shadow-sm z-10`
                        : `${meta.bgLight} ${meta.borderLight} ${meta.textLight} ${meta.pillHover} hover:-translate-y-0.5 shadow-2xs font-semibold`
                    }`}
                    title={`${meta.name}: ${share}% of losses. Click to filter.`}
                  >
                    <IconComp 
                      className="w-3.5 h-3.5 shrink-0" 
                      style={!isSelected ? { color: meta.hex } : undefined} 
                    />
                    <span>{meta.shortName || meta.name}</span>
                    <span
                      className={`font-mono font-black text-[9.5px] px-1.5 py-0.2 rounded-full border ${
                        isSelected
                          ? meta.badgeActive
                          : meta.badgeLight
                      }`}
                    >
                      {share}%
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Subtle gradient scroll hint on right edge for horizontal overflow */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/90 to-transparent rounded-r-2xl hidden sm:block" />
          </div>

          {/* Active Cause Filter Context Indicator - Refined Light Ceramic Card */}
          {activeCause !== 'all' && (
            <div 
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-mono border shadow-2xs animate-in fade-in slide-in-from-top-1 duration-150"
              style={{
                backgroundColor: `${CAUSE_LABELS[activeCause]?.hex || '#10B981'}0d`,
                borderColor: `${CAUSE_LABELS[activeCause]?.hex || '#10B981'}33`,
              }}
            >
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: CAUSE_LABELS[activeCause]?.hex || '#10B981' }}
                />
                <span className="text-slate-900">
                  Active Cause Filter: <strong className="font-bold text-slate-950">{CAUSE_LABELS[activeCause]?.name}</strong>
                  {activeBreakdown[activeCause] !== undefined && (
                    <span className="text-slate-600 ml-1.5 font-medium">
                      ({activeBreakdown[activeCause]}% of {selectedCrop === 'all' ? 'national' : selectedCrop} losses)
                    </span>
                  )}
                </span>
                <span className="text-slate-500 text-[11px] hidden sm:inline">
                  • Highlighting commodities & hotspots driven by this cause
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveCause('all')}
                className="text-[11px] font-bold text-slate-700 hover:text-slate-950 bg-white/90 hover:bg-white border border-slate-200/90 hover:border-slate-300 px-2.5 py-1 rounded-lg ml-3 flex items-center gap-1.5 shrink-0 transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                <X className="w-3 h-3 text-slate-500" />
                <span>Clear filter</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Core Spatial Layout: Cartography (Left 12/6), Hotspots (Mid 6/3), Vulnerable Crops (Right 6/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Rwanda Cartography Card (Span 12 on laptop, Span 6 on 2K/Wide) */}
        <div className="lg:col-span-12 xl:col-span-6 bg-white border border-black/[0.05] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between h-[480px] sm:h-[520px] xl:h-[560px] relative overflow-hidden">
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
              {activeCause !== 'all' && (
                <span 
                  className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold text-white shadow-2xs"
                  style={{ backgroundColor: CAUSE_LABELS[activeCause]?.hex || '#475569' }}
                >
                  {CAUSE_LABELS[activeCause]?.shortName}
                </span>
              )}
            </div>

            {/* Zoom Controls HUD */}
            <div className="flex items-center gap-1.5">
              <div className="flex bg-slate-100/90 border border-black/[0.04] rounded-xl p-0.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                  className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-all active:scale-95 cursor-pointer"
                  title="Zoom In"
                  aria-label="Zoom in on map"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                  className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-all active:scale-95 cursor-pointer"
                  title="Zoom Out"
                  aria-label="Zoom out on map"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetView}
                  className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-all active:scale-95 cursor-pointer"
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

        {/* Middle: Where Losses Are Highest (Span 6 on laptop, Span 3 on 2K/Wide) */}
        <div className="lg:col-span-6 xl:col-span-3">
          <DistrictHotspots
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
            districts={mapData.districts}
            nationalReference={natRef}
            activeCause={activeCause}
          />
        </div>

        {/* Right: Vulnerable Commodities (Span 6 on laptop, Span 3 on 2K/Wide) */}
        <div className="lg:col-span-6 xl:col-span-3">
          <CropRanking
            activeCause={activeCause}
            selectedCrop={selectedCrop}
            onSelectCrop={setSelectedCrop}
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
