// Pure parser for spoken line items: "Rice 5 400" -> qty 5, price 400; "Sugar 250" -> qty 1, price 250.

export interface VoiceLine {
  name: string;
  qty: string;
  unitPrice: string;
}

const NUM = '\\d+(?:\\.\\d+)?';
const TRAILING_NUMBERS = new RegExp(`^(.*?)\\s+(${NUM})(?:\\s+(${NUM}))?$`);

export function parseVoiceLine(transcript: string): VoiceLine | null {
  const text = transcript
    .replace(/[,₹]/g, '')
    .replace(/[.!?]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  const match = TRAILING_NUMBERS.exec(text);
  if (!match) return null;

  const name = match[1].trim();
  if (!name) return null;

  if (match[3] !== undefined) {
    return { name, qty: match[2], unitPrice: match[3] };
  }
  return { name, qty: '1', unitPrice: match[2] };
}
