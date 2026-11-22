// Builds a wa.me share link. Synthetic demo numbers (90000000XX) get a
// phone-less link so the demo never messages a real-looking number.
const DEMO_PHONE = /^90000000\d{2}$/;

function normalisePhone(phone: string): string {
  let digits = phone.replace(/[\s-]/g, '').replace(/^\+91/, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  return digits;
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const encoded = encodeURIComponent(text);
  const digits = normalisePhone(phone);
  if (!/^\d{10}$/.test(digits) || DEMO_PHONE.test(digits)) return `https://wa.me/?text=${encoded}`;
  return `https://wa.me/91${digits}?text=${encoded}`;
}
