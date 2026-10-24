import React from 'react';
import { RWANDA_DISTRICT_PATHS } from '../../data/rwandaDistrictPaths';

export function getDistrictFillColor(district, districtMapData = {}, districtsWithoutData = [], nationalReference = 10.22) {
  // If no survey data available for this filter combination
  if (districtsWithoutData.includes(district)) {
    return '#E2E8F0'; // Neutral grey (not enough data)
  }

  const dData = districtMapData[district];
  if (!dData || dData.avg_loss_rate_pct === undefined) {
    return '#E2E8F0';
  }

  const rate = dData.avg_loss_rate_pct;
  const ref = nationalReference || 10.22;

  // Relative to national benchmark reference
  if (rate >= ref * 1.25) return '#FCA5A5'; // Critical (> 125% of reference)
  if (rate >= ref)        return '#FED7AA'; // Elevated (100% - 125% of reference)
  if (rate >= ref * 0.8)  return '#FEF08A'; // Normal Baseline (80% - 100%)
  return '#86EFAC'; // Low loss (< 80% of reference)
}

export default function DistrictChoropleth({
  selectedDistrict,
  hoveredDistrict,
  districtMapData = {},
  districtsWithoutData = [],
  nationalReference = 10.22,
  onHoverDistrict,
  onLeaveDistrict,
  onSelectDistrict
}) {
  return (
    <g className="districts-layer">
      {Object.entries(RWANDA_DISTRICT_PATHS).map(([name, data]) => {
        const isSelected = selectedDistrict === name;
        const isHovered = hoveredDistrict?.name === name;
        const isWithoutData = districtsWithoutData.includes(name);
        const dData = districtMapData[name];
        const fillColor = getDistrictFillColor(name, districtMapData, districtsWithoutData, nationalReference);

        return (
          <g key={name} className="district-group">
            <path
              d={data.path}
              fill={fillColor}
              fillOpacity={isSelected ? 1 : isHovered ? 0.95 : 0.88}
              stroke={isSelected ? '#0F172A' : isHovered ? '#0F172A' : '#94A3B8'}
              strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.2}
              strokeLinejoin="round"
              className="cursor-pointer transition-all duration-150 hover:brightness-105"
              onMouseEnter={(e) => onHoverDistrict(name, e, dData, isWithoutData)}
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
                  ? 'fill-slate-950 font-extrabold text-[10.5px]' 
                  : isHovered 
                    ? 'fill-slate-950 font-extrabold' 
                    : 'fill-slate-700'
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
