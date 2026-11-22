import { useCallback, useState } from 'react';
import type { ProofShop } from '../components/InvoiceProofModal';
import type { TranslationKey } from '../i18n/translations';
import type { Customer } from './customersApi';
import { getInvoiceByCode, listInvoices, type Invoice } from './invoicesApi';
import { getProfile } from './shopApi';

export interface PayingState {
  customer: Customer;
  invoices: { id: string; invoice_code: string; total: number; paid_amount: number; status: string }[];
}

export interface ProofState {
  invoice: Invoice;
  shop: ProofShop;
  customerName: string;
  customerPhone: string;
}

export interface StatementState {
  customer: Customer;
  shop: ProofShop;
}

// Shop identity + plan, as the proof/statement documents need them.
async function loadShop(): Promise<ProofShop> {
  const res = await getProfile();
  const s = res.data.shop;
  return { shop_name: s.shop_name, bio: s.bio, address: s.address, upi_id: s.upi_id, plan: res.data.effectivePlan };
}

// Document state for the Customers page: Got Money, clickable invoice pills and the statement.
export function useCustomerDocs(t: (key: TranslationKey) => string, notify: (msg: string) => void) {
  const [paying, setPaying] = useState<PayingState | null>(null);
  const [proof, setProof] = useState<ProofState | null>(null);
  const [statement, setStatement] = useState<StatementState | null>(null);

  const openGotMoney = useCallback(
    async (customer: Customer) => {
      try {
        const all = await listInvoices();
        const mine = all
          .filter((inv) => String(inv.customerId) === String(customer.id))
          .map((inv) => ({
            id: inv.id,
            invoice_code: inv.invoiceCode,
            total: Number(inv.totalAmount),
            paid_amount: Number(inv.paidAmount),
            status: inv.status.toLowerCase(),
          }));
        setPaying({ customer, invoices: mine });
      } catch {
        notify(t('gotMoney.error'));
      }
    },
    [t, notify],
  );

  const openInvoice = useCallback(
    async (customer: Customer, code: string) => {
      try {
        const [invoice, shop] = await Promise.all([getInvoiceByCode(code), loadShop()]);
        if (!invoice) {
          notify(t('statement.loadError'));
          return;
        }
        setProof({ invoice, shop, customerName: customer.name, customerPhone: customer.phone });
      } catch {
        notify(t('statement.loadError'));
      }
    },
    [t, notify],
  );

  const openStatement = useCallback(
    async (customer: Customer) => {
      try {
        setStatement({ customer, shop: await loadShop() });
      } catch {
        notify(t('networkError'));
      }
    },
    [t, notify],
  );

  return { paying, setPaying, proof, setProof, statement, setStatement, openGotMoney, openInvoice, openStatement };
}

export type CustomerDocs = ReturnType<typeof useCustomerDocs>;
