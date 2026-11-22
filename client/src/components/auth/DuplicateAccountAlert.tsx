import { useI18n } from '../../i18n/I18n';
import { primaryClass } from '../FormControls';

// Shown when registration fails because the mobile/email is already registered.
export default function DuplicateAccountAlert({ onGoToLogin }: { onGoToLogin: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-3">
      <p className="text-sm font-semibold text-[#DC2626]">{t('auth_duplicate_account')}</p>
      <button type="button" className={primaryClass} onClick={onGoToLogin}>
        {t('auth_go_to_login')}
      </button>
    </div>
  );
}
