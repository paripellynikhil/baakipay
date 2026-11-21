import { cachedGet } from './api';

// Mirrors the GET /api/analytics response built by server/routes/analytics.js.
export type AnalyticsMonth = { month: string; invoiced: number; collected: number };

export type OverdueCustomer = {
  customer_id: string | number;
  name: string;
  outstanding: number;
  maxDaysOverdue: number;
};

export type AnalyticsShop = {
  shop_name: string | null;
  owner_name: string | null;
  address: string | null;
  upi_id: string | null;
};

export type AnalyticsResponse = {
  months: AnalyticsMonth[];
  onTimeRate: number;
  avgDaysToCollect: number;
  totalOutstanding: number;
  topOverdue: OverdueCustomer[];
  smartTips: string[];
  summaryHash: string;
  generatedAt: string;
  shop: AnalyticsShop | null;
};

export type PeriodTotals = { invoiced: number; collected: number; rate: number };

// Totals over the last `count` entries of the (oldest-first) month series.
// rate = collected / invoiced as a percentage rounded to one decimal; 0 when nothing was invoiced.
export function periodTotals(months: AnalyticsMonth[], count: number): PeriodTotals {
  const slice = months.slice(-count);
  const invoiced = slice.reduce((sum, m) => sum + m.invoiced, 0);
  const collected = slice.reduce((sum, m) => sum + m.collected, 0);
  const rate = invoiced > 0 ? Math.round((collected / invoiced) * 1000) / 10 : 0;
  return { invoiced, collected, rate };
}

export function fetchAnalytics() {
  return cachedGet<AnalyticsResponse>('analytics', '/api/analytics');
}
