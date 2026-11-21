import { apiFetch, cachedGet, readCache } from './api';

export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'unpaid';
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ExpenseInput {
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  notes?: string;
}

// Cached under 'baakipay_<shopId>_expenses' so the list works offline.
export function listExpenses(): Promise<{ offline: boolean; data: Expense[] }> {
  return cachedGet<Expense[]>('expenses', '/api/expenses');
}

// Last saved list, read synchronously so the screen can paint before the network call.
export function readCachedExpenses(): Expense[] | null {
  return readCache<Expense[]>('expenses');
}

export function createExpense(input: ExpenseInput): Promise<Expense> {
  return apiFetch<Expense>('/api/expenses', { method: 'POST', body: input });
}

export function markPaid(id: string): Promise<Expense> {
  return apiFetch<Expense>(`/api/expenses/${id}/pay`, { method: 'PATCH' });
}

export function removeExpense(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/api/expenses/${id}`, { method: 'DELETE' });
}
