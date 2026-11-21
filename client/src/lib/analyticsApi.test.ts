import { describe, expect, it } from 'vitest';
import { periodTotals, type AnalyticsMonth } from './analyticsApi';

const months: AnalyticsMonth[] = [
  { month: '2025-01', invoiced: 100, collected: 50 },
  { month: '2025-02', invoiced: 200, collected: 100 },
  { month: '2025-03', invoiced: 300, collected: 150 },
  { month: '2025-04', invoiced: 400, collected: 100 },
  { month: '2025-05', invoiced: 0, collected: 0 },
  { month: '2025-06', invoiced: 500, collected: 250 },
];

describe('periodTotals', () => {
  it('sums only the last N months', () => {
    expect(periodTotals(months, 3)).toEqual({ invoiced: 900, collected: 350, rate: 38.9 });
  });

  it('sums all six months when N is 6', () => {
    expect(periodTotals(months, 6)).toEqual({ invoiced: 1500, collected: 650, rate: 43.3 });
  });

  it('returns a zero rate when nothing was invoiced', () => {
    expect(periodTotals([{ month: '2025-01', invoiced: 0, collected: 0 }], 1)).toEqual({
      invoiced: 0,
      collected: 0,
      rate: 0,
    });
  });
});
