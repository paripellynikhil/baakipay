import { CACHE_PREFIX } from './api';

// Money helpers shared by InvoiceDrawer and InvoiceProofModal.
export const ITEM_CACHE_LIMIT = 100;
export const CREDIT_WARN_RATIO = 0.8;

export interface LineValues {
  name: string;
  qty: number;
  unitPrice: number;
  discount: number;
}

export function toNum(v: string | number | null | undefined): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatRupees(n: number): string {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function lineAmount(l: LineValues): number {
  return round2(l.qty * l.unitPrice - l.discount);
}

export function subtotalOf(lines: LineValues[]): number {
  return round2(lines.reduce((sum, l) => sum + lineAmount(l), 0));
}

export function grandTotalOf(subtotal: number, invoiceDiscount: number): number {
  return Math.max(0, round2(subtotal - invoiceDiscount));
}

export function balanceDueOf(totalAmount: number, paidAmount: number): number {
  return Math.max(0, round2(totalAmount - paidAmount));
}

// BR-003 early warning: projected owed at or above 80% of the credit limit.
export function nearCreditLimit(totalOwed: number, creditLimit: number, grandTotal: number): boolean {
  return creditLimit > 0 && totalOwed + grandTotal >= CREDIT_WARN_RATIO * creditLimit;
}

// YYYY-MM-DD in local time, offset by whole days from today.
export function dateAfterDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// ---- Item-name autocomplete cache: 'baakipay_<shopId>_items' (JSON string array) ----

function itemsKey(shopId: string): string {
  return `${CACHE_PREFIX}${shopId}_items`;
}

export function readItemNames(shopId: string): string[] {
  try {
    const raw = localStorage.getItem(itemsKey(shopId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

// Newest names first, deduped case-insensitively, capped at ITEM_CACHE_LIMIT.
export function rememberItemNames(shopId: string, names: string[]): void {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const raw of [...names, ...readItemNames(shopId)]) {
    const name = raw.trim();
    const lower = name.toLowerCase();
    if (!name || seen.has(lower)) continue;
    seen.add(lower);
    merged.push(name);
  }
  try {
    localStorage.setItem(itemsKey(shopId), JSON.stringify(merged.slice(0, ITEM_CACHE_LIMIT)));
  } catch {
    // Cache write is best-effort.
  }
}
