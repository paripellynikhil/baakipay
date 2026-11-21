import { describe, it, expect } from 'vitest';
import forecastEngine from '../lib/forecastEngine.js';

const { buildForecast } = forecastEngine;

const TODAY = '2025-06-01';

// Shared fixture: cash 1000; customer cA owes 2000 (due day 9);
// cB owes 400 remaining (due day 4); rent 300 unpaid due day 2.
const SHOP = { cash_in_hand: 1000 };
const INVOICES = [
  { id: 'i1', customer_id: 'cA', total_amount: 2000, paid_amount: 0, status: 'UNPAID', due_date: '2025-06-10' },
  { id: 'i2', customer_id: 'cB', total_amount: 500, paid_amount: 100, status: 'PARTIAL', due_date: '2025-06-05' },
];
const EXPENSES = [{ id: 'e1', title: 'Rent', amount: 300, is_paid: false, due_date: '2025-06-03' }];

// Six customers with descending balances, due on days 9..14.
const SIX_CUSTOMERS = [1000, 900, 800, 700, 600, 500].map((amt, idx) => ({
  id: `i${idx + 1}`,
  customer_id: `c${idx + 1}`,
  total_amount: amt,
  paid_amount: 0,
  status: 'UNPAID',
  due_date: `2025-06-${String(10 + idx).padStart(2, '0')}`,
}));

describe('buildForecast baseline math', () => {
  it('computes exact daily balances, lowest point and summary (pro, 30 days)', () => {
    const f = buildForecast({
      shop: SHOP, invoices: INVOICES, expenses: EXPENSES,
      days: 30, effectivePlan: 'pro', today: TODAY,
    });
    expect(f.points).toHaveLength(30);
    expect(f.points[0]).toEqual({ date: '2025-06-01', day: 0, balance: 1000, inflow: 0, outflow: 0 });
    expect(f.points[2].balance).toBe(700);
    expect(f.points[2].outflow).toBe(300);
    expect(f.points[4].balance).toBe(1100);
    expect(f.points[4].inflow).toBe(400);
    expect(f.points[9].balance).toBe(3100);
    expect(f.lowestBalance).toBe(700);
    expect(f.lowestDate).toBe('2025-06-03');
    expect(f.hasCashGap).toBe(false);
    expect(f.summary).toEqual({ totalInflow: 2400, totalOutflow: 300, endingBalance: 3100, unpaidExpenseCount: 1 });
    expect(f.noExpenses).toBe(false);
    expect(f.whatIfAvailable).toBe(true);
    expect(f.simulated).not.toBeNull();
  });

  it('places overdue open invoices on today+3', () => {
    const f = buildForecast({
      shop: { cash_in_hand: 0 },
      invoices: [{ id: 'o1', customer_id: 'cX', total_amount: 300, paid_amount: 100, status: 'PARTIAL', due_date: '2025-05-20' }],
      expenses: [], days: 30, effectivePlan: 'pro', today: TODAY,
    });
    expect(f.points[2].inflow).toBe(0);
    expect(f.points[3].date).toBe('2025-06-04');
    expect(f.points[3].inflow).toBe(200);
    expect(f.summary.totalInflow).toBe(200);
  });

  it('reports noExpenses and zero unpaidExpenseCount when there are no unpaid expenses', () => {
    const f = buildForecast({
      shop: SHOP, invoices: INVOICES, expenses: [], days: 30, effectivePlan: 'pro', today: TODAY,
    });
    expect(f.noExpenses).toBe(true);
    expect(f.summary.unpaidExpenseCount).toBe(0);
  });

  it('flags a cash gap when the balance goes negative', () => {
    const f = buildForecast({
      shop: SHOP,
      invoices: [],
      expenses: [{ id: 'e2', amount: 5000, is_paid: false, due_date: '2025-06-02' }],
      days: 30, effectivePlan: 'pro', today: TODAY,
    });
    expect(f.lowestBalance).toBe(-4000);
    expect(f.lowestDate).toBe('2025-06-02');
    expect(f.hasCashGap).toBe(true);
  });
});

describe('buildForecast plan clamp', () => {
  it('free clamps days to 7 points, disables what-if and ignores toggles', () => {
    const f = buildForecast({
      shop: SHOP, invoices: INVOICES, expenses: EXPENSES,
      days: 30, delayTop: true, badDay5: true, extraCredit15k: true,
      effectivePlan: 'free', today: TODAY,
    });
    expect(f.points).toHaveLength(7);
    expect(f.days).toBe(7);
    expect(f.whatIfAvailable).toBe(false);
    expect(f.simulated).toBeNull();
    expect(f.points[4].balance).toBe(1100);
  });

  it('trial allows 60 days', () => {
    const f = buildForecast({
      shop: SHOP, invoices: INVOICES, expenses: EXPENSES,
      days: 60, effectivePlan: 'trial', today: TODAY,
    });
    expect(f.points).toHaveLength(60);
    expect(f.whatIfAvailable).toBe(true);
  });

  it('pro allows 90 days and defaults an invalid day count to 30', () => {
    const ninety = buildForecast({ shop: SHOP, invoices: [], expenses: [], days: 90, effectivePlan: 'pro', today: TODAY });
    expect(ninety.points).toHaveLength(90);
    const invalid = buildForecast({ shop: SHOP, invoices: [], expenses: [], days: 45, effectivePlan: 'pro', today: TODAY });
    expect(invalid.points).toHaveLength(30);
  });
});

describe('buildForecast what-if toggles', () => {
  it('delayTop moves the top customer inflow from day 9 to day 24', () => {
    const f = buildForecast({
      shop: SHOP, invoices: INVOICES, expenses: EXPENSES,
      days: 30, delayTop: true, effectivePlan: 'pro', today: TODAY,
    });
    expect(f.points[9].inflow).toBe(2000);
    const sim = f.simulated;
    expect(sim.points[9].inflow).toBe(0);
    expect(sim.points[9].balance).toBe(1100);
    expect(sim.points[24].inflow).toBe(2000);
    expect(sim.points[24].balance).toBe(3100);
    expect(sim.points[4].inflow).toBe(400);
  });

  it('badDay5 shifts the top five customers by 15 days and leaves the sixth alone', () => {
    const f = buildForecast({
      shop: { cash_in_hand: 0 }, invoices: SIX_CUSTOMERS, expenses: [],
      days: 60, badDay5: true, effectivePlan: 'pro', today: TODAY,
    });
    expect(f.points[9].inflow).toBe(1000);
    expect(f.noExpenses).toBe(true);
    const sim = f.simulated;
    expect(sim.points[9].inflow).toBe(0);
    expect(sim.points[24].inflow).toBe(1000);
    expect(sim.points[28].inflow).toBe(600);
    expect(sim.points[14].inflow).toBe(500);
    expect(sim.summary.totalInflow).toBe(4500);
  });

  it('extraCredit15k subtracts 15000 on day 0 and repays it on day 35 (horizon 60)', () => {
    const f = buildForecast({
      shop: SHOP, invoices: [], expenses: [],
      days: 60, extraCredit15k: true, effectivePlan: 'pro', today: TODAY,
    });
    expect(f.points[0].balance).toBe(1000);
    const sim = f.simulated;
    expect(sim.points[0].balance).toBe(-14000);
    expect(sim.points[0].outflow).toBe(15000);
    expect(sim.points[34].balance).toBe(-14000);
    expect(sim.points[35].inflow).toBe(15000);
    expect(sim.points[35].balance).toBe(1000);
    expect(sim.lowestBalance).toBe(-14000);
    expect(sim.lowestDate).toBe('2025-06-01');
    expect(sim.hasCashGap).toBe(true);
  });

  it('simulated equals baseline when no toggle is on', () => {
    const f = buildForecast({
      shop: SHOP, invoices: INVOICES, expenses: EXPENSES,
      days: 30, effectivePlan: 'pro', today: TODAY,
    });
    expect(f.simulated.points).toEqual(f.points);
    expect(f.simulated.lowestBalance).toBe(f.lowestBalance);
  });
});
