import { apiFetch, cachedGet } from './api';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  upiId: string | null;
  creditLimit: string | number;
  totalOwed: string | number;
  maxDaysOverdue: number;
  nearLimit: boolean;
  remindedToday: boolean;
}

export interface CustomerInput {
  name: string;
  phone: string;
  upiId?: string;
  creditLimit?: number;
}

// Cached under 'baakipay_<shopId>_customers' so the list works offline.
export function getCustomers(): Promise<{ offline: boolean; data: Customer[] }> {
  return cachedGet<Customer[]>('customers', '/api/customers');
}

export function createCustomer(input: CustomerInput): Promise<Customer> {
  return apiFetch<Customer>('/api/customers', { method: 'POST', body: input });
}
