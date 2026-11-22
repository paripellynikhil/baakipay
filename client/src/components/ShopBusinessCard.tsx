import { QRCodeSVG } from 'qrcode.react';
import { useI18n } from '../i18n/I18n';
import { buildWhatsAppUrl } from '../lib/whatsappUrl';
import { linkClass } from './FormControls';

export interface ShopCardInfo {
  shop_name: string;
  owner_name: string;
  bio: string;
  address: string;
  upi_id: string;
}

interface ShopBusinessCardProps {
  info: ShopCardInfo;
  // Owner's phone for the WhatsApp share; ignored when it does not hold a usable number.
  phone?: string;
}

export default function ShopBusinessCard({ info, phone = '' }: ShopBusinessCardProps) {
  const { t } = useI18n();
  const shopName = info.shop_name.trim();
  const owner = info.owner_name.trim();
  const bio = info.bio.trim();
  const address = info.address.trim();
  const upiId = info.upi_id.trim();
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const upiPayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}&cu=INR`;

  const lines = [
    shopName,
    owner && `${t('settings.owner_name')}: ${owner}`,
    bio,
    address && `${t('settings.address')}: ${address}`,
    upiId && `UPI ID: ${upiId}`,
  ].filter(Boolean) as string[];
  const text = lines.join('\n');
  // Without a usable phone, buildWhatsAppUrl would produce a bare "wa.me/91" link, so use the phone-less form.
  const digits = phone.replace(/\D/g, '');
  const waHref = digits.length >= 10 ? buildWhatsAppUrl(phone, text) : `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-500">{t('card.title')}</h2>
      <div className="print-only-card flex flex-col gap-2 rounded-xl border border-[#E2E8F0] p-4 text-[#1E1B4B]">
        <p className="text-lg font-bold">{shopName}</p>
        {owner && <p className="text-sm">{`${t('settings.owner_name')}: ${owner}`}</p>}
        {bio && <p className="text-sm text-slate-600">{bio}</p>}
        {address && (
          <a href={mapsHref} target="_blank" rel="noopener noreferrer" className={`${linkClass} w-fit text-sm`}>
            {address}
          </a>
        )}
        {upiId ? (
          <div className="flex flex-col items-center gap-1 pt-2">
            <QRCodeSVG value={upiPayload} size={128} role="img" aria-label={t('card.upiQr')} />
            <p className="text-xs text-slate-600">{t('card.upiQr')}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-600">{t('invoices.noUpi')}</p>
        )}
      </div>
      <div className="flex flex-col gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="min-h-[44px] w-full rounded-xl bg-[#F59E0B] px-4 font-bold text-[#0F172A] shadow-sm"
        >
          {t('card.savePdf')}
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#E2E8F0] px-4 font-semibold text-[#1E1B4B]"
        >
          {t('card.shareWa')}
        </a>
      </div>
    </section>
  );
}
