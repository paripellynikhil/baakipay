import { cachedGet } from './api';

// Mirrors the GET /api/forecast response built by server/lib/forecastEngine.js.
// The baseline series is flattened at the top level; `simulated` is null unless whatIfAvailable.
export type ForecastPoint = { date: string; day: number; balance: number; inflow: number; outflow: number };

export type ForecastSummary = {
  totalInflow: number;
  totalOutflow: number;
  endingBalance: number;
  unpaidExpenseCount: number;
};

export type ForecastSeries = {
  points: ForecastPoint[];
  lowestBalance: number;
  lowestDate: string;
  hasCashGap: boolean;
  summary: ForecastSummary;
};

export type ForecastResponse = ForecastSeries & {
  effectivePlan: string;
  days: number;
  whatIfAvailable: boolean;
  startBalance: number;
  noExpenses: boolean;
  simulated: ForecastSeries | null;
};

export type ForecastParams = { days: number; delayTop?: boolean; badDay5?: boolean; extraCredit15k?: boolean };

// Only true toggles are sent; the server parses 'true' / '1' as on.
export function forecastPath(p: ForecastParams): string {
  const params = new URLSearchParams({ days: String(p.days) });
  if (p.delayTop) params.set('delayTop', 'true');
  if (p.badDay5) params.set('badDay5', 'true');
  if (p.extraCredit15k) params.set('extraCredit15k', 'true');
  return `/api/forecast?${params.toString()}`;
}

// Cache slot is per horizon; toggles share it (last successful response wins offline).
export function fetchForecast(p: ForecastParams) {
  return cachedGet<ForecastResponse>(`forecast_${p.days}`, forecastPath(p));
}
