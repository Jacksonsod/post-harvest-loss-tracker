import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import NewCoopModal from './components/layout/NewCoopModal';
import SituationRoomMap from './components/situation_room/SituationRoomMap';
import PlanNextSeason from './components/simulator/PlanNextSeason';
import CoopHistory from './components/history/CoopHistory';
import BenchmarkExplorer from './components/explorer/BenchmarkExplorer';
import AboutData from './components/about/AboutData';
import AdvisoryReportModal from './components/common/AdvisoryReportModal';
import { OptionsProvider } from './context/OptionsContext';
import { api } from './api/client';
import { AlertCircle, RotateCcw, Clock } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('national_picture');
  const [activeSeason, setActiveSeason] = useState('all');
  const [coops, setCoops] = useState([]);
  const [selectedCoop, setSelectedCoop] = useState(null);
  const [isBackendLive, setIsBackendLive] = useState(false);
  const [isColdStarting, setIsColdStarting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isNewCoopModalOpen, setIsNewCoopModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [latestAssessmentResult, setLatestAssessmentResult] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const checkConnectionAndLoad = async () => {
    setConnectionError(null);
    const coldStartTimer = setTimeout(() => {
      setIsColdStarting(true);
    }, 2500);

    try {
      await api.checkHealth();
      clearTimeout(coldStartTimer);
      setIsColdStarting(false);
      setIsBackendLive(true);

      const coopData = await api.getCoops();
      if (coopData && coopData.length > 0) {
        setCoops(coopData);
        setSelectedCoop(coopData[0]);
      }
    } catch (err) {
      clearTimeout(coldStartTimer);
      setIsColdStarting(false);
      setIsBackendLive(false);
      setConnectionError(err.message || 'Unable to connect to the backend server.');
    }
  };

  useEffect(() => {
    checkConnectionAndLoad();
  }, []);

  const handleCreateCoop = async ({ name, district }) => {
    const created = await api.createCoop({ name, district });
    setCoops((prev) => [created, ...prev]);
    setSelectedCoop(created);
    return created;
  };

  const handleAssessmentCompleted = (result) => {
    setLatestAssessmentResult(result);
  };

  return (
    <OptionsProvider>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col lg:flex-row">
        {/* 1. Ceramic Collapsible Sidebar Navigation Rail */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          isBackendLive={isBackendLive}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* 2. Main Executive Viewport Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* Cold-Start Banner */}
          {isColdStarting && !connectionError && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                <span>Starting the server — this can take up to a minute on first load.</span>
              </div>
            </div>
          )}

          {/* Connection Error Banner */}
          {connectionError && (
            <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs text-rose-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Can't reach the server. Make sure the API is active.</span>
              </div>
              <button
                onClick={checkConnectionAndLoad}
                className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all active:scale-95 shadow-2xs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry Connection</span>
              </button>
            </div>
          )}

          <main className="flex-1 px-4 lg:px-8 py-5 max-w-[1720px] w-full mx-auto">
            {activeTab === 'national_picture' && (
              <SituationRoomMap
                selectedCoop={selectedCoop}
                onSelectCoop={setSelectedCoop}
                activeSeason={activeSeason}
                onSelectSeason={setActiveSeason}
                onNavigateToPlanSeason={() => setActiveTab('plan_season')}
              />
            )}

            {activeTab === 'plan_season' && (
              <PlanNextSeason
                selectedCoop={selectedCoop}
              />
            )}

            {activeTab === 'coop_progress' && (
              <CoopHistory
                coops={coops}
                selectedCoop={selectedCoop}
                onSelectCoop={setSelectedCoop}
                onNavigateToPlanSeason={() => setActiveTab('plan_season')}
                onViewReport={(assessment) => {
                  setLatestAssessmentResult(assessment);
                  setIsReportModalOpen(true);
                }}
              />
            )}

            {activeTab === 'explore_data' && (
              <BenchmarkExplorer
                coops={coops}
                selectedCoop={selectedCoop}
                onSelectCoop={setSelectedCoop}
              />
            )}

            {activeTab === 'about_data' && (
              <AboutData />
            )}
          </main>

          {/* 3. Executive Footer */}
          <footer className="border-t border-slate-200 bg-white py-4 px-4 lg:px-8 text-xs text-slate-500 font-mono">
            <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span className="text-slate-600 font-medium">
                  NISR 2026 Big Data Hackathon • Post-Harvest Loss Tracker
                </span>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                <span>Data: NISR SAS 2024 & 2025</span>
                <span>•</span>
                <span>geoBoundaries Rwanda Districts</span>
                <span>•</span>
                <span>NST2 Priority Aligned</span>
              </div>
            </div>
          </footer>
        </div>

        {/* Modals */}
        <NewCoopModal
          isOpen={isNewCoopModalOpen}
          onClose={() => setIsNewCoopModalOpen(false)}
          onCoopCreated={handleCreateCoop}
        />

        <AdvisoryReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          selectedCoop={selectedCoop}
          latestResult={latestAssessmentResult}
        />
      </div>
    </OptionsProvider>
  );
}
