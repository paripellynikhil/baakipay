import { useI18n } from '../i18n/I18n';
import type { TranslationKey } from '../i18n/translations';

type TitleKey = 'home_title' | 'customers_title' | 'future_title' | 'bills_title' | 'settings_title';

export default function PlaceholderPage({ titleKey }: { titleKey: TitleKey }) {
  const { t } = useI18n();
  const title: TranslationKey = titleKey;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center max-w-md mx-auto mt-12">
      <h1 className="text-xl font-bold text-[#1E1B4B]">{t(title)}</h1>
      <p className="font-semibold text-slate-700 mt-2">{t('comingSoon')}</p>
      <p className="text-sm text-slate-500 mt-2">{t('milestoneNote')}</p>
    </div>
  );
}
