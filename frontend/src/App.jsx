import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import NewCoopModal from './components/layout/NewCoopModal';
import SituationRoomMap from './components/situation_room/SituationRoomMap';
import AssessmentEngine from './components/diagnostic/AssessmentEngine';
import CoopHistory from './components/history/CoopHistory';
import BenchmarkExplorer from './components/explorer/BenchmarkExplorer';
import AdvisoryReportModal from './components/common/AdvisoryReportModal';
import { api } from './api/client';
import { INITIAL_COOPERATIVES, INITIAL_ASSESSMENTS } from './api/seedData';
import { ShieldCheck, Database, Award } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('situation_room');
  const [activeSeason, setActiveSeason] = useState('all');
  const [coops, setCoops] = useState(INITIAL_COOPERATIVES);
  const [selectedCoop, setSelectedCoop] = useState(INITIAL_COOPERATIVES[0]);
  const [isBackendLive, setIsBackendLive] = useState(false);
  const [isNewCoopModalOpen, setIsNewCoopModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [latestAssessmentResult, setLatestAssessmentResult] = useState(null);

  // Initialize and check backend connection
  useEffect(() => {
    let isMounted = true;

    // Check health
    api.checkHealth()
      .then(() => {
        if (isMounted) setIsBackendLive(true);
        // Load coops from backend database
        return api.getCoops();
      })
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setCoops(data);
          setSelectedCoop(data[0]);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsBackendLive(false);
          // Fall back gracefully to pre-seeded cooperatives
          setCoops(INITIAL_COOPERATIVES);
          setSelectedCoop(INITIAL_COOPERATIVES[0]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateCoop = async ({ name, district }) => {
    try {
      const created = await api.createCoop({ name, district });
      setCoops((prev) => [created, ...prev]);
      setSelectedCoop(created);
      return created;
    } catch (err) {
      // In demo / offline fallback mode
      const localCoop = {
        id: Math.max(...coops.map((c) => c.id), 0) + 1,
        name,
        district,
        created_at: new Date().toISOString(),
      };
      setCoops((prev) => [localCoop, ...prev]);
      setSelectedCoop(localCoop);
      return localCoop;
    }
  };

  const handleAssessmentCompleted = (result) => {
    setLatestAssessmentResult(result);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* 1. Situation Room Header */}
      <Header
        coops={coops}
        selectedCoop={selectedCoop}
        onSelectCoop={setSelectedCoop}
        onOpenNewCoopModal={() => setIsNewCoopModalOpen(true)}
        isBackendLive={isBackendLive}
      />

      {/* 2. Tactical Navigation Bar with Integrated Season Switcher */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeSeason={activeSeason}
        onSelectSeason={setActiveSeason}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* 3. Main Dashboard Content Viewport */}
      <main className="flex-1 px-4 lg:px-8 py-5 max-w-[1720px] mx-auto w-full">
        {activeTab === 'situation_room' && (
          <SituationRoomMap
            selectedCoop={selectedCoop}
            onSelectCoop={setSelectedCoop}
            activeSeason={activeSeason}
            onSelectSeason={setActiveSeason}
            onNavigateToDiagnostic={() => setActiveTab('diagnostic')}
          />
        )}

        {activeTab === 'diagnostic' && (
          <AssessmentEngine
            selectedCoop={selectedCoop}
            onAssessmentCompleted={handleAssessmentCompleted}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <CoopHistory
            selectedCoop={selectedCoop}
            onNavigateToDiagnostic={() => setActiveTab('diagnostic')}
            onViewReport={(assessment) => {
              setLatestAssessmentResult(assessment);
              setIsReportModalOpen(true);
            }}
          />
        )}

        {activeTab === 'explorer' && (
          <BenchmarkExplorer />
        )}
      </main>

      {/* 4. Executive Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 lg:px-8 text-xs text-slate-500 font-mono">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-slate-600 font-medium">
              NISR 2026 Big Data Hackathon • Track 1: Agricultural Productivity
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Data: NISR SAS 2024 & 2025</span>
            <span>•</span>
            <span>geoBoundaries RWA ADM2</span>
            <span>•</span>
            <span>NST2 Priority Aligned</span>
          </div>
        </div>
      </footer>

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
  );
}
