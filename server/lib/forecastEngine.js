'use strict';

/**
 * Pure cash-forecast engine. No DB access.
 *
 * Output shape (JSDoc summary):
 * {
 *   days: number,                 // horizon in days: points.length
 *   effectivePlan: 'free'|'pro'|'trial',
 *   whatIfAvailable: boolean,     // true only for pro/trial
 *   startBalance: number,         // shop.cash_in_hand
 *   points: [{ date: 'YYYY-MM-DD', day: number, balance, inflow, outflow }], // day 0 = today
 *   lowestBalance: number,
 *   lowestDate: 'YYYY-MM-DD',
 *   hasCashGap: boolean,          // lowestBalance < 0
 *   summary: { totalInflow, totalOutflow, endingBalance, unpaidExpenseCount },
 *   noExpenses: boolean,          // true when zero unpaid expenses
 *   simulated: null | { points, lowestBalance, lowestDate, hasCashGap, summary }
 * }
 * `points`/`lowest*`/`summary` are the BASELINE series. `simulated` is only
 * non-null when whatIfAvailable; it equals the baseline when no toggle is on.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const ALLOWED_DAYS = [7, 30, 60, 90];
const DEFAULT_DAYS = 30;
const FREE_DAYS = 7;
const OVERDUE_LAG_DAYS = 3;
const DELAY_DAYS = 15;
const BAD_DAY_CUSTOMER_COUNT = 5;
const EXTRA_CREDIT_AMOUNT = 15000;
const EXTRA_CREDIT_REPAY_DAY = 35;

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

// Accepts a Date (local calendar day) or 'YYYY-MM-DD' string; returns UTC-midnight ms.
function toMs(value) {
  if (value instanceof Date) {
    return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function isoOf(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function resolveDays(days, whatIfAvailable) {
  if (!whatIfAvailable) return FREE_DAYS;
  const n = Number(days);
  return ALLOWED_DAYS.includes(n) ? n : DEFAULT_DAYS;
}

function remainingOf(inv) {
  return round2(Number(inv.total_amount) - Number(inv.paid_amount || 0));
}

function openInvoices(invoices) {
  return (invoices || []).filter(
    (inv) => (inv.status === 'UNPAID' || inv.status === 'PARTIAL') && remainingOf(inv) > 0
  );
}

// Customer ids ordered by open balance (desc), ties broken by id for determinism.
function rankCustomers(open) {
  const totals = new Map();
  for (const inv of open) {
    totals.set(inv.customer_id, round2((totals.get(inv.customer_id) || 0) + remainingOf(inv)));
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .map(([customerId]) => customerId);
}

function shiftedCustomers(open, delayTop, badDay5) {
  const ranked = rankCustomers(open);
  const shifted = new Set();
  if (delayTop && ranked.length > 0) shifted.add(ranked[0]);
  if (badDay5) {
    ranked.slice(0, BAD_DAY_CUSTOMER_COUNT).forEach((id) => shifted.add(id));
  }
  return shifted;
}

// Overdue invoices land on today+3. Shifted customers get +15 days.
function inflowItems(open, todayMs, shifted) {
  return open.map((inv) => {
    const dueMs = toMs(inv.due_date);
    const base = dueMs < todayMs ? todayMs + OVERDUE_LAG_DAYS * DAY_MS : dueMs;
    const shift = shifted.has(inv.customer_id) ? DELAY_DAYS : 0;
    return {
      dayIndex: Math.round((base - todayMs) / DAY_MS) + shift,
      amount: remainingOf(inv),
    };
  });
}

function outflowItems(expenses, todayMs) {
  return expenses.map((e) => ({
    dayIndex: Math.round((toMs(e.due_date) - todayMs) / DAY_MS),
    amount: round2(e.amount),
  }));
}

function sumAt(items, day) {
  return items.reduce((s, it) => (it.dayIndex === day ? s + it.amount : s), 0);
}

function sumAll(items) {
  return items.reduce((s, it) => s + it.amount, 0);
}

function evaluate({ startBalance, horizon, todayMs, inflows, outflows, unpaidExpenseCount }) {
  const inRange = (items) => items.filter((it) => it.dayIndex >= 0 && it.dayIndex < horizon);
  const ins = inRange(inflows);
  const outs = inRange(outflows);
  const points = [];
  let running = startBalance;
  for (let day = 0; day < horizon; day += 1) {
    const inflow = sumAt(ins, day);
    const outflow = sumAt(outs, day);
    running += inflow - outflow;
    points.push({
      date: isoOf(todayMs + day * DAY_MS),
      day,
      balance: round2(running),
      inflow: round2(inflow),
      outflow: round2(outflow),
    });
  }
  let lowest = points[0];
  for (const p of points) {
    if (p.balance < lowest.balance) lowest = p;
  }
  return {
    points,
    lowestBalance: lowest.balance,
    lowestDate: lowest.date,
    hasCashGap: lowest.balance < 0,
    summary: {
      totalInflow: round2(sumAll(ins)),
      totalOutflow: round2(sumAll(outs)),
      endingBalance: points[points.length - 1].balance,
      unpaidExpenseCount,
    },
  };
}

/**
 * @param {object} args
 * @returns {object} forecast (see module JSDoc for shape)
 */
function buildForecast({
  shop, invoices, expenses, days, delayTop, badDay5, extraCredit15k, effectivePlan, today,
} = {}) {
  const whatIfAvailable = effectivePlan === 'pro' || effectivePlan === 'trial';
  const horizon = resolveDays(days, whatIfAvailable);
  const todayMs = today === undefined || today === null ? toMs(new Date()) : toMs(today);
  const open = openInvoices(invoices);
  const unpaid = (expenses || []).filter((e) => !e.is_paid);
  const startBalance = round2(Number(shop && shop.cash_in_hand) || 0);

  const base = { startBalance, horizon, todayMs, unpaidExpenseCount: unpaid.length };
  const outflows = outflowItems(unpaid, todayMs);
  const baseline = evaluate({
    ...base,
    inflows: inflowItems(open, todayMs, new Set()),
    outflows,
  });

  let simulated = null;
  if (whatIfAvailable) {
    const shifted = shiftedCustomers(open, !!delayTop, !!badDay5);
    const simIn = inflowItems(open, todayMs, shifted);
    const simOut = [...outflows];
    if (extraCredit15k) {
      simOut.push({ dayIndex: 0, amount: EXTRA_CREDIT_AMOUNT });
      simIn.push({ dayIndex: EXTRA_CREDIT_REPAY_DAY, amount: EXTRA_CREDIT_AMOUNT });
    }
    simulated = evaluate({ ...base, inflows: simIn, outflows: simOut });
  }

  return {
    days: horizon,
    effectivePlan: whatIfAvailable ? effectivePlan : 'free',
    whatIfAvailable,
    startBalance,
    ...baseline,
    noExpenses: unpaid.length === 0,
    simulated,
  };
}

module.exports = { buildForecast };
