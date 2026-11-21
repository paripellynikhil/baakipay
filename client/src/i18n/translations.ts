import { enCore } from './translations/en';
import { teCore } from './translations/te';
import { hiCore } from './translations/hi';
import { gotMoney } from './sections/gotMoney';
import { sms } from './sections/sms';
import { bills } from './sections/bills';
import { forecast } from './sections/forecast';
import { analytics } from './sections/analytics';
import { settings } from './sections/settings';

// Barrel: keeps the public export names stable so existing imports of './translations' still resolve.
export const LANGS = ['en', 'te', 'hi'] as const;
export type Lang = (typeof LANGS)[number];

export const en = { ...enCore, ...gotMoney.en, ...sms.en, ...bills.en, ...forecast.en, ...analytics.en, ...settings.en } as const;

export type TranslationKey = keyof typeof en;

export const translations: Record<Lang, Record<TranslationKey, string>> = {
  en,
  te: { ...teCore, ...gotMoney.te, ...sms.te, ...bills.te, ...forecast.te, ...analytics.te, ...settings.te },
  hi: { ...hiCore, ...gotMoney.hi, ...sms.hi, ...bills.hi, ...forecast.hi, ...analytics.hi, ...settings.hi },
};
