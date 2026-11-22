import { getCustomers } from './customersApi';
import { buildCsv, downloadCsv, type CsvCell } from './exportCsv';
import { listExpenses } from './expensesApi';
import { listInvoices } from './invoicesApi';

// One CSV file with a titled section per dataset: customers, invoices, expenses.
export async function downloadShopBackup(): Promise<void> {
  const [customers, invoices, expenses] = await Promise.all([getCustomers(), listInvoices(), listExpenses()]);
  const rows: CsvCell[][] = [
    ['Customers'],
    ['id', 'name', 'phone', 'upi_id', 'credit_limit', 'total_owed', 'max_days_overdue'],
    ...customers.data.map((c) => [c.id, c.name, c.phone, c.upiId, c.creditLimit, c.totalOwed, c.maxDaysOverdue]),
    [],
    ['Invoices'],
    ['id', 'invoice_code', 'customer_name', 'total_amount', 'paid_amount', 'due_date', 'status', 'created_at'],
    ...invoices.map((i) => [i.id, i.invoiceCode, i.customerName, i.totalAmount, i.paidAmount, i.dueDate, i.status, i.createdAt]),
    [],
    ['Expenses'],
    ['id', 'name', 'category', 'amount', 'due_date', 'status', 'paid_at', 'notes', 'created_at'],
    ...expenses.data.map((e) => [e.id, e.name, e.category, e.amount, e.dueDate, e.status, e.paidAt, e.notes, e.createdAt]),
  ];
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsv(`baakipay-backup-${stamp}.csv`, buildCsv(rows));
}
