import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  Database, 
  FileText, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2, 
  Scale, 
  Layers, 
  AlertTriangle,
  Github,
  BookOpen,
  Info
} from 'lucide-react';

export default function AboutData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getAboutData()
      .then((res) => {
        if (isMounted) setData(res);
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
  }, []);

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-white/95 rounded-[28px] border border-black/[0.06] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 font-mono tracking-tight uppercase">
                About the Data & Methodology
              </h2>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                OFFICIAL NISR METHODOLOGY
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-black/[0.05]">
                TRANSPARENCY STANDARD
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Data lineage, survey sample sizes, loss calculation formulas, and validation disclosures.
            </p>
          </div>
        </div>

        <a
          href="https://github.com/Jacksonsod/post-harvest-loss-tracker"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-all shadow-sm shadow-emerald-700/20 shrink-0 self-start md:self-auto cursor-pointer"
        >
          <Github className="w-4 h-4" />
          <span>View GitHub Repository</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      </div>

      {loading ? (
        <div className="bg-white/95 border border-black/[0.06] rounded-[28px] p-12 text-center text-xs font-mono text-slate-400 animate-pulse">
          Loading methodology documentation from backend repository...
        </div>
      ) : error ? (
        <div className="bg-white/95 border border-amber-200 rounded-[28px] p-8 text-center text-xs font-mono text-amber-800">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Sample Size Metrics Strip */}
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
              <span className="text-[10px] text-slate-400 font-bold uppercase block">SURVEY YEARS</span>
              <span className="text-xl font-black text-emerald-700 block mt-0.5">
                2024 & 2025
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Pooled Stratification</span>
            </div>

            <div className="p-4 bg-white/95 border border-black/[0.06] rounded-2xl shadow-2xs font-mono">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">POLICY GOAL</span>
              <span className="text-xl font-black text-emerald-700 block mt-0.5">
                ≤ 5.0%
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Rwanda NST2 Target 2029</span>
            </div>
          </div>

          {/* Methodology & Machine Learning Disclosure */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Core Methodology Statements (Span 7) */}
            <div className="lg:col-span-7 bg-white/95 border border-black/[0.06] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-black/[0.05]">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
                  Data Processing & Calculation Methodology
                </h3>
              </div>

              <div className="space-y-3">
                {data?.methodology?.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50/80 border border-black/[0.04] flex items-start gap-3">
                    <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-mono font-black flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-bold text-slate-900">
                        {item.topic || item.title || `Standard Rule ${idx + 1}`}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-sans">
                        {item.statement || item.description || (typeof item === 'string' ? item : JSON.stringify(item))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Machine Learning Disclosure & Primary Sources (Span 5) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Machine Learning Model Disclosure Card */}
              <div className="bg-amber-50/70 border border-amber-300/80 rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <h4 className="text-xs font-mono font-bold text-amber-950 uppercase tracking-tight">
                    Machine Learning Model Evaluation & Rejection
                  </h4>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed font-sans">
                  A machine-learning classification model was trained on the SAS 2024 microdata and tested on the SAS 2025 dataset to predict high-loss risk. The model achieved an <strong>AUC of 0.59</strong>, which was determined to be too weak for actionable agronomic decisions.
                </p>
                <div className="p-3 rounded-xl bg-white/80 border border-amber-200 text-xs font-mono text-amber-900">
                  <span className="font-bold block text-slate-900">Engineering Decision:</span>
                  <span>We deliberately rejected the black-box ML model in favor of transparent, survey-weighted empirical quantile benchmarks (P25 • P50 • P75 • P90) that users can trace directly to surveyed plots.</span>
                </div>
              </div>

              {/* Primary Data Sources Card */}
              <div className="bg-white/95 border border-black/[0.06] rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-black/[0.05]">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-tight">
                    Primary Data Sources & Attribution
                  </h4>
                </div>

                <div className="space-y-2">
                  {data?.sources?.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-black/[0.04] flex items-center justify-between text-xs transition-all group"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-900 block group-hover:text-emerald-700 transition-colors">
                          {src.name || src.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
                          {src.description || src.note}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2" />
                    </a>
                  ))}

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-black/[0.04] text-xs">
                    <span className="font-mono font-bold text-slate-900 block">
                      geoBoundaries Rwanda ADM2
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
                      District boundary shapefiles provided under Open Data license by geoBoundaries.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
