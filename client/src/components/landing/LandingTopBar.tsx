import BaakiPayLogo from '../BaakiPayLogo';
import LanguageDropdown from '../LanguageDropdown';
import { useI18n } from '../../i18n/I18n';

interface LandingTopBarProps {
  onLogin: () => void;
  onStartTrial: () => void;
}

const NAV_LINKS = [
  { href: '#how-it-works', key: 'landing_nav_how' },
  { href: '#features', key: 'landing_nav_features' },
  { href: '#pricing', key: 'landing_nav_pricing' },
  { href: '#about', key: 'landing_nav_about' },
] as const;

export default function LandingTopBar({ onLogin, onStartTrial }: LandingTopBarProps) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <BaakiPayLogo size="lg" />
        <nav aria-label="Landing" className="hidden items-center gap-5 text-sm font-semibold md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-[#1E1B4B] hover:text-[#F59E0B]">
              {t(link.key)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageDropdown />
          <button
            type="button"
            onClick={onLogin}
            className="min-h-[44px] rounded-xl border-[1.5px] border-[#1E1B4B] bg-white px-4 text-sm font-bold text-[#1E1B4B]"
          >
            {t('landing_login')}
          </button>
          <button
            type="button"
            onClick={onStartTrial}
            className="min-h-[44px] rounded-xl bg-[#F59E0B] px-4 text-sm font-bold text-[#0F172A] shadow-sm"
          >
            {t('landing_start_trial')}
          </button>
        </div>
      </div>
    </header>
  );
}
