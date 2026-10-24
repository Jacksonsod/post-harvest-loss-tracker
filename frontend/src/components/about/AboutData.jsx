import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { 
  Database, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle,
  BookOpen,
  Download,
  UploadCloud,
  FileSpreadsheet,
  RotateCcw,
  Check,
  AlertCircle,
  ShieldCheck,
  Scale,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function AboutData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coopCount, setCoopCount] = useState(0);

  // Ingestion State
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [undoLoading, setUndoLoading] = useState(false);
  const [undoSuccess, setUndoSuccess] = useState(false);
  const [rawCsvText, setRawCsvText] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);

  const fileInputRef = useRef(null);

  const loadData = () => {
    let isMounted = true;
    setLoading(true);
    
    Promise.all([
      api.getAboutData(),
      api.getCoops().catch(() => [])
    ])
      .then(([aboutRes, coopsRes]) => {
        if (isMounted) {
          setData(aboutRes);
          setCoopCount(Array.isArray(coopsRes) ? coopsRes.length : 0);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load dataset documentation.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Template Download
  const handleDownloadTemplate = () => {
    const url = api.getImportTemplateUrl();
    window.open(url, '_blank');
  };

  // Run Dry-Run Preview on a File
  const handlePreviewFile = async (file) => {
    if (!file) return;
    setUploadedFile(file);
    setPreviewLoading(true);
    setPreviewError(null);
    setImportResult(null);
    setUndoSuccess(false);

    try {
      const res = await api.previewImportFile(file);
      setPreviewData(res);
    } catch (err) {
      setPreviewError(err.message || 'Failed to preview CSV file. Make sure columns match the official template.');
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Load Verified Sample Batch
  const handleLoadSampleBatch = async () => {
    const sampleCsv = `cooperative_name,district,crop,season,year,harvested_qty_kg,total_loss_kg,loss_storage_kg,loss_insects_pests_kg,dominant_cause,action_taken
Cooperative Twitezimbere Musanze,Musanze,Irish potato,A,2025,14500,1200,900,300,storage,Procured hermetic storage bags and pallet racks
Koperative Duterimbere Nyagatare,Nyagatare,Maize,A,2025,28000,3500,,3500,insects_pests,Treated grain with biological pesticide
Cooperative Jyambere Huye,Huye,Cassava,A,2025,8500,680,680,,storage,Elevated and ventilated storage platforms`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const file = new File([blob], 'nisr_sample_cooperative_returns.csv', { type: 'text/csv' });
    handlePreviewFile(file);
  };

  // Execute Actual Import
  const handleExecuteImport = async () => {
    if (!uploadedFile) return;
    setImportLoading(true);
    setPreviewError(null);

    try {
      const res = await api.importAssessmentsFile(uploadedFile);
      setImportResult(res);
      // Refresh cooperative count
      api.getCoops().then(c => setCoopCount(Array.isArray(c) ? c.length : coopCount)).catch(() => {});
    } catch (err) {
      setPreviewError(err.message || 'Import failed. Verify all row errors are resolved.');
    } finally {
      setImportLoading(false);
    }
  };

  // Undo Import
  const handleUndoImport = async () => {
    if (!importResult?.batch_id) return;
    setUndoLoading(true);

    try {
      await api.undoImportBatch(importResult.batch_id);
      setUndoSuccess(true);
      setImportResult(null);
      // Refresh cooperative count
      api.getCoops().then(c => setCoopCount(Array.isArray(c) ? c.length : coopCount)).catch(() => {});
    } catch (err) {
      setPreviewError(err.message || 'Failed to undo import.');
    } finally {
      setUndoLoading(false);
    }
  };

  // Clear Ingestion State
  const handleResetImport = () => {
    setUploadedFile(null);
    setPreviewData(null);
    setPreviewError(null);
    setImportResult(null);
    setUndoSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Drag Events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePreviewFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Executive Header Banner */}
      <div className="bg-white/95 rounded-[28px] border border-black/[0.06] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 font-mono tracking-tight uppercase">
                Data Management & Methodology
              </h2>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                OFFICIAL NISR METHODOLOGY
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-black/[0.05]">
                DATA IMPORT READY
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              National survey benchmarks, post-harvest standards, and harvest record imports.
            </p>
          </div>
        </div>

        {/* Header Action: Download Template */}
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all shadow-2xs shrink-0 self-start md:self-auto cursor-pointer active:scale-95"
          title="Download official CSV template for cooperative harvest returns"
        >
          <Download className="w-4 h-4 text-emerald-700" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white/95 border border-black/[0.06] rounded-[28px] p-12 text-center text-xs font-mono text-slate-400 animate-pulse">
          Loading methodology documentation and dataset registers...
        </div>
      ) : error ? (
        <div className="bg-white/95 border border-amber-200 rounded-[28px] p-8 text-center text-xs font-mono text-amber-800">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* 2. Key System Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 bg-white/95 border border-black/[0.06] rounded-2xl shadow-2xs font-mono">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">SURVEYED PLOTS</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">
                {data?.metadata?.total_records?.toLocaleString() || '134,766'}
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">NISR SAS 2024–2025</span>
            </div>

            <div className="p-4 bg-white/95 border border-black/[0.06] rounded-2xl shadow-2xs font-mono">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">PLOTS WITH LOSS</span>
              <span className="text-xl font-black text-rose-700 block mt-0.5">
                {data?.metadata?.records_with_loss?.toLocaleString() || '37,894'}
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                {data?.metadata?.share_with_loss_pct || 28.1}% of all plots
              </span>
            </div>

            <div className="p-4 bg-white/95 border border-black/[0.06] rounded-2xl shadow-2xs font-mono">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">COVERED DISTRICTS</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">
                {data?.metadata?.n_districts || 30} Districts
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">100% National Coverage</span>
            </div>

            <div className="p-4 bg-white/95 border border-black/[0.06] rounded-2xl shadow-2xs font-mono">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">CROP COMMODITIES</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">
                {data?.metadata?.n_crops || 21} Crops
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">NISR Standard Groups</span>
            </div>

            <div className="p-4 bg-white/95 border border-black/[0.06] rounded-2xl shadow-2xs font-mono">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">ACTIVE COOPERATIVES</span>
              <span className="text-xl font-black text-emerald-700 block mt-0.5">
                {coopCount} Registered
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Database Registry</span>
            </div>

            <div className="p-4 bg-white/95 border border-black/[0.06] rounded-2xl shadow-2xs font-mono">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">POLICY GOAL (NST2)</span>
              <span className="text-xl font-black text-emerald-700 block mt-0.5">
                ≤ 5.0%
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Rwanda Target 2029</span>
            </div>
          </div>

          {/* 3. Dataset Ingestion Workspace (Primary Interactive Section) */}
          <div className="bg-white/95 border border-black/[0.06] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-5">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.05]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
                    Import Cooperative Harvest Records
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Upload organized cooperative harvest surveys or field records (.csv) to review loss calculations and save them to the system.
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleLoadSampleBatch}
                  disabled={previewLoading || importLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-black/[0.06] text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Load 3 sample Rwandan cooperative records for instant testing"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Load Sample Batch</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-black/[0.06] text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  title="Download the official CSV spreadsheet template"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Template</span>
                </button>

                {(uploadedFile || previewData) && (
                  <button
                    type="button"
                    onClick={handleResetImport}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dropzone Container */}
            {!previewData && !importResult && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-50/50' 
                    : 'border-slate-200 hover:border-emerald-400 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handlePreviewFile(e.target.files[0])}
                  accept=".csv,text/csv"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-black/[0.06] text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {previewLoading ? 'Analyzing spreadsheet and validating records...' : 'Drag and drop your harvest returns (.csv) here, or browse files'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    CSV format (comma, semicolon, or tab) • Up to 1,000 rows • Max 2 MB
                  </span>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {previewError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Validation Alert:</span>
                  <span>{previewError}</span>
                </div>
              </div>
            )}

            {/* Undo Confirmation Banner */}
            {undoSuccess && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Import batch successfully undone. Newly created empty cooperatives were cleanly removed.</span>
              </div>
            )}

            {/* Post-Import Success Banner */}
            {importResult && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold block text-sm text-emerald-950">
                        Harvest Records Successfully Saved to System!
                      </span>
                      <span className="text-[11px] text-emerald-700 block">
                        Saved {importResult.imported_count} harvest records across {importResult.cooperatives_created} new and {importResult.cooperatives_updated} existing cooperatives (Batch ID: #{importResult.batch_id}).
                      </span>
                    </div>
                  </div>

                  {/* Undo Button */}
                  {importResult.batch_id && (
                    <button
                      type="button"
                      onClick={handleUndoImport}
                      disabled={undoLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 shrink-0"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${undoLoading ? 'animate-spin' : ''}`} />
                      <span>{undoLoading ? 'Undoing...' : 'Undo This Import'}</span>
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-emerald-200/60 flex items-center gap-3 text-[11px] text-emerald-800">
                  <span>Data is now live in Cooperative Progress and Situation Room analytics.</span>
                  <button
                    type="button"
                    onClick={handleResetImport}
                    className="underline font-bold hover:text-emerald-950 cursor-pointer"
                  >
                    Upload Another Dataset
                  </button>
                </div>
              </div>
            )}

            {/* Preview Table & Summary Ribbon */}
            {previewData && !importResult && (
              <div className="space-y-4">
                {/* Summary Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-black/[0.05]">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-mono font-bold text-slate-700">PREVIEW SUMMARY:</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-mono font-bold text-[11px]">
                      {previewData.total_received} Total Rows
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px]">
                      {previewData.imported_count} Ready to Save
                    </span>
                    {previewData.cooperatives_created > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono font-bold text-[11px]">
                        +{previewData.cooperatives_created} New Cooperatives
                      </span>
                    )}
                    {previewData.errors?.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono font-bold text-[11px]">
                        {previewData.errors.length} Flagged Errors
                      </span>
                    )}
                  </div>

                  {/* Save Records Button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetImport}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      disabled={importLoading || previewData.errors?.length > 0}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        previewData.errors?.length > 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer active:scale-95 shadow-emerald-700/20'
                      }`}
                      title={previewData.errors?.length > 0 ? 'Resolve errors before saving' : 'Save validated records into the system'}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{importLoading ? 'Saving Records...' : `Save ${previewData.imported_count} Records`}</span>
                    </button>
                  </div>
                </div>

                {/* Flagged Errors Callout */}
                {previewData.errors?.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                    <span className="font-bold block">Rows with Issues (Must be corrected to import):</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                      {previewData.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Interactive Table */}
                <div className="border border-black/[0.06] rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-black/[0.05] text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                          <th className="py-2.5 px-3">Row</th>
                          <th className="py-2.5 px-3">Cooperative</th>
                          <th className="py-2.5 px-3">District</th>
                          <th className="py-2.5 px-3">Crop</th>
                          <th className="py-2.5 px-3">Season/Year</th>
                          <th className="py-2.5 px-3 text-right">Harvest (kg)</th>
                          <th className="py-2.5 px-3 text-right">Loss (kg)</th>
                          <th className="py-2.5 px-3 text-right">Loss Rate</th>
                          <th className="py-2.5 px-3 text-center">Benchmark</th>
                          <th className="py-2.5 px-3 text-center">Risk</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.04] font-sans">
                        {previewData.rows?.map((row, idx) => (
                          <tr 
                            key={idx}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              row.status === 'error' ? 'bg-rose-50/40' : row.status === 'duplicate' ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-400 font-bold">
                              #{row.row || idx + 2}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-900 max-w-[160px] truncate" title={row.cooperative_name}>
                              {row.cooperative_name || '—'}
                            </td>
                            <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                              {row.district || '—'}
                            </td>
                            <td className="py-2 px-3 text-slate-700 font-medium">
                              {row.crop || '—'}
                            </td>
                            <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                              {row.season ? `Season ${row.season}` : '—'} {row.year ? `(${row.year})` : ''}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">
                              {row.harvested_qty_kg ? Number(row.harvested_qty_kg).toLocaleString() : '—'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">
                              {row.total_loss_kg !== undefined && row.total_loss_kg !== null ? Number(row.total_loss_kg).toLocaleString() : '—'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {row.loss_rate_pct !== undefined && row.loss_rate_pct !== null ? `${row.loss_rate_pct}%` : '—'}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-500">
                              {row.benchmark_loss_rate_pct !== undefined ? `${row.benchmark_loss_rate_pct}%` : '—'}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {row.risk_category ? (
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                  row.risk_category === 'Low' 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : row.risk_category === 'High' 
                                    ? 'bg-rose-100 text-rose-800' 
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {row.risk_category}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {row.status === 'ok' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Ready</span>
                                </span>
                              ) : row.status === 'duplicate' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200" title="Already saved in system; will skip">
                                  <span>Duplicate</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200" title={row.errors?.join(', ') || 'Validation error'}>
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  <span>Fix Row</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Official Methodology & Standards (Clean 2-Column Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: NISR Statistical Standards (Span 7) */}
            <div className="lg:col-span-7 bg-white/95 border border-black/[0.06] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-black/[0.05]">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
                  NISR Statistical Quality Standards
                </h3>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-black/[0.04] space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-mono font-black flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h4 className="text-xs font-mono font-bold text-slate-900 uppercase">
                      Post-Harvest Loss Calculation Framework
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 pl-7 leading-relaxed font-sans">
                    Physical loss is calculated as the sum of 10 itemized causes (theft, insects/pests, birds/animals, fallen stalks, harvest damage, transport, storage, processing, packaging, and point-of-sale). This ensures consistent cross-season comparability across 2024 and 2025 SAS instruments.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-black/[0.04] space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-mono font-black flex items-center justify-center shrink-0">
                      2
                    </span>
                    <h4 className="text-xs font-mono font-bold text-slate-900 uppercase">
                      Stratified Sampling Weights & Outlier Control
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 pl-7 leading-relaxed font-sans">
                    Averages incorporate official NISR sampling weights, capping any single plot's contribution at 25% of its stratum's total weight to prevent extreme local events from distorting national and district benchmarks.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-black/[0.04] space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-mono font-black flex items-center justify-center shrink-0">
                      3
                    </span>
                    <h4 className="text-xs font-mono font-bold text-slate-900 uppercase">
                      Hierarchical Fallback & Risk Attribution
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 pl-7 leading-relaxed font-sans">
                    Benchmarks require a minimum statistical threshold of 5 surveyed plots. If a district-season cell lacks sufficient sample size, the engine automatically steps up to district-wide and then national benchmarks. Risk categories are assigned as Low (≤85% of benchmark), Medium (85–115%), or High (&gt;115%).
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Primary Data Sources & Attribution (Span 5) */}
            <div className="lg:col-span-5 bg-white/95 border border-black/[0.06] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-black/[0.05]">
                <Database className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-tight">
                  Primary Data Sources & Attribution
                </h4>
              </div>

              <div className="space-y-2.5">
                {data?.sources?.map((src, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-black/[0.04] flex items-start justify-between text-xs"
                  >
                    <div>
                      {src.url ? (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono font-bold text-slate-900 hover:text-emerald-700 transition-colors flex items-center gap-1 group"
                        >
                          <span>{src.name || src.title}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
                        </a>
                      ) : (
                        <span className="font-mono font-bold text-slate-900 block">
                          {src.name || src.title}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-sans block mt-0.5 leading-snug">
                        {src.description || src.note}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="p-3 rounded-xl bg-slate-50 border border-black/[0.04] text-xs">
                  <a
                    href="https://www.geoboundaries.org"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono font-bold text-slate-900 hover:text-emerald-700 transition-colors flex items-center gap-1 group"
                  >
                    <span>geoBoundaries Rwanda ADM2</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
                  </a>
                  <span className="text-[11px] text-slate-500 font-sans block mt-0.5 leading-snug">
                    District boundary shapefiles provided under Open Data license by geoBoundaries.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}