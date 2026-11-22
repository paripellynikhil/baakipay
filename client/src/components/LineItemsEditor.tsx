import { useRef, useState } from 'react';
import { inputClass, linkClass } from './FormControls';
import { useI18n } from '../i18n/I18n';
import { readItemNames } from '../lib/invoiceMath';
import { parseVoiceLine } from './voiceLineParser';
import { getRecognizerCtor, useVoiceLine } from './useVoiceLine';

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
  onAddRow: (patch?: Partial<LineRow>) => void;
}

const MIC_IDLE = '#F59E0B';
const MIC_ACTIVE = '#DC2626';

export function LineItemsEditor({ shopId, rows, onChange, onAddRow }: LineItemsEditorProps) {
  const { t } = useI18n();
  const [itemNames] = useState<string[]>(() => readItemNames(shopId));
  const [voiceMsg, setVoiceMsg] = useState<string | null>(null);
  const [voiceRowId, setVoiceRowId] = useState<number | null>(null);
  const voiceRowRef = useRef<number | null>(null);
  const voiceSupported = getRecognizerCtor() !== null;
  const voice = useVoiceLine(
    (text) => {
      const line = parseVoiceLine(text);
      const id = voiceRowRef.current;
      if (line && id !== null) {
        setVoiceMsg(null);
        update(id, line);
      } else {
        setVoiceMsg(t('voice.notUnderstood'));
      }
    },
    (code) => {
      const denied = code === 'not-allowed' || code === 'service-not-allowed';
      setVoiceMsg(denied ? t('voice.micDenied') : t('voice.error'));
    },
  );

  function update(id: number, patch: Partial<LineRow>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function remove(id: number) {
    onChange(rows.filter((r) => r.id !== id));
  }

  // Dictation fills the row whose mic was pressed.
  function speakInto(id: number) {
    voiceRowRef.current = id;
    setVoiceRowId(id);
    voice.toggle();
  }

  return (
    <div className="flex flex-col gap-3">
      <datalist id="items-datalist">
        {itemNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {rows.map((row, index) => {
        const micActive = voice.listening && voiceRowId === row.id;
        return (
          <div key={row.id} className="flex flex-col gap-2 rounded-xl border border-[#E2E8F0] p-3">
            <div className="relative">
              <input
                aria-label={`${t('invoices.itemName')} ${index + 1}`}
                list="items-datalist"
                placeholder={t('invoices.itemName')}
                value={row.name}
                onChange={(e) => update(row.id, { name: e.target.value })}
                autoComplete="off"
                className={inputClass}
                style={voiceSupported ? { paddingRight: '2.5rem' } : undefined}
              />
              {voiceSupported && (
                <button
                  type="button"
                  onClick={() => speakInto(row.id)}
                  aria-label={t('voice.start')}
                  aria-pressed={micActive}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 ${micActive ? 'animate-pulse' : ''}`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ color: micActive ? MIC_ACTIVE : MIC_IDLE }}
                  >
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                  </svg>
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex flex-col gap-1 text-xs text-[#64748B]">
                {t('items.qtyLabel')}
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
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#64748B]">
                {t('items.unitPriceLabel')}
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
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#64748B]">
                {t('items.discountLabel')}
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
              </label>
            </div>
            {rows.length > 1 && (
              <button type="button" onClick={() => remove(row.id)} className={`${linkClass} self-end text-red-600`}>
                {t('invoices.removeItem')}
              </button>
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={() => onAddRow()} className={linkClass}>
          {t('invoices.addItem')}
        </button>
      </div>
      {voice.listening && (
        <p role="status" className="text-sm text-[#1E1B4B]">
          {t('voice.listening')}
        </p>
      )}
      {voiceMsg && <p role="alert" className="text-sm text-red-600">{voiceMsg}</p>}
    </div>
  );
}
