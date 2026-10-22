import React from 'react';
import { RWANDA_DISTRICT_PATHS } from '../../data/rwandaDistrictPaths';
import { DISTRICT_LOSS_RATES, DISTRICT_CAUSE_INTENSITY } from '../../data/nationalMetrics';

export function getDistrictFillColor(district, activeCause, isHotspotsLayerActive) {
  if (!isHotspotsLayerActive) {
    return '#F1F5F9'; // Light neutral slate
  }

  const overallRate = DISTRICT_LOSS_RATES[district] || 11.5;

  if (activeCause && activeCause !== 'all') {
    // Shading based on specific cause intensity in that district
    const causeShare = DISTRICT_CAUSE_INTENSITY[district]?.[activeCause] || 0;
    if (causeShare > 30) return '#FECACA'; // Light Red (Soft alert)
    if (causeShare > 15) return '#FED7AA'; // Light Orange
    if (causeShare > 5)  return '#FEF08A'; // Light Amber
    if (causeShare > 1)  return '#DCFCE7'; // Light Emerald
    return '#F8FAFC';
  }

  // National Atlas style pastel choropleth ramp
  if (overallRate >= 13.5) return '#FECACA'; // Critical hotspot (>13.5%)
  if (overallRate >= 12.0) return '#FED7AA'; // Elevated (12.0 - 13.5%)
  if (overallRate >= 10.5) return '#FEF08A'; // Baseline (10.5 - 12.0%)
  if (overallRate >= 9.0)  return '#DCFCE7'; // Mild (9.0 - 10.5%)
  return '#BBF7D0'; // Optimal (<9.0%)
}

export default function DistrictChoropleth({
  selectedDistrict,
  hoveredDistrict,
  activeCause,
  isHotspotsLayerActive,
  onHoverDistrict,
  onLeaveDistrict,
  onSelectDistrict
}) {
  return (
    <g className="districts-layer">
      {Object.entries(RWANDA_DISTRICT_PATHS).map(([name, data]) => {
        const isSelected = selectedDistrict === name;
        const isHovered = hoveredDistrict?.name === name;
        const fillColor = getDistrictFillColor(name, activeCause, isHotspotsLayerActive);

        return (
          <g key={name} className="district-group">
            <path
              d={data.path}
              fill={fillColor}
              fillOpacity={isSelected ? 1 : isHovered ? 0.95 : 0.88}
              stroke={isSelected ? '#0284C7' : isHovered ? '#0F172A' : '#94A3B8'}
              strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.2}
              strokeLinejoin="round"
              className="cursor-pointer transition-all duration-150 hover:brightness-105"
              onMouseEnter={(e) => onHoverDistrict(name, e)}
              onMouseLeave={onLeaveDistrict}
              onClick={() => onSelectDistrict(name === selectedDistrict ? null : name)}
            />
            {/* District Centroid Label with white halo for maximum contrast */}
            <text
              x={data.center[0]}
              y={data.center[1]}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`pointer-events-none text-[8.5px] font-mono tracking-tighter select-none font-bold ${
                isSelected 
                  ? 'fill-cyan-950 font-extrabold text-[10.5px]' 
                  : isHovered 
                    ? 'fill-slate-950 font-extrabold' 
                    : 'fill-slate-800'
              }`}
              style={{
                paintOrder: 'stroke fill',
                stroke: '#FFFFFF',
                strokeWidth: '2.5px',
                strokeLinejoin: 'round'
              }}
            >
              {name}
            </text>
          </g>
        );
      })}
    </g>
  );
}
