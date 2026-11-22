import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Field, primaryClass, linkClass } from './FormControls';
import { LineItemsEditor, newRow, type LineRow } from './LineItemsEditor';
import { CustomerSelect } from './CustomerSelect';
import { InvoiceTotals } from './InvoiceTotals';
import { Toast } from './Toast';
import { useI18n } from '../i18n/I18n';
import { ApiError } from '../lib/api';
import { getCustomers, type Customer } from '../lib/customersApi';
import { getProfile } from '../lib/shopApi';
import { createInvoice, type Invoice, type InvoiceInput } from '../lib/invoicesApi';
import {
  dateAfterDays,
  grandTotalOf,
  nearCreditLimit,
  rememberItemNames,
  subtotalOf,
  toNum,
  type LineValues,
} from '../lib/invoiceMath';

interface InvoiceDrawerProps {
  shopId: string;
  customer: Customer | null;
  onClose: () => void;
  onCreated: (invoice: Invoice) => void;
}

export default function InvoiceDrawer({ shopId, customer, onClose, onCreated }: InvoiceDrawerProps) {
  const { t } = useI18n();
  const [customers, setCustomers] = useState<Customer[]>(customer ? [customer] : []);
  const [customerId, setCustomerId] = useState(customer?.id ?? '');
  const [dueDate, setDueDate] = useState(() => dateAfterDays(0));
  const dueTouched = useRef(false);
  const [rows, setRows] = useState<LineRow[]>([newRow(1)]);
  const nextId = useRef(2);
  const [invoiceDiscount, setInvoiceDiscount] = useState('0');
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [upgradeNeeded, setUpgradeNeeded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  // Load the customer list and the shop's default due days once on mount.
  useEffect(() => {
    let active = true;
    getCustomers()
      .then((res) => {
        if (active && res.data.length > 0) setCustomers(res.data);
      })
      .catch(() => undefined);
    getProfile()
      .then((res) => {
        if (active && !dueTouched.current) setDueDate(dateAfterDays(res.data.shop.default_due_days ?? 0));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const selected = customers.find((c) => c.id === customerId) ?? null;
  const lines: LineValues[] = rows.map((r) => ({
    name: r.name.trim(),
    qty: toNum(r.qty),
    unitPrice: toNum(r.unitPrice),
    discount: toNum(r.discount),
  }));
  const namedLines = lines.filter((l) => l.name);
  const subtotal = subtotalOf(namedLines);
  const grandTotal = grandTotalOf(subtotal, toNum(invoiceDiscount));
  const warn = selected !== null && nearCreditLimit(toNum(selected.totalOwed), toNum(selected.creditLimit), grandTotal);

  function addRow(patch?: Partial<LineRow>) {
    const id = nextId.current++;
    setRows((prev) => [...prev, { ...newRow(id), ...patch }]);
  }

  function validate(): boolean {
    const badQty = namedLines.some((l) => !(l.qty > 0));
    const badPrice = namedLines.some((l) => !(l.unitPrice >= 0));
    const badDiscount = namedLines.some((l) => !(l.discount >= 0)) || toNum(invoiceDiscount) < 0;
    setCustomerError(customerId ? null : t('invoices.errCustomer'));
    if (namedLines.length === 0) setItemError(t('invoices.errItemName'));
    else if (badQty) setItemError(t('invoices.errQty'));
    else if (badPrice) setItemError(t('invoices.errUnitPrice'));
    else if (badDiscount) setItemError(t('invoices.errDiscount'));
    else setItemError(null);
    return customerId !== '' && namedLines.length > 0 && !badQty && !badPrice && !badDiscount;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setUpgradeNeeded(false);
    if (!validate()) return;

    const input: InvoiceInput = {
      customerId,
      items: namedLines.map((l) => ({ name: l.name, qty: l.qty, unitPrice: l.unitPrice, discount: l.discount })),
      discount: toNum(invoiceDiscount),
      dueDate: dueDate || undefined,
    };

    setSaving(true);
    try {
      const invoice = await createInvoice(input);
      rememberItemNames(shopId, namedLines.map((l) => l.name));
      onCreated(invoice);
    } catch (err) {
      setSaving(false);
      if (err instanceof ApiError && err.status === 403 && err.code === 'INVOICE_LIMIT_REACHED') {
        setUpgradeNeeded(true);
      } else {
        setFormError(err instanceof ApiError && err.code === 'OFFLINE' ? t('networkError') : t('invoices.saveError'));
      }
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-drawer-title"
        className="flex h-full w-full max-w-md flex-col bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] p-4">
          <h2 id="invoice-drawer-title" className="text-lg font-bold text-[#1E1B4B]">
            {t('invoices.title')}
          </h2>
          <button type="button" onClick={onClose} className={linkClass} aria-label={t('invoices.close')}>
            ✕
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {upgradeNeeded && (
            <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              {t('invoices.upgradeBanner')}
            </div>
          )}

          <CustomerSelect
            customers={customers}
            value={customerId}
            error={customerError}
            onChange={setCustomerId}
            onAdded={(c) => { setCustomers((prev) => [...prev, c]); setToast(t('customers.added')); }}
          />

          <Field
            id="inv-due"
            label={t('invoices.dueDate')}
            type="date"
            value={dueDate}
            onChange={(e) => {
              dueTouched.current = true;
              setDueDate(e.target.value);
            }}
          />

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-[#1E1B4B]">{t('invoices.items')}</h3>
            <LineItemsEditor shopId={shopId} rows={rows} onChange={setRows} onAddRow={addRow} />
            {itemError && <p role="alert" className="text-sm text-red-600">{itemError}</p>}
          </div>

          <Field
            id="inv-discount"
            label={t('invoices.invoiceDiscount')}
            type="number"
            inputMode="decimal"
            min={0}
            value={invoiceDiscount}
            onChange={(e) => setInvoiceDiscount(e.target.value)}
          />

          <InvoiceTotals subtotal={subtotal} grandTotal={grandTotal} creditWarning={warn} />

          {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}

          <div className="mt-auto flex flex-col gap-2 pt-2">
            <button type="submit" disabled={saving} className={primaryClass}>
              {saving ? t('invoices.saving') : t('invoices.save')}
            </button>
            <button type="button" onClick={onClose} className={linkClass}>
              {t('invoices.cancel')}
            </button>
          </div>
        </form>
        <Toast message={toast} onDone={clearToast} />
      </div>
    </div>
  );
}
