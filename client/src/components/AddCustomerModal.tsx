import { useState, type FormEvent } from 'react';
import { Field, linkClass, primaryClass } from './FormControls';
import { useI18n } from '../i18n/I18n';
import { ApiError } from '../lib/api';
import { createCustomer, type Customer } from '../lib/customersApi';

interface AddCustomerModalProps {
  onClose: () => void;
  onSaved: (customer: Customer) => void;
}

interface FieldErrors {
  name?: string;
  phone?: string;
}

export function AddCustomerModal({ onClose, onSaved }: AddCustomerModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: FieldErrors = {};
    if (!name.trim()) next.name = t('customers.nameRequired');
    if (!phone.trim()) next.phone = t('customers.phoneRequired');
    setErrors(next);
    if (next.name || next.phone) return;

    const limit = creditLimit.trim() ? Number(creditLimit) : undefined;
    if (limit !== undefined && (!Number.isFinite(limit) || limit < 0)) {
      setFormError(t('customers.limitInvalid'));
      return;
    }

    setFormError(null);
    setSaving(true);
    try {
      const created = await createCustomer({
        name: name.trim(),
        phone: phone.trim(),
        upiId: upiId.trim() || undefined,
        creditLimit: limit,
      });
      onSaved(created);
    } catch (err) {
      setFormError(err instanceof ApiError && err.code === 'OFFLINE' ? t('networkError') : t('customers.saveError'));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-customer-title"
        className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-customer-title" className="mb-4 text-lg font-bold text-[#1E1B4B]">
          {t('customers.addTitle')}
        </h2>

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <Field
              id="cust-name"
              label={t('customers.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
            {errors.name && <p role="alert" className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <Field
              id="cust-phone"
              label={t('customers.phone')}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="off"
            />
            {errors.phone && <p role="alert" className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>

          <Field
            id="cust-upi"
            label={t('customers.upiId')}
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            autoComplete="off"
          />

          <Field
            id="cust-limit"
            label={t('customers.creditLimit')}
            type="number"
            inputMode="decimal"
            min={0}
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
          />

          {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}

          <div className="mt-2 flex flex-col gap-2">
            <button type="submit" disabled={saving} className={primaryClass}>
              {saving ? t('customers.saving') : t('customers.save')}
            </button>
            <button type="button" onClick={onClose} className={linkClass}>
              {t('customers.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
