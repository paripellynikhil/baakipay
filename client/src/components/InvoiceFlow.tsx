import { useCallback, useEffect, useState } from 'react';
import Layout, { type TabId } from './Layout';
import InvoiceDrawer from './InvoiceDrawer';
import InvoiceProofModal, { type ProofShop } from './InvoiceProofModal';
import WhatsAppModal from './WhatsAppModal';
import HomePage from './HomePage';
import ForecastPage, { type ForecastView } from './ForecastPage';
import CustomersPage from '../pages/CustomersPage';
import ExpensesPage from '../pages/ExpensesPage';
import SettingsPage from './SettingsPage';
import { useI18n } from '../i18n/I18n';
import { getCustomers, type Customer } from '../lib/customersApi';
import { listInvoices, type Invoice } from '../lib/invoicesApi';
import { getProfile, type Shop } from '../lib/shopApi';

const NO_UNPAID_MSG = 'No unpaid bill for this customer';

interface InvoiceFlowProps {
  shop: Shop;
  offline: boolean;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  forecastView: ForecastView;
  onForecastViewChange: (view: ForecastView) => void;
  onLogout: () => void;
}

interface ProofState {
  invoice: Invoice;
  customerName: string;
  customerPhone: string;
  shop: ProofShop;
}

interface WhatsAppState {
  customer: Customer;
  invoice: Invoice;
}

export default function InvoiceFlow({
  shop,
  offline,
  activeTab,
  onTabChange,
  forecastView,
  onForecastViewChange,
  onLogout,
}: InvoiceFlowProps) {
  const { t } = useI18n();
  const shopName = shop.shop_name ?? t('appName');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCustomer, setDrawerCustomer] = useState<Customer | null>(null);
  const [proof, setProof] = useState<ProofState | null>(null);
  const [whatsapp, setWhatsapp] = useState<WhatsAppState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Auto-dismiss the red error notice.
  useEffect(() => {
    if (notice === null) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const clearNotice = useCallback(() => setNotice(null), []);

  function openDrawer(customer: Customer | null) {
    setDrawerCustomer(customer);
    setDrawerOpen(true);
  }

  // After an invoice is saved: close the drawer and open the proof with shop profile + customer details.
  async function handleCreated(invoice: Invoice) {
    setDrawerOpen(false);
    const [profile, customers] = await Promise.all([
      getProfile().catch(() => null),
      getCustomers().then((res) => res.data).catch(() => [] as Customer[]),
    ]);
    const s = profile?.data.shop ?? shop;
    setProof({
      invoice,
      customerName: invoice.customerName,
      customerPhone: customers.find((c) => c.id === invoice.customerId)?.phone ?? '',
      shop: {
        shop_name: s.shop_name,
        bio: s.bio,
        address: s.address,
        upi_id: s.upi_id,
        plan: profile?.data.effectivePlan ?? shop.plan,
      },
    });
  }

  // Pick the customer's newest unpaid invoice and open the reminder modal for it.
  async function handleWhatsApp(customer: Customer) {
    try {
      const invoices = await listInvoices();
      const unpaid = invoices
        .filter((inv) => inv.customerId === customer.id && inv.status !== 'PAID')
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
      if (!unpaid) {
        setNotice(NO_UNPAID_MSG);
        return;
      }
      setWhatsapp({ customer, invoice: unpaid });
    } catch {
      setNotice(t('networkError'));
    }
  }

  return (
    <>
      <Layout
        shopName={shopName}
        offline={offline}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onAddBill={() => openDrawer(null)}
        onLogout={onLogout}
        forecastView={forecastView}
        trialExpiresAt={shop.trial_expires_at}
      >
        {activeTab === 'home' ? (
          <HomePage shop={shop} onOpenForecast={() => onTabChange('future')} onOpenCustomers={() => onTabChange('customers')} />
        ) : activeTab === 'future' ? (
          <ForecastPage view={forecastView} onViewChange={onForecastViewChange} />
        ) : activeTab === 'customers' ? (
          <CustomersPage onAddBill={(c) => openDrawer(c)} onWhatsApp={(c) => void handleWhatsApp(c)} />
        ) : activeTab === 'bills' ? (
          <ExpensesPage />
        ) : (
          <SettingsPage shop={shop} onLogout={onLogout} />
        )}
      </Layout>

      {drawerOpen && (
        <InvoiceDrawer
          shopId={shop.id}
          customer={drawerCustomer}
          onClose={() => setDrawerOpen(false)}
          onCreated={(inv) => void handleCreated(inv)}
        />
      )}
      {proof && (
        <InvoiceProofModal
          invoice={proof.invoice}
          shop={proof.shop}
          customerName={proof.customerName}
          customerPhone={proof.customerPhone}
          onClose={() => setProof(null)}
        />
      )}
      {whatsapp && (
        <WhatsAppModal
          customer={whatsapp.customer}
          invoice={whatsapp.invoice}
          shopName={shopName}
          onClose={() => setWhatsapp(null)}
        />
      )}
      {notice && (
        <div
          role="alert"
          onClick={clearNotice}
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#DC2626] px-5 py-3 text-sm font-semibold text-white shadow-lg lg:bottom-6"
        >
          {notice}
        </div>
      )}
    </>
  );
}
