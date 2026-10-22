import React from 'react';
import { PRESEEDED_COOPERATIVES } from '../../data/cooperativeLocations';

export default function CoopNodesLayer({ 
  selectedCoop, 
  onSelectCoop, 
  isCoopsLayerActive,
  isPestsLayerActive,
  isStorageLayerActive,
  isTransitLayerActive 
}) {
  if (!isCoopsLayerActive && !isPestsLayerActive && !isStorageLayerActive && !isTransitLayerActive) {
    return null;
  }

  return (
    <g className="coop-nodes-layer pointer-events-auto">
      {/* High-risk Transit Corridors Dotted Lines (if transit layer active) */}
      {isTransitLayerActive && (
        <g className="transit-lines stroke-emerald-700 stroke-[2.5] stroke-dasharray-[5,5] fill-none opacity-80">
          {/* Mountainous feeder corridors: Nyabihu -> Musanze -> Kigali */}
          <path d="M 150,180 Q 180,160 200,150 T 310,270" />
          {/* Western corridor: Rutsiro -> Karongi -> Rusizi */}
          <path d="M 130,220 Q 140,280 80,450" />
        </g>
      )}

      {/* Cooperative Hub Markers */}
      {isCoopsLayerActive && PRESEEDED_COOPERATIVES.map((coop) => {
        const [cx, cy] = coop.coordinates;
        const isSelected = selectedCoop?.id === coop.id;
        const nodeColor = 
          coop.riskCategory === 'Low' ? '#15803D' :
          coop.riskCategory === 'Medium' ? '#D97706' : '#DC2626';

        return (
          <g 
            key={coop.id} 
            className="cursor-pointer group"
            onClick={() => onSelectCoop(coop)}
          >
            {/* Outer radar ping ring */}
            <circle
              cx={cx}
              cy={cy}
              r={isSelected ? 18 : 12}
              fill={nodeColor}
              fillOpacity={0.25}
              className="radar-pulse pointer-events-none"
            />

            {/* Core node dot with white outline and drop shadow */}
            <circle
              cx={cx}
              cy={cy}
              r={isSelected ? 7.5 : 5.5}
              fill={nodeColor}
              stroke="#FFFFFF"
              strokeWidth={2}
              className="transition-transform duration-150 group-hover:scale-125 shadow-md"
            />

            {/* Tactical label on hover / selection */}
            <g className={`transition-opacity duration-150 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <rect
                x={cx + 10}
                y={cy - 12}
                width={coop.name.length * 5.6 + 18}
                height={22}
                rx={5}
                fill="#FFFFFF"
                stroke={nodeColor}
                strokeWidth={1.5}
                className="shadow-md"
              />
              <text
                x={cx + 18}
                y={cy + 3}
                fill="#0F172A"
                className="text-[9.5px] font-mono font-bold"
              >
                {coop.name.split(' - ')[0]} ({coop.lossRatePct}%)
              </text>
            </g>
          </g>
        );
      })}

      {/* Storage Deficit Alerts Layer */}
      {isStorageLayerActive && (
        <g className="storage-deficits">
          {[
            { name: "Ngororero Depot", coords: [170, 240], note: "High Humidity" },
            { name: "Rutsiro Platform", coords: [130, 220], note: "No Raised Slabs" },
            { name: "Muhanga Crib", coords: [240, 300], note: "Rot Risk in Tuber Stores" }
          ].map((item, idx) => (
            <g key={idx} transform={`translate(${item.coords[0]}, ${item.coords[1]})`}>
              <polygon points="0,-8 7,6 -7,6" fill="#9333EA" stroke="#FFFFFF" strokeWidth={1.5} />
              <text 
                x={10} 
                y={4} 
                fill="#581C87" 
                className="text-[8.5px] font-mono font-bold"
                style={{ paintOrder: 'stroke fill', stroke: '#FFFFFF', strokeWidth: '2px' }}
              >
                {item.name}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* Pest Infestation Warning Layer */}
      {isPestsLayerActive && (
        <g className="pest-zones">
          {[
            { coords: [460, 190], name: "Gatsibo Weevil Zone" },
            { coords: [490, 340], name: "Ngoma Maize Borer Alert" }
          ].map((zone, idx) => (
            <g key={idx} transform={`translate(${zone.coords[0]}, ${zone.coords[1]})`}>
              <circle r={22} fill="#EF4444" fillOpacity={0.12} stroke="#DC2626" strokeWidth={1.5} strokeDasharray="4,4" />
              <text 
                x={0} 
                y={-26} 
                textAnchor="middle" 
                fill="#991B1B" 
                className="text-[8.5px] font-mono font-extrabold"
                style={{ paintOrder: 'stroke fill', stroke: '#FFFFFF', strokeWidth: '2px' }}
              >
                ⚠️ {zone.name}
              </text>
            </g>
          ))}
        </g>
      )}
    </g>
  );
}
