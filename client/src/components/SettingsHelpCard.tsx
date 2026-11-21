import { useI18n } from '../i18n/I18n';

// Collapsed-by-default help, FAQ, helpline and privacy disclaimer card for the Settings page.
export default function SettingsHelpCard() {
  const { t } = useI18n();

  return (
    <details className="group rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-bold text-[#1E1B4B]">
        {t('settings.help_title')}
        <span aria-hidden="true" className="text-lg transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="flex flex-col gap-4 border-t border-[#E2E8F0] px-4 py-4 text-sm text-slate-700">
        <p>{t('settings.help_line')}</p>
        <div className="flex flex-col gap-3">
          <div>
            <p className="font-semibold text-[#1E1B4B]">{t('settings.faq_q1')}</p>
            <p>{t('settings.faq_a1')}</p>
          </div>
          <div>
            <p className="font-semibold text-[#1E1B4B]">{t('settings.faq_q2')}</p>
            <p>{t('settings.faq_a2')}</p>
          </div>
        </div>
        <p>{t('settings.helpline')}</p>
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="font-semibold text-[#1E1B4B]">{t('settings.privacy_title')}</p>
          <p>{t('settings.privacy_text')}</p>
        </div>
      </div>
    </details>
  );
}
