import { useState, useEffect, useCallback } from 'react';
import type { DailyPollResponse } from './types';
import { fetchTodayPoll, getAdminKey, getVoterId } from './services/api';
import { Navbar } from './components/Navbar';
import { DailyPollView } from './components/DailyPollView';
import { ArchiveView } from './components/ArchiveView';
import { AdminView } from './components/AdminView';
import { Toast, type ToastMessage } from './components/Toast';
import { Globe, Fingerprint, Sparkles } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<'today' | 'archive' | 'admin'>('today');
  const [todayData, setTodayData] = useState<DailyPollResponse | null>(null);
  const [loadingToday, setLoadingToday] = useState<boolean>(true);
  const [todayError, setTodayError] = useState<string | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(!!getAdminKey());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [voterId, setVoterId] = useState<string>('');

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadTodayPoll = useCallback(async () => {
    setLoadingToday(true);
    setTodayError(null);
    try {
      const data = await fetchTodayPoll();
      setTodayData(data);
    } catch (err: any) {
      setTodayError(err.message || 'Failed to load today\'s poll');
    } finally {
      setLoadingToday(false);
    }
  }, []);

  useEffect(() => {
    setVoterId(getVoterId());
    loadTodayPoll();
  }, [loadTodayPoll]);

  // Reset anonymous voter session for testing
  const handleResetSession = () => {
    localStorage.removeItem('thisorthat_voter_id');
    const newId = getVoterId();
    setVoterId(newId);
    showToast('Session reset. You can vote again!', 'info');
    loadTodayPoll();
  };

  return (
    <div className="min-h-screen flex flex-col bg-warm-100 text-ink-900 selection:bg-accent-soft selection:text-accent">
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'today' && (
          <DailyPollView
            data={todayData}
            loading={loadingToday}
            error={todayError}
            onRefresh={loadTodayPoll}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'archive' && (
          <ArchiveView onShowToast={showToast} />
        )}

        {currentTab === 'admin' && (
          <AdminView
            onShowToast={showToast}
            onAdminAuthChange={(isAuth) => setIsAdminLoggedIn(isAuth)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-warm-300/80 bg-warm-50 py-8 px-4 sm:px-6 mt-12 transition-colors">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-500">
          
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-ink-900 tracking-tight">ThisOrThat</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-accent" /> Active at 12:00 AM IST daily
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-warm-200 px-2.5 py-1 rounded-full text-[11px] font-mono text-ink-700">
              <Fingerprint className="w-3 h-3 text-ink-400" />
              <span>Session: {voterId ? voterId.substring(0, 8) + '...' : 'anonymous'}</span>
            </div>

            <button
              onClick={handleResetSession}
              title="Reset anonymous ID to simulate new voter"
              className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> New Session
            </button>
          </div>

        </div>
      </footer>

      {/* Toast Notifications Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
