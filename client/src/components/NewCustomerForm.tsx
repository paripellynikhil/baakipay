import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Field, primaryClass, linkClass } from './FormControls';
import { useI18n } from '../i18n/I18n';
import { ApiError } from '../lib/api';
import { createCustomer, type Customer } from '../lib/customersApi';

interface NewCustomerFormProps {
  initialName?: string;
  onCreated: (customer: Customer) => void;
  onCancel: () => void;
}

// Inline mini-form: name is required; phone and credit limit are optional.
// Rendered inside the invoice drawer's <form>, so it is a <div> and never submits:
// Save is a type="button" click handler and Enter in any input is swallowed.
export function NewCustomerForm({ initialName = '', onCreated, onCancel }: NewCustomerFormProps) {
  const { t } = useI18n();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState('');
  const [limit, setLimit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving) return;
    setError(null);
    const trimmedName = name.trim();
    const limitText = limit.trim();
    const creditLimit = limitText === '' ? undefined : Number(limitText);
    if (!trimmedName) {
      setError(t('customers.nameRequired'));
      return;
    }
    if (creditLimit !== undefined && !(creditLimit > 0)) {
      setError(t('customers.limitInvalid'));
      return;
    }

    setSaving(true);
    try {
      const created = await createCustomer({ name: trimmedName, phone: phone.trim(), creditLimit });
      onCreated(created);
    } catch (err) {
      setSaving(false);
      if (err instanceof ApiError && err.code === 'OFFLINE') setError(t('networkError'));
      else if (err instanceof ApiError && err.code !== 'HTTP_ERROR') setError(err.code);
      else setError(t('customers.saveError'));
    }
  }

  function handleSaveClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    void handleSave();
  }

  function handleEnter(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    e.stopPropagation();
    void handleSave();
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] p-3">
      <h4 className="text-sm font-bold text-[#1E1B4B]">{t('customers.addTitle')}</h4>
      <Field
        id="newc-name"
        label={t('customers.name')}
        value={name}
        autoFocus
        autoComplete="off"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleEnter}
      />
      <Field
        id="newc-phone"
        label={t('customers.phone')}
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onKeyDown={handleEnter}
      />
      <Field
        id="newc-limit"
        label={t('customers.creditLimit')}
        type="number"
        inputMode="decimal"
        min={0}
        value={limit}
        onChange={(e) => setLimit(e.target.value)}
        onKeyDown={handleEnter}
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={handleSaveClick} disabled={saving} className={primaryClass}>
          {saving ? t('customers.saving') : t('customers.save')}
        </button>
        <button type="button" onClick={onCancel} className={linkClass}>
          {t('customers.cancel')}
        </button>
      </div>
    </div>
  );
}
