import { describe, it, expect } from 'vitest';
import { parseVoiceLine } from '../components/voiceLineParser';
import { buildWhatsAppUrl } from './whatsappUrl';
import { buildReminder, type ReminderInput, type ReminderTone, type ReminderLang } from '../i18n/reminders';

describe('voiceLineParser', () => {
  it('parses "kandipappu 5 kgs 300"', () => {
    expect(parseVoiceLine('kandipappu 5 kgs 300')).toEqual({
      name: 'kandipappu',
      qty: '5',
      unitPrice: '300',
    });
  });

  it('parses "rice 10 kilo 600 rupees"', () => {
    expect(parseVoiceLine('rice 10 kilo 600 rupees')).toEqual({
      name: 'rice',
      qty: '10',
      unitPrice: '600',
    });
  });

  it('parses "sugar 250" with default quantity 1', () => {
    expect(parseVoiceLine('sugar 250')).toEqual({
      name: 'sugar',
      qty: '1',
      unitPrice: '250',
    });
  });
});

describe('whatsappUrl', () => {
  it('returns a phone-less link for demo number 9000000001', () => {
    expect(buildWhatsAppUrl('9000000001', 'Hi')).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });

  it('returns a phone-less link for demo number 9000000005', () => {
    expect(buildWhatsAppUrl('9000000005', 'Hi')).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });

  it('builds a 91-prefixed link for a real 10-digit number', () => {
    const url = buildWhatsAppUrl('9876543210', 'Hello there');
    expect(url).toBe(`https://wa.me/919876543210?text=${encodeURIComponent('Hello there')}`);
  });
});

describe('reminders', () => {
  const tones: ReminderTone[] = ['gentle', 'firm', 'urgent'];
  const langs: ReminderLang[] = ['en', 'te', 'hi'];

  for (const tone of tones) {
    for (const lang of langs) {
      it(`returns a non-empty ${tone}/${lang} reminder`, () => {
        const input: ReminderInput = {
          tone,
          lang,
          customerName: 'Ravi',
          invoiceCode: 'INV-001',
          amount: 1500,
          dueDate: '2025-01-15',
          shopName: 'Baakipay Store',
        };
        expect(buildReminder(input).length).toBeGreaterThan(0);
      });
    }
  }
});
