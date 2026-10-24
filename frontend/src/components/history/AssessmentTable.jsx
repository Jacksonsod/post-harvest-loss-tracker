import React, { useState } from 'react';
import { 
  Eye, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Download, 
  FileText, 
  Filter, 
  CheckCircle2, 
  Search,
  Inbox
} from 'lucide-react';

export default function AssessmentTable({ assessments = [], onViewDetails, onViewReport }) {
  const [seasonFilter, setSeasonFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const onReportClick = onViewReport || onViewDetails;

  const filteredAssessments = assessments.filter((a) => {
    const matchesSeason = seasonFilter === 'all' || a.season === seasonFilter;
    const matchesSearch = !searchQuery || 
      (a.crop && a.crop.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.dominant_cause && a.dominant_cause.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSeason && matchesSearch;
  });

  const handleExportCsv = () => {
    if (!filteredAssessments.length) return;
    const headers = [
      'Date', 
      'Season', 
      'Crop', 
      'Harvested_kg', 
      'Total_Loss_kg', 
      'Loss_Rate_pct', 
      'Benchmark_pct', 
      'Risk_Category', 
      'Dominant_Cause', 
      'Estimated_Loss_RWF'
    ];
    const rows = filteredAssessments.map(a => [
      a.created_at ? new Date(a.created_at).toISOString().split('T')[0] : 'Recent',
      a.season ? `Season ${a.season}` : '',
      `"${a.crop || ''}"`,
      a.harvested_qty_kg || 0,
      a.total_loss_kg || 0,
      a.loss_rate_pct || 0,
      a.benchmark_used_pct || '',
      a.risk_category || '',
      `"${a.dominant_cause || ''}"`,
      a.estimated_loss_value_rwf || 0
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nisr_coop_harvest_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!assessments || assessments.length === 0) {
    return (
      <div className="bg-white/95 rounded-[24px] border border-black/[0.06] p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-black/[0.05] flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 font-mono">No Harvest Assessments Recorded Yet</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
          This cooperative does not have historical records in the database. Use the "Check losses" tab to record your first verified post-harvest survey.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/95 rounded-[24px] border border-black/[0.06] shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-black/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <span>SEASON:</span>
          </span>
          {['all', 'A', 'B', 'C'].map((s) => (
            <button
              key={s}
              onClick={() => setSeasonFilter(s)}
              className={`px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold transition-all ${
                seasonFilter === s
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-black/[0.06] hover:bg-slate-100'
              }`}
            >
              {s === 'all' ? 'All Seasons' : `Season ${s}`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search crop or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 pl-8 text-xs font-mono bg-white border border-black/[0.06] rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 w-44 sm:w-52 shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          </div>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-slate-700 bg-white hover:bg-slate-100 border border-black/[0.06] transition-all active:scale-95 shadow-2xs"
            title="Download records as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-50/80 text-slate-500 border-b border-black/[0.05] uppercase text-[10px] tracking-wider select-none">
            <tr>
              <th className="py-3 px-4 font-bold">Survey Date</th>
              <th className="py-3 px-3 font-bold">Season</th>
              <th className="py-3 px-3 font-bold">Commodity</th>
              <th className="py-3 px-3 text-right font-bold">Harvested</th>
              <th className="py-3 px-3 text-right font-bold">Loss (kg)</th>
              <th className="py-3 px-3 text-right font-bold">Loss %</th>
              <th className="py-3 px-3 text-right font-bold">Benchmark</th>
              <th className="py-3 px-3 text-center font-bold">Risk Tier</th>
              <th className="py-3 px-3 font-bold">Leading Driver</th>
              <th className="py-3 px-3 text-right font-bold">Forfeited RWF</th>
              <th className="py-3 px-4 text-center font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04] bg-white">
            {filteredAssessments.length === 0 ? (
              <tr>
                <td colSpan="11" className="py-8 text-center text-xs font-mono text-slate-400">
                  No records match your season or query filter.
                </td>
              </tr>
            ) : (
              filteredAssessments.map((a) => {
                const isLow = a.risk_category === 'Low';
                const isMedium = a.risk_category === 'Medium';
                const isHigh = a.risk_category === 'High';

                const badgeColor = 
                  isLow ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                  isMedium ? 'bg-amber-50 text-amber-800 border-amber-300' :
                  'bg-rose-50 text-rose-800 border-rose-300';

                const formattedDate = a.created_at 
                  ? new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'Recent Survey';

                return (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-600 font-medium">{formattedDate}</td>
                    <td className="py-3 px-3 text-emerald-800 font-extrabold">{a.season ? `Season ${a.season}` : '—'}</td>
                    <td className="py-3 px-3 text-slate-900 font-semibold">{a.crop}</td>
                    <td className="py-3 px-3 text-right text-slate-600 tnum">
                      {a.harvested_qty_kg ? a.harvested_qty_kg.toLocaleString() : '—'} kg
                    </td>
                    <td className="py-3 px-3 text-right text-rose-700 font-bold tnum">
                      {a.total_loss_kg ? a.total_loss_kg.toLocaleString() : '—'} kg
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900 tnum">
                      {a.loss_rate_pct ? `${a.loss_rate_pct.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500 tnum">
                      {a.benchmark_used_pct ? `${a.benchmark_used_pct.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${badgeColor}`}>
                        {a.risk_category || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-3 capitalize text-slate-700">
                      {a.dominant_cause ? a.dominant_cause.replace('_', ' ') : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-amber-800 tnum">
                      {a.estimated_loss_value_rwf 
                        ? `${Math.round(a.estimated_loss_value_rwf).toLocaleString()}` 
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {onReportClick ? (
                        <button
                          onClick={() => onReportClick(a)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white transition-all shadow-2xs active:scale-95"
                          title="Open Official NISR Advisory Brief"
                        >
                          <FileText className="w-3 h-3 text-emerald-500" />
                          <span>Brief</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-mono">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
