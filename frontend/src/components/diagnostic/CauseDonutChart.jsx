import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const CAUSE_COLORS = {
  insects_pests: '#DC2626',
  theft: '#EA580C',
  stalks_fallen: '#D97706',
  birds_animals: '#65A30D',
  harvesting_damage: '#059669',
  processing: '#0891B2',
  storage: '#7C3AED',
  transport: '#DB2777',
  packaging: '#475569',
  sale: '#2563EB',
};

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
    .map(([cause, val]) => ({
      name: cause.replace('_', ' '),
      key: cause,
      value: Number(val),
    }))
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
                  fill={CAUSE_COLORS[entry.key] || '#94A3B8'} 
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
                      <span className="capitalize font-bold text-slate-800">{d.name}</span>: <strong className="text-emerald-700">{d.value}%</strong> of loss
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
            <span className="text-[9.5px] font-sans capitalize font-bold text-slate-600 block truncate max-w-[90px]">
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
                style={{ backgroundColor: CAUSE_COLORS[item.key] || '#94A3B8' }}
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
