import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Receipt,
  Settings,
  LogOut,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import BaakiPayLogo from './BaakiPayLogo';
import Breadcrumbs from './Breadcrumbs';
import { useI18n } from '../i18n/I18n';
import type { Lang, TranslationKey } from '../i18n/translations';

export type TabId = 'home' | 'customers' | 'future' | 'bills' | 'settings';

const TABS: { id: TabId; labelKey: TranslationKey; icon: LucideIcon }[] = [
  { id: 'home', labelKey: 'nav_home', icon: LayoutDashboard },
  { id: 'customers', labelKey: 'nav_customers', icon: Users },
  { id: 'future', labelKey: 'nav_future', icon: TrendingUp },
  { id: 'bills', labelKey: 'nav_bills', icon: Receipt },
  { id: 'settings', labelKey: 'nav_settings', icon: Settings },
];

const PHONE_TABS = TABS.filter((tab) => tab.id !== 'settings');

const LANG_BUTTONS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'te', label: 'తె' },
  { code: 'hi', label: 'हि' },
];

interface LayoutProps {
  shopName: string;
  offline: boolean;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onAddBill: () => void;
  onLogout: () => void;
  children: ReactNode;
}

function LangSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center gap-1">
      {LANG_BUTTONS.map((btn) => {
        const active = lang === btn.code;
        return (
          <button
            key={btn.code}
            type="button"
            aria-pressed={active}
            onClick={() => setLang(btn.code)}
            className={`min-h-[44px] min-w-[44px] rounded-xl px-2 text-sm font-semibold ${
              active
                ? 'bg-[#1E1B4B] text-white ring-2 ring-white lg:ring-0'
                : 'bg-white border border-[#E2E8F0] text-[#1E1B4B]'
            }`}
          >
            {btn.label}
          </button>
        );
      })}
    </div>
  );
}

export default function Layout({
  shopName,
  offline,
  activeTab,
  onTabChange,
  onAddBill,
  onLogout,
  children,
}: LayoutProps) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[240px] flex-col gap-4 bg-[#1E1B4B] p-5 text-white">
        <div className="px-1 pt-2">
          <button type="button" onClick={() => onTabChange('home')} className="cursor-pointer">
            <BaakiPayLogo variant="dark" />
          </button>
          <p className="mt-1 text-xs text-white/70">{t('tagline')}</p>
        </div>
        <button
          type="button"
          onClick={onAddBill}
          className="min-h-[44px] w-full rounded-xl bg-[#F59E0B] font-bold text-[#0F172A]"
        >
          {t('addBill')}
        </button>
        <nav className="flex flex-col gap-1">
          {TABS.map(({ id, labelKey, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onTabChange(id)}
                className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl border-l-4 px-4 text-left text-sm font-semibold ${
                  active
                    ? 'border-[#F59E0B] bg-white/10 text-white'
                    : 'border-transparent text-white/70 hover:text-white'
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                {t(labelKey)}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-col lg:ml-[240px]">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-[#1E1B4B] px-4 py-3 text-white lg:static lg:bg-white lg:px-8 lg:text-[#1E1B4B] lg:border-b lg:border-[#E2E8F0]">
          <button type="button" onClick={() => onTabChange('home')} className="shrink-0 cursor-pointer lg:hidden">
            <BaakiPayLogo variant="dark" showWordmark={false} />
          </button>
          <p className="min-w-0 flex-1 truncate font-semibold">{shopName}</p>
          <div className="flex items-center gap-2">
            <LangSwitcher />
            <button
              type="button"
              onClick={() => onTabChange('settings')}
              aria-label={t('nav_settings')}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/10 text-white lg:hidden"
            >
              <Settings size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onLogout}
              aria-label={t('settings_logout')}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl bg-white/10 px-2 text-sm font-semibold text-white lg:border lg:border-[#E2E8F0] lg:bg-white lg:px-3 lg:text-[#1E1B4B]"
            >
              <LogOut size={18} aria-hidden="true" />
              <span className="hidden lg:inline">{t('settings_logout')}</span>
            </button>
          </div>
        </header>

        {offline && (
          <div role="alert" className="w-full bg-[#FEF3C7] px-4 py-2 text-sm font-semibold text-[#D97706]">
            {t('offlineBanner')}
          </div>
        )}

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-6">
          {activeTab !== 'home' && (
            <Breadcrumbs
              homeLabel={t('nav_home')}
              currentLabel={t(TABS.find((tab) => tab.id === activeTab)?.labelKey ?? 'nav_home')}
              onHome={() => onTabChange('home')}
            />
          )}
          {children}
        </main>
      </div>

      <button
        type="button"
        onClick={onAddBill}
        className="fixed bottom-20 right-4 z-30 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#F59E0B] px-4 font-bold text-[#0F172A] shadow-lg lg:hidden"
      >
        <Plus size={18} aria-hidden="true" />
        {t('addBill')}
      </button>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-[#E2E8F0] bg-white lg:hidden">
        {PHONE_TABS.map(({ id, labelKey, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => onTabChange(id)}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] ${
                active ? 'font-semibold text-[#1E1B4B]' : 'text-slate-500'
              }`}
            >
              <Icon size={20} aria-hidden="true" />
              {t(labelKey)}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
