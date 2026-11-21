// Pure WhatsApp reminder message builder. No React, no I18n context.

export type ReminderTone = 'gentle' | 'firm' | 'urgent';
export type ReminderLang = 'en' | 'te' | 'hi';

export interface ReminderInput {
  tone: ReminderTone;
  lang: ReminderLang;
  customerName: string;
  invoiceCode: string;
  amount: number;
  dueDate: string | null;
  shopName: string;
}

type Vars = Record<'name' | 'code' | 'amount' | 'due' | 'shop', string>;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Formats a date as dd MMM yyyy. Date-only strings (YYYY-MM-DD) are read as calendar
// dates so that timezone offsets cannot shift the day.
export function formatDueDate(value: string | null): string {
  if (!value) return '-';
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  let day: number;
  let month: number;
  let year: number;
  if (dateOnly) {
    year = Number(dateOnly[1]);
    month = Number(dateOnly[2]) - 1;
    day = Number(dateOnly[3]);
  } else {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    day = parsed.getDate();
    month = parsed.getMonth();
    year = parsed.getFullYear();
  }
  return `${String(day).padStart(2, '0')} ${MONTHS[month]} ${year}`;
}

export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

const TEMPLATES: Record<ReminderLang, Record<ReminderTone, string>> = {
  en: {
    gentle:
      'Hello {name}, this is a friendly reminder from {shop}. Invoice {code} for {amount} is due by {due}. Please pay when convenient. Thank you!',
    firm:
      'Hello {name}, {shop} here. Invoice {code} for {amount} is still pending (due date {due}). Please arrange payment at the earliest. Thank you.',
    urgent:
      'Urgent reminder: Hello {name}, invoice {code} for {amount} (due {due}) is still unpaid. Please pay today. Thank you, {shop}.',
  },
  te: {
    gentle:
      'నమస్కారం {name} గారు, {shop} నుండి. ఇన్వాయిస్ {code} కు {amount} బాకీ ఉంది. గడువు తేదీ {due}. మీకు వీలైనప్పుడు చెల్లించగలరు. ధన్యవాదాలు.',
    firm:
      'నమస్కారం {name} గారు, {shop} నుండి. ఇన్వాయిస్ {code} కు {amount} ఇంకా బాకీ ఉంది. గడువు తేదీ {due}. దయచేసి వీలైనంత త్వరగా చెల్లించండి. ధన్యవాదాలు.',
    urgent:
      'అత్యవసరం: {name} గారు, ఇన్వాయిస్ {code} కు {amount} బాకీ ఉంది. గడువు తేదీ {due}. దయచేసి ఈరోజే చెల్లించండి. ధన్యవాదాలు – {shop}',
  },
  hi: {
    gentle:
      'नमस्ते {name} जी, {shop} की ओर से। इनवॉइस {code} का {amount} बकाया है। देय तिथि {due} है। कृपया सुविधानुसार भुगतान करें। धन्यवाद।',
    firm:
      'नमस्ते {name} जी, {shop} की ओर से। इनवॉइस {code} का {amount} अभी बकाया है, देय तिथि {due} है। कृपया जल्द से जल्द भुगतान करें। धन्यवाद।',
    urgent:
      'अत्यावश्यक: नमस्ते {name} जी, इनवॉइस {code} का {amount} बकाया है। देय तिथि {due} है। कृपया आज ही भुगतान करें। धन्यवाद – {shop}',
  },
};

function fill(template: string, vars: Vars): string {
  return template.replace(/\{(name|code|amount|due|shop)\}/g, (_match, key: keyof Vars) => vars[key]);
}

export function buildReminder(input: ReminderInput): string {
  const template = TEMPLATES[input.lang][input.tone];
  return fill(template, {
    name: input.customerName,
    code: input.invoiceCode,
    amount: formatRupees(input.amount),
    due: formatDueDate(input.dueDate),
    shop: input.shopName,
  });
}
