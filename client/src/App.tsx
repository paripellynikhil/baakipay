import { useCallback, useEffect, useState } from 'react';
import { type TabId } from './components/Layout';
import { type ForecastView } from './components/ForecastPage';
import InvoiceFlow from './components/InvoiceFlow';
import { SkeletonCard } from './components/Skeletons';
import { I18nProvider, useI18n } from './i18n/I18n';
import { ApiError, clearSession, getToken } from './lib/api';
import { getProfile, type Shop } from './lib/shopApi';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';

type Phase = 'loading' | 'auth' | 'retry' | 'ready';

const TAB_IDS: TabId[] = ['home', 'customers', 'future', 'bills', 'settings'];

// '#future/health' selects the Business Health sub-view; empty or unknown hashes fall back to home.
function parseHash(hash: string): { tab: TabId; view: ForecastView } {
  const [name, sub] = hash.replace(/^#/, '').split('/');
  const tab = TAB_IDS.find((id) => id === name) ?? 'home';
  return { tab, view: tab === 'future' && sub === 'health' ? 'health' : 'forecast' };
}

function hashFor(tab: TabId, view: ForecastView): string {
  return tab === 'future' && view === 'health' ? '#future/health' : `#${tab}`;
}

function AppInner() {
  const { t } = useI18n();
  const [shop, setShop] = useState<Shop | null>(null);
  const [offline, setOffline] = useState(false);
  const [phase, setPhase] = useState<Phase>(() => (getToken() ? 'loading' : 'auth'));
  const [initialView] = useState(() => parseHash(window.location.hash));
  const [activeTab, setActiveTab] = useState<TabId>(initialView.tab);
  const [forecastView, setForecastView] = useState<ForecastView>(initialView.view);
  // Logged-out gate: null = show LandingPage; 'login' | 'register' = show AuthPage in that mode.
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);

  const loadProfile = useCallback(async () => {
    setPhase('loading');
    try {
      const { offline: isOffline, data } = await getProfile();
      setShop(data.shop);
      setOffline(isOffline);
      setPhase('ready');
    } catch (err) {
      const authFailed =
        err instanceof ApiError && (err.status === 401 || err.code === 'UNAUTHORIZED' || err.code === 'INVALID_TOKEN');
      if (authFailed) {
        clearSession();
        setShop(null);
        setPhase('auth');
      } else {
        // Offline with no cache, or any other failure: let the user retry.
        setPhase('retry');
      }
    }
  }, []);

  useEffect(() => {
    if (getToken()) void loadProfile();
  }, [loadProfile]);

  // Leaving the Future Cash tab resets the Business Health sub-view.
  useEffect(() => {
    if (activeTab !== 'future') setForecastView('forecast');
  }, [activeTab]);

  // Mirror the current view into the URL hash; replace on first load, push afterwards so back/forward work.
  useEffect(() => {
    const next = hashFor(activeTab, forecastView);
    if (window.location.hash === next) return;
    if (window.location.hash === '') window.history.replaceState(null, '', next);
    else window.history.pushState(null, '', next);
  }, [activeTab, forecastView]);

  // Back/forward (and manual hash edits) re-select the view.
  useEffect(() => {
    function onHashChange() {
      const { tab, view } = parseHash(window.location.hash);
      setActiveTab(tab);
      setForecastView(view);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function handleAuthed(next: Shop) {
    setShop(next);
    setOffline(false);
    setPhase('ready');
  }

  function handleLogout() {
    clearSession();
    setShop(null);
    setActiveTab('home');
    setAuthMode(null);
    setPhase('auth');
  }

  if (phase === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
        <div className="w-full max-w-sm">
          <SkeletonCard />
        </div>
      </main>
    );
  }

  if (phase === 'retry') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
        <section className="w-full max-w-sm rounded-2xl border border-[#E2E8F0] bg-white p-6 text-center shadow-sm">
          <p role="alert" className="mb-4 text-sm font-semibold text-[#DC2626]">
            {t('networkError')}
          </p>
          <button
            type="button"
            onClick={() => void loadProfile()}
            className="min-h-[44px] w-full rounded-xl bg-[#F59E0B] px-4 font-bold text-[#0F172A] shadow-sm"
          >
            {t('retry')}
          </button>
        </section>
      </main>
    );
  }

  if (phase === 'auth' || !shop) {
    if (authMode === null) {
      return (
        <LandingPage
          onLogin={() => setAuthMode('login')}
          onStartTrial={() => setAuthMode('register')}
        />
      );
    }
    return (
      <AuthPage
        onAuthed={handleAuthed}
        initialMode={authMode}
        onBack={() => setAuthMode(null)}
      />
    );
  }

  if (!shop.onboarded) {
    return <OnboardingPage shop={shop} onDone={(updated) => setShop(updated)} />;
  }

  return (
    <InvoiceFlow
      shop={shop}
      offline={offline}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      forecastView={forecastView}
      onForecastViewChange={setForecastView}
      onLogout={handleLogout}
    />
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  );
}
