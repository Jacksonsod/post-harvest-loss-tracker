import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CAUSE_LABELS } from '../../data/staticData';

export default function CauseDonutChart({ breakdownPct, isEstimated = false }) {
  if (!breakdownPct || Object.keys(breakdownPct).length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-slate-400 font-mono">
        No cause itemization provided.
      </div>
    );
  }

  const data = Object.entries(breakdownPct)
    .filter(([_, val]) => val > 0)
    .map(([cause, val]) => {
      const meta = CAUSE_LABELS[cause];
      return {
        name: meta?.shortName || meta?.name || cause.replace('_', ' '),
        fullName: meta?.name || cause.replace('_', ' '),
        key: cause,
        value: Number(val),
        hex: meta?.hex || '#94A3B8',
      };
    })
    .sort((a, b) => b.value - a.value);

  const topCause = data[0];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="font-mono text-slate-900 font-bold uppercase text-[11px] tracking-wider">
          CAUSE-OF-LOSS DISTRIBUTION
        </span>
        {isEstimated && (
          <span className="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            Estimated from Baseline
          </span>
        )}
      </div>

      <div className="relative h-56 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={82}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell 
                  key={`cell-${entry.key}`} 
                  fill={entry.hex} 
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white/95 border border-black/[0.08] p-2.5 rounded-xl text-xs font-mono text-slate-900 shadow-xl backdrop-blur-md">
                      <span className="capitalize font-bold text-slate-800">{d.fullName}</span>: <strong className="text-emerald-700">{d.value}%</strong> of loss
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center-Hole Dominant Cause Callout */}
        {topCause && (
          <div className="absolute pointer-events-none text-center">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
              TOP DRIVER
            </span>
            <span className="text-base font-mono font-black text-slate-900 block tnum">
              {topCause.value}%
            </span>
            <span 
              className="text-[9.5px] font-sans capitalize font-bold block truncate max-w-[90px]"
              style={{ color: topCause.hex }}
            >
              {topCause.name}
            </span>
          </div>
        )}
      </div>

      {/* Cause breakdown legend items */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 text-[11px] font-mono">
        {data.slice(0, 6).map((item) => (
          <div key={item.key} className="flex items-center justify-between p-1 px-1.5 rounded-lg bg-slate-50/70 border border-black/[0.03]">
            <div className="flex items-center gap-1.5 truncate">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.hex }}
              />
              <span className="capitalize text-slate-700 truncate text-[10.5px]">{item.name}</span>
            </div>
            <span className="text-slate-900 font-black ml-1 tnum text-[10.5px]">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
