import { useI18n } from '../i18n/I18n';
import type { Lang } from '../i18n/translations';

const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिन्दी' },
];

// Shared language picker. Uses the same I18n setter (persists to localStorage 'baakipay_lang').
export default function LanguageDropdown({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <select
      aria-label={t('lang_label')}
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      className={`min-h-[44px] rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm font-semibold text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#F59E0B] ${className}`.trim()}
    >
      {LANG_OPTIONS.map((o) => (
        <option key={o.code} value={o.code}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
