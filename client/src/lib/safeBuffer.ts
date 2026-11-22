// Safe cash buffer: the balance floor the forecast must stay above. Device-level UI preference.
export const SAFE_BUFFER_KEY = 'forecast.safeBuffer';
export const BUFFER_PILLS = [0, 5000, 10000, 20000];

export function parseBuffer(raw: string): number {
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function readSafeBuffer(): number {
  try {
    return parseBuffer(localStorage.getItem(SAFE_BUFFER_KEY) ?? '0');
  } catch {
    // localStorage unavailable — fall back to no buffer.
    return 0;
  }
}

export function writeSafeBuffer(value: number): void {
  try {
    localStorage.setItem(SAFE_BUFFER_KEY, String(value));
  } catch {
    // Persisting is best-effort; the in-memory value still applies.
  }
}

// Indian digit grouping without the currency symbol (the templates supply the ₹).
export function inr(n: number): string {
  return Math.round(n).toLocaleString('en-IN');
}

// Minimal interpolation for i18n strings: '{name}' placeholders replaced from vars.
export function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_m, key: string) => vars[key] ?? '');
}

export interface ScenarioSummary {
  short: boolean; // scenario lowest cash is below the buffer
  shortfall: number; // how far below the buffer the scenario goes
  extra: number; // extra cash needed beyond the normal case to hold the buffer
  diff: number; // how much lower the scenario lowest cash is than normal
}

export function computeScenario(normalLowest: number, simLowest: number, buffer: number): ScenarioSummary {
  const simShort = Math.max(0, buffer - simLowest);
  const normalShort = Math.max(0, buffer - normalLowest);
  return {
    short: simLowest < buffer,
    shortfall: simShort,
    extra: Math.max(0, simShort - normalShort),
    diff: Math.max(0, normalLowest - simLowest),
  };
}
