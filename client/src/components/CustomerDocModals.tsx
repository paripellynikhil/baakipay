import InvoiceProofModal from './InvoiceProofModal';
import { GotMoneyModal } from './GotMoneyModal';
import { CustomerStatementModal } from './CustomerStatementModal';
import type { CustomerDocs } from '../lib/useCustomerDocs';

interface CustomerDocModalsProps {
  docs: CustomerDocs;
  onPaid: (message: string) => void;
}

// Renders whichever customer document modal is open (Got Money, invoice proof, statement).
export function CustomerDocModals({ docs, onPaid }: CustomerDocModalsProps) {
  const { paying, setPaying, proof, setProof, statement, setStatement } = docs;
  return (
    <>
      {paying && (
        <GotMoneyModal
          customer={{ id: paying.customer.id, name: paying.customer.name }}
          invoices={paying.invoices}
          onClose={() => setPaying(null)}
          onPaid={onPaid}
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
      {statement && (
        <CustomerStatementModal customer={statement.customer} shop={statement.shop} onClose={() => setStatement(null)} />
      )}
    </>
  );
}
