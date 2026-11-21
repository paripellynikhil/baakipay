import { apiFetch } from './api';

export interface InvoiceItemInput {
  name: string;
  qty: number;
  unitPrice: number;
  discount: number;
}

export interface InvoiceInput {
  customerId: string;
  items: InvoiceItemInput[];
  discount?: number;
  dueDate?: string;
}

export interface Invoice {
  id: string;
  invoiceCode: string;
  customerId: string;
  customerName: string;
  items: InvoiceItemInput[];
  subtotal: string | number;
  discount: string | number;
  totalAmount: string | number;
  paidAmount: string | number;
  dueDate: string | null;
  status: string;
  lastRemindedAt: string | null;
  recordHash: string;
  createdAt: string;
}

export function createInvoice(input: InvoiceInput): Promise<Invoice> {
  return apiFetch<Invoice>('/api/invoices', { method: 'POST', body: input });
}

export function listInvoices(): Promise<Invoice[]> {
  return apiFetch<Invoice[]>('/api/invoices');
}


export interface RemindResult {
  id: string;
  lastRemindedAt: string;
}

export function remindInvoice(id: string): Promise<RemindResult> {
  return apiFetch<RemindResult>(`/api/invoices/${encodeURIComponent(id)}/remind`, { method: 'POST' });
}
