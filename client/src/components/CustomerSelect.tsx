import { inputClass } from './FormControls';
import { useI18n } from '../i18n/I18n';
import type { Customer } from '../lib/customersApi';

interface CustomerSelectProps {
  customers: Customer[];
  value: string;
  error: string | null;
  onChange: (id: string) => void;
}

export function CustomerSelect({ customers, value, error, onChange }: CustomerSelectProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="inv-customer" className="text-sm font-semibold text-[#1E1B4B]">
        {t('invoices.customer')}
      </label>
      <select id="inv-customer" className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t('invoices.selectCustomer')}</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
