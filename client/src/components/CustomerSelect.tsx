import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { inputClass } from './FormControls';
import { NewCustomerForm } from './NewCustomerForm';
import { useI18n } from '../i18n/I18n';
import type { Customer } from '../lib/customersApi';

interface CustomerSelectProps {
  customers: Customer[];
  value: string;
  error: string | null;
  onChange: (id: string) => void;
  onAdded?: (customer: Customer) => void;
}

// Searchable combobox: type or click to filter customers by name or phone.
// Option 0 is always "+ Add New Customer"; options 1..n are the matching customers.
export function CustomerSelect({ customers, value, error, onChange, onAdded }: CustomerSelectProps) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState('');

  const selected = customers.find((c) => c.id === value) ?? null;
  const q = query.trim().toLowerCase();
  const matches = q
    ? customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q))
    : customers;
  const optionCount = matches.length + 1;

  // Close the list when the user clicks or taps anywhere outside this control.
  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  function openList() {
    setOpen(true);
    setActive(0);
  }

  function closeList() {
    setOpen(false);
    setQuery('');
  }

  function pickCustomer(c: Customer) {
    onChange(c.id);
    setAdding(false);
    closeList();
  }

  function pickAddNew() {
    setAddName(query.trim());
    setAdding(true);
    closeList();
  }

  function choose(index: number) {
    if (index === 0) {
      pickAddNew();
      return;
    }
    const c = matches[index - 1];
    if (c) pickCustomer(c);
  }

  function handleCreated(customer: Customer) {
    onAdded?.(customer);
    onChange(customer.id);
    setAdding(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) openList();
      else setActive((a) => Math.min(a + 1, optionCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      // Never let Enter submit the surrounding invoice form.
      e.preventDefault();
      if (open) choose(active);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      closeList();
    }
  }

  const optionClass = (i: number) =>
    `flex min-h-[44px] w-full flex-col items-start px-3 py-2 text-left text-sm ${
      active === i ? 'bg-[#EEF2FF]' : 'hover:bg-[#F8FAFC]'
    }`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="inv-customer" className="text-sm font-semibold text-[#1E1B4B]">
        {t('invoices.customer')}
      </label>
      <div ref={rootRef} className="relative">
        <input
          id="inv-customer"
          type="text"
          role="combobox"
          autoComplete="off"
          className={inputClass}
          value={open ? query : (selected?.name ?? '')}
          placeholder={open ? t('customers.searchPlaceholder') : t('invoices.selectCustomer')}
          aria-expanded={open}
          aria-controls="inv-customer-list"
          aria-autocomplete="list"
          aria-activedescendant={open ? `inv-customer-opt-${active}` : undefined}
          onClick={() => {
            if (!open) openList();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={handleKeyDown}
        />
        {open && (
          <ul
            id="inv-customer-list"
            role="listbox"
            className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[#E2E8F0] bg-white shadow-md"
          >
            <li role="presentation">
              <button
                id="inv-customer-opt-0"
                type="button"
                role="option"
                aria-selected={active === 0}
                onClick={() => choose(0)}
                className={`${optionClass(0)} font-semibold text-[#1E1B4B]`}
              >
                {t('customers.addNewOption')}
              </button>
            </li>
            {matches.map((c, i) => (
              <li key={c.id} role="presentation">
                <button
                  id={`inv-customer-opt-${i + 1}`}
                  type="button"
                  role="option"
                  aria-selected={active === i + 1}
                  onClick={() => choose(i + 1)}
                  className={optionClass(i + 1)}
                >
                  <span className="font-medium text-[#1E1B4B]">{c.name}</span>
                  {c.phone && <span className="text-xs text-[#64748B]">{c.phone}</span>}
                </button>
              </li>
            ))}
            {matches.length === 0 && q && (
              <li role="presentation" className="px-3 py-2 text-sm text-[#64748B]">
                {t('customers.noMatches')}
              </li>
            )}
          </ul>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {adding && <NewCustomerForm initialName={addName} onCreated={handleCreated} onCancel={() => setAdding(false)} />}
    </div>
  );
}
