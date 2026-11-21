import { useCallback, useEffect, useState } from 'react';
import { type TabId } from './components/Layout';
import InvoiceFlow from './components/InvoiceFlow';
import { SkeletonCard } from './components/Skeletons';
import { I18nProvider, useI18n } from './i18n/I18n';
import { ApiError, clearSession, getToken } from './lib/api';
import { getProfile, type Shop } from './lib/shopApi';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';

type Phase = 'loading' | 'auth' | 'retry' | 'ready';

function AppInner() {
  const { t } = useI18n();
  const [shop, setShop] = useState<Shop | null>(null);
  const [offline, setOffline] = useState(false);
  const [phase, setPhase] = useState<Phase>(() => (getToken() ? 'loading' : 'auth'));
  const [activeTab, setActiveTab] = useState<TabId>('home');

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

  function handleAuthed(next: Shop) {
    setShop(next);
    setOffline(false);
    setPhase('ready');
  }

  function handleLogout() {
    clearSession();
    setShop(null);
    setActiveTab('home');
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
    return <AuthPage onAuthed={handleAuthed} />;
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
