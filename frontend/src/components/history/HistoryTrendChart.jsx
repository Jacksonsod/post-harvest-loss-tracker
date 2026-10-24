import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  ReferenceArea,
  ReferenceLine
} from 'recharts';
import { TrendingDown, Award, AlertTriangle, Layers, DollarSign, Activity } from 'lucide-react';

export default function HistoryTrendChart({ assessments = [] }) {
  const [chartMode, setChartMode] = useState('loss_rate'); // 'loss_rate' | 'financial_rwf' | 'volume_kg'

  if (!assessments || assessments.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-mono">
        No multi-season records found for this cooperative. Submit an assessment to begin trajectory tracking.
      </div>
    );
  }

  // Format data for chart chronologically
  const chartData = assessments.map((a, idx) => {
    const harvested = a.harvested_qty_kg || 0;
    const loss = a.total_loss_kg || 0;
    const retained = Math.max(0, harvested - loss);

    return {
      label: a.season ? `Season ${a.season}` : `Harvest #${idx + 1}`,
      lossRate: Number((a.loss_rate_pct || 0).toFixed(1)),
      benchmark: Number((a.benchmark_used_pct || 11.5).toFixed(1)),
      nst2Target: 10.0,
      crop: a.crop || 'Crop',
      lossRwf: a.estimated_loss_value_rwf || 0,
      lossRwfMillion: Number(((a.estimated_loss_value_rwf || 0) / 1000000).toFixed(2)),
      harvestedKg: harvested,
      lossKg: loss,
      retainedKg: retained,
      harvestedTons: Number((harvested / 1000).toFixed(1)),
      lossTons: Number((loss / 1000).toFixed(1)),
      retainedTons: Number((retained / 1000).toFixed(1)),
      risk: a.risk_category || 'Medium',
    };
  });

  // Calculate best & worst seasons
  const sortedByLoss = [...chartData].sort((a, b) => a.lossRate - b.lossRate);
  const bestSeason = sortedByLoss[0];
  const worstSeason = sortedByLoss[sortedByLoss.length - 1];

  return (
    <div className="space-y-4">
      {/* Sub-header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/60 inline-block" />
          <span className="text-slate-500 text-[10.5px]">Shaded Corridor: NST2 Safe Zone (&le;10%)</span>
          <span className="text-slate-300">•</span>
          <span className="text-emerald-700 text-[10.5px] font-semibold">NST2 Ideal Target: &le;5.0%</span>
        </div>

        {/* Chart View Toggle Pill */}
        <div className="inline-flex items-center bg-slate-100 p-1 rounded-full border border-black/[0.04] text-[10.5px] font-mono self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartMode('loss_rate')}
            className={`px-3 py-1 rounded-full font-semibold transition-all duration-150 cursor-pointer ${
              chartMode === 'loss_rate'
                ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            % Loss Trajectory
          </button>
          <button
            type="button"
            onClick={() => setChartMode('financial_rwf')}
            className={`px-3 py-1 rounded-full font-semibold transition-all duration-150 cursor-pointer ${
              chartMode === 'financial_rwf'
                ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Revenue Forfeited (RWF)
          </button>
          <button
            type="button"
            onClick={() => setChartMode('volume_kg')}
            className={`px-3 py-1 rounded-full font-semibold transition-all duration-150 cursor-pointer ${
              chartMode === 'volume_kg'
                ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Harvest vs. Loss (Tons)
          </button>
        </div>
      </div>

      {/* Season Extremes Annotation Badges */}
      {chartData.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
          {bestSeason && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800">
              <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Best Track: <strong>{bestSeason.label}</strong> ({bestSeason.lossRate}% loss)</span>
            </div>
          )}
          {worstSeason && worstSeason !== bestSeason && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-800">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Peak Risk: <strong>{worstSeason.label}</strong> ({worstSeason.lossRate}% loss)</span>
            </div>
          )}
        </div>
      )}

      {/* Chart Canvas */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'loss_rate' ? (
            <LineChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#94A3B8" 
                fontSize={11} 
                fontFamily="ui-monospace, monospace"
                tickLine={false}
              />
              <YAxis 
                stroke="#94A3B8" 
                fontSize={11} 
                fontFamily="ui-monospace, monospace"
                unit="%"
                tickLine={false}
                axisLine={false}
                domain={[0, 'dataMax + 4']}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 border border-black/[0.08] p-3 rounded-2xl text-xs font-mono shadow-xl backdrop-blur-md space-y-1">
                        <span className="font-extrabold text-slate-900 block">{label} • {data.crop}</span>
                        <div className="text-emerald-700 font-bold flex justify-between gap-4">
                          <span>Actual Loss:</span>
                          <strong>{data.lossRate}%</strong>
                        </div>
                        <div className="text-amber-700 font-medium flex justify-between gap-4">
                          <span>Benchmark:</span>
                          <strong>{data.benchmark}%</strong>
                        </div>
                        <div className="text-slate-500 text-[10px] pt-1 border-t border-black/[0.05] flex justify-between gap-4">
                          <span>Revenue Depletion:</span>
                          <strong className="text-slate-900">~{data.lossRwfMillion}M RWF</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', paddingTop: '8px' }} 
              />
              {/* Shaded NST2 Target Corridor */}
              <ReferenceArea y1={0} y2={10} fill="#10B981" fillOpacity={0.08} />
              <ReferenceLine 
                y={10} 
                stroke="#059669" 
                strokeDasharray="4 4" 
                strokeWidth={1.5}
                label={{ value: 'NST2 Cap (10%)', position: 'insideTopLeft', fill: '#059669', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }} 
              />
              <ReferenceLine 
                y={5} 
                stroke="#10B981" 
                strokeDasharray="2 2" 
                strokeWidth={1}
                label={{ value: 'NST2 Target (5%)', position: 'insideBottomLeft', fill: '#10B981', fontSize: 9.5, fontFamily: 'monospace' }} 
              />
              <Line
                type="monotone"
                dataKey="lossRate"
                name="Cooperative Loss Rate (%)"
                stroke="#059669"
                strokeWidth={3}
                dot={{ r: 5, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 2 }}
                activeDot={{ r: 8, stroke: '#0F172A', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="benchmark"
                name="District Reference Benchmark (%)"
                stroke="#D97706"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#D97706' }}
              />
            </LineChart>
          ) : chartMode === 'financial_rwf' ? (
            <BarChart data={chartData} margin={{ top: 15, right: 20, left: -5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#94A3B8" 
                fontSize={11} 
                fontFamily="ui-monospace, monospace"
                tickLine={false}
              />
              <YAxis 
                stroke="#94A3B8" 
                fontSize={11} 
                fontFamily="ui-monospace, monospace"
                unit="M"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 border border-black/[0.08] p-3 rounded-2xl text-xs font-mono shadow-xl backdrop-blur-md space-y-1">
                        <span className="font-extrabold text-slate-900 block">{label} • {data.crop}</span>
                        <div className="text-amber-800 font-bold flex justify-between gap-4">
                          <span>Financial Forfeited:</span>
                          <strong>{Math.round(data.lossRwf).toLocaleString()} RWF</strong>
                        </div>
                        <div className="text-slate-500 text-[10.5px]">
                          Crop Volume Loss Rate: {data.lossRate}%
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', paddingTop: '8px' }} 
              />
              <Bar 
                dataKey="lossRwfMillion" 
                name="Revenue Forfeited (Million RWF)" 
                fill="#F59E0B" 
                radius={[8, 8, 0, 0]} 
              />
            </BarChart>
          ) : (
            /* volume_kg: Stacked Harvested vs Lost (in Tons) */
            <BarChart data={chartData} margin={{ top: 15, right: 20, left: -5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#94A3B8" 
                fontSize={11} 
                fontFamily="ui-monospace, monospace"
                tickLine={false}
              />
              <YAxis 
                stroke="#94A3B8" 
                fontSize={11} 
                fontFamily="ui-monospace, monospace"
                unit="t"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 border border-black/[0.08] p-3 rounded-2xl text-xs font-mono shadow-xl backdrop-blur-md space-y-1">
                        <span className="font-extrabold text-slate-900 block">{label} • {data.crop}</span>
                        <div className="text-emerald-700 font-bold flex justify-between gap-4">
                          <span>Retained Marketable Yield:</span>
                          <strong>{data.retainedTons} tons</strong>
                        </div>
                        <div className="text-rose-700 font-bold flex justify-between gap-4">
                          <span>Depleted Post-Harvest Loss:</span>
                          <strong>{data.lossTons} tons ({data.lossRate}%)</strong>
                        </div>
                        <div className="text-slate-500 text-[10px] pt-1 border-t border-black/[0.05] flex justify-between gap-4">
                          <span>Total Gross Harvest:</span>
                          <strong className="text-slate-900">{data.harvestedTons} tons</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', paddingTop: '8px' }} 
              />
              <Bar 
                dataKey="retainedTons" 
                name="Retained Volume (Tons)" 
                stackId="a" 
                fill="#10B981" 
              />
              <Bar 
                dataKey="lossTons" 
                name="Loss Depletion (Tons)" 
                stackId="a" 
                fill="#F43F5E" 
                radius={[6, 6, 0, 0]} 
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
