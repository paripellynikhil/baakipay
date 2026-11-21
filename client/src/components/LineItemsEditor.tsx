import { useState } from 'react';
import { inputClass, linkClass } from './FormControls';
import { useI18n } from '../i18n/I18n';
import { readItemNames } from '../lib/invoiceMath';

// String fields keep in-progress typing ("0.", "") intact until validation.
export interface LineRow {
  id: number;
  name: string;
  qty: string;
  unitPrice: string;
  discount: string;
}

export function newRow(id: number): LineRow {
  return { id, name: '', qty: '1', unitPrice: '0', discount: '0' };
}

interface LineItemsEditorProps {
  shopId: string;
  rows: LineRow[];
  onChange: (rows: LineRow[]) => void;
  onAddRow: () => void;
}

export function LineItemsEditor({ shopId, rows, onChange, onAddRow }: LineItemsEditorProps) {
  const { t } = useI18n();
  const [itemNames] = useState<string[]>(() => readItemNames(shopId));

  function update(id: number, patch: Partial<LineRow>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function remove(id: number) {
    onChange(rows.filter((r) => r.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      <datalist id="items-datalist">
        {itemNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {rows.map((row, index) => (
        <div key={row.id} className="flex flex-col gap-2 rounded-xl border border-[#E2E8F0] p-3">
          <input
            aria-label={`${t('invoices.itemName')} ${index + 1}`}
            list="items-datalist"
            placeholder={t('invoices.itemName')}
            value={row.name}
            onChange={(e) => update(row.id, { name: e.target.value })}
            autoComplete="off"
            className={inputClass}
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              aria-label={`${t('invoices.qty')} ${index + 1}`}
              type="number"
              inputMode="decimal"
              min={0}
              placeholder={t('invoices.qty')}
              value={row.qty}
              onChange={(e) => update(row.id, { qty: e.target.value })}
              className={inputClass}
            />
            <input
              aria-label={`${t('invoices.unitPrice')} ${index + 1}`}
              type="number"
              inputMode="decimal"
              min={0}
              placeholder={t('invoices.unitPrice')}
              value={row.unitPrice}
              onChange={(e) => update(row.id, { unitPrice: e.target.value })}
              className={inputClass}
            />
            <input
              aria-label={`${t('invoices.discount')} ${index + 1}`}
              type="number"
              inputMode="decimal"
              min={0}
              placeholder={t('invoices.discount')}
              value={row.discount}
              onChange={(e) => update(row.id, { discount: e.target.value })}
              className={inputClass}
            />
          </div>
          {rows.length > 1 && (
            <button type="button" onClick={() => remove(row.id)} className={`${linkClass} self-end text-red-600`}>
              {t('invoices.removeItem')}
            </button>
          )}
        </div>
      ))}

      <button type="button" onClick={onAddRow} className={linkClass}>
        {t('invoices.addItem')}
      </button>
    </div>
  );
}
