import type { InputHTMLAttributes } from 'react';
import { useI18n } from '../i18n/I18n';
import type { Lang } from '../i18n/translations';

export const inputClass =
  'min-h-[44px] w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]';
export const primaryClass =
  'min-h-[44px] w-full rounded-xl bg-[#F59E0B] px-4 font-bold text-[#0F172A] shadow-sm disabled:opacity-60';
export const linkClass = 'min-h-[44px] text-sm font-semibold text-[#1E1B4B] underline underline-offset-4';

export function Field({ id, label, ...rest }: { id: string; label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-[#1E1B4B]">
        {label}
      </label>
      <input id={id} className={inputClass} {...rest} />
    </div>
  );
}

const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'te', label: 'తె' },
  { code: 'hi', label: 'हि' },
];

export function LangSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="flex justify-end gap-2" role="group" aria-label={t('lang_label')}>
      {LANG_OPTIONS.map((o) => (
        <button
          key={o.code}
          type="button"
          aria-pressed={lang === o.code}
          onClick={() => setLang(o.code)}
          className={`min-h-[44px] min-w-[44px] rounded-xl border px-3 text-sm font-semibold ${
            lang === o.code ? 'border-[#1E1B4B] bg-[#1E1B4B] text-white' : 'border-[#E2E8F0] bg-white text-[#1E1B4B]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
