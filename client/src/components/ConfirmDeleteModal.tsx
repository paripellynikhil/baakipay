import { useI18n } from '../i18n/I18n';
import { fillTemplate } from '../lib/safeBuffer';
import { linkClass } from './FormControls';

interface ConfirmDeleteModalProps {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}

// Asks the shopkeeper to confirm before a bill is removed. Nothing is deleted until onConfirm runs.
export function ConfirmDeleteModal({ name, onCancel, onConfirm }: ConfirmDeleteModalProps) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-body"
        className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-delete-title" className="mb-2 text-lg font-bold text-[#1E1B4B]">
          {t('bills.deleteConfirmTitle')}
        </h2>
        <p id="confirm-delete-body" className="mb-4 text-sm text-slate-600">
          {fillTemplate(t('bills.deleteConfirmBody'), { name })}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[44px] rounded-xl bg-[#DC2626] px-4 font-bold text-white"
          >
            {t('bills.delete')}
          </button>
          <button type="button" onClick={onCancel} className={linkClass}>
            {t('bills.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
