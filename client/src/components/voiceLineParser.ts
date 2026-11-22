// Pure parser for spoken line items.
// "kandipappu 5 kgs 300" -> name "kandipappu", qty 5, price 300.
// "rice 10 kilo 600 rupees" -> "rice", 10, 600. "sugar 250" -> "sugar", 1, 250.

export interface VoiceLine {
  name: string;
  qty: string;
  unitPrice: string;
}

// Unit/currency words are dropped wherever they appear as a separate token.
const IGNORED_WORDS = new Set([
  'kg', 'kgs', 'kilo', 'kilos', 'g', 'gm', 'grams', 'ltr', 'litre', 'litres',
  'pcs', 'pack', 'packet', 'dozen', 'rs', 'rupees', '₹',
  'కిలో', 'రూపాయలు', 'किलो', 'रुपये',
]);

const NUMBER = /^\d+(?:\.\d+)?$/;

export function parseVoiceLine(transcript: string): VoiceLine | null {
  const tokens = transcript
    .replace(/[,₹]/g, ' ')
    .split(/\s+/)
    .map((tok) => tok.replace(/[.!?]+$/, ''))
    .filter((tok) => tok.length > 0 && !IGNORED_WORDS.has(tok.toLowerCase()));

  const firstNumber = tokens.findIndex((tok) => NUMBER.test(tok));
  if (firstNumber < 0) return null;

  const name = tokens.slice(0, firstNumber).join(' ').trim();
  if (!name) return null;

  const numbers = tokens.filter((tok) => NUMBER.test(tok));
  if (numbers.length === 1) return { name, qty: '1', unitPrice: numbers[0] };
  return { name, qty: numbers[0], unitPrice: numbers[numbers.length - 1] };
}
