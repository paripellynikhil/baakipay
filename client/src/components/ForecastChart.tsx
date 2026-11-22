import { useId, useState, type PointerEvent } from 'react';
import { useI18n } from '../i18n/I18n';
import type { ForecastPoint } from '../lib/forecastApi';
import { formatRupees } from '../lib/invoiceMath';

// Responsive SVG area chart: emerald fill above the Safe Buffer line, coral fill below it, rupee gridlines and a hover tooltip.
const W = 320;
const H = 220;
const PAD_L = 36;
const PAD_R = 8;
const PAD_Y = 12;
const PAD_BOTTOM = 18;
const GREEN = '#16A34A';
const CORAL = '#F43F5E';
const RED = '#DC2626';
const INDIGO = '#1E1B4B';
const AMBER = '#F59E0B';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 'YYYY-MM-DD' -> '14 May' without timezone shifts.
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? ''}`.trim();
}

// Rounds a raw step up to 1, 2, 5 or 10 times a power of ten so gridlines land on round rupee values.
function niceStep(raw: number): number {
  const base = 10 ** Math.floor(Math.log10(raw));
  const f = raw / base;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * base;
}

// Rupee axis label: ₹40k, -₹20k, ₹0.
function rupeeTick(v: number): string {
  const abs = Math.abs(v);
  return `${v < 0 ? '-' : ''}₹${abs >= 1000 ? `${abs / 1000}k` : abs}`;
}

export interface ForecastChartProps {
  points: ForecastPoint[];
  simulated?: ForecastPoint[] | null;
  buffer?: number;
}

export default function ForecastChart({ points, simulated, buffer = 0 }: ForecastChartProps) {
  const { t } = useI18n();
  const uid = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);
  const n = points.length;
  if (n < 2) return null;

  // Domain always includes the buffer line so the danger boundary is visible.
  const all = [buffer, ...points.map((p) => p.balance), ...(simulated ?? []).map((p) => p.balance)];
  const min = Math.min(...all);
  const max = Math.max(...all) === min ? min + 1 : Math.max(...all);
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_Y - PAD_BOTTOM;

  const x = (i: number) => PAD_L + (i / (n - 1)) * innerW;
  const y = (v: number) => PAD_Y + ((max - v) / (max - min)) * innerH;
  const lineY = y(buffer);
  const fmt = (v: number) => v.toFixed(1);

  const linePath = (pts: ForecastPoint[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${fmt(x(i))} ${fmt(y(p.balance))}`).join(' ');
  const areaPath =
    `M${fmt(x(0))} ${fmt(lineY)} ` +
    points.map((p, i) => `L${fmt(x(i))} ${fmt(y(p.balance))}`).join(' ') +
    ` L${fmt(x(n - 1))} ${fmt(lineY)} Z`;

  const step = niceStep((max - min) / 4);
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) ticks.push(Math.round(v));

  let lowIdx = 0;
  points.forEach((p, i) => {
    if (p.balance < points[lowIdx].balance) lowIdx = i;
  });
  const low = points[lowIdx];

  const midIndex = Math.floor((n - 1) / 2);

  function onMove(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((px - PAD_L) / innerW) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, idx)));
  }

  // Tooltip geometry: sits above the hovered point, or below it when there is no room above.
  const hp = hover === null ? null : points[hover];
  const TW = 104;
  const TH = 34;
  const hx = hover === null ? 0 : x(hover);
  const hy = hp ? y(hp.balance) : 0;
  const tx = Math.min(W - TW, Math.max(0, hx - TW / 2));
  const ty = hy - TH - 8 >= 0 ? hy - TH - 8 : Math.min(hy + 8, H - TH);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      aria-hidden="true"
      className="block w-full"
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
    >
      <defs>
        <clipPath id={`${uid}-above`}>
          <rect x="0" y="0" width={W} height={fmt(lineY)} />
        </clipPath>
        <clipPath id={`${uid}-below`}>
          <rect x="0" y={fmt(lineY)} width={W} height={fmt(H - lineY)} />
        </clipPath>
        <linearGradient id={`${uid}-up`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={PAD_Y} y2={fmt(lineY)}>
          <stop offset="0" stopColor={GREEN} stopOpacity={0.35} />
          <stop offset="1" stopColor={GREEN} stopOpacity={0.04} />
        </linearGradient>
        <linearGradient id={`${uid}-down`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={fmt(lineY)} y2={H - PAD_BOTTOM}>
          <stop offset="0" stopColor={CORAL} stopOpacity={0.04} />
          <stop offset="1" stopColor={CORAL} stopOpacity={0.35} />
        </linearGradient>
      </defs>

      <path d={areaPath} fill={`url(#${uid}-up)`} clipPath={`url(#${uid}-above)`} />
      <path d={areaPath} fill={`url(#${uid}-down)`} clipPath={`url(#${uid}-below)`} />

      {ticks.map((v) => (
        <g key={v}>
          <line x1={PAD_L} x2={W - PAD_R} y1={fmt(y(v))} y2={fmt(y(v))} stroke="#E2E8F0" strokeWidth={1} />
          <text x={PAD_L - 4} y={fmt(y(v) + 3)} fontSize={9} fill="#64748B" textAnchor="end">
            {rupeeTick(v)}
          </text>
        </g>
      ))}
      {min <= 0 && max >= 0 && (
        <line x1={PAD_L} x2={W - PAD_R} y1={fmt(y(0))} y2={fmt(y(0))} stroke={INDIGO} strokeWidth={1.5} />
      )}

      <line x1={PAD_L} x2={W - PAD_R} y1={fmt(lineY)} y2={fmt(lineY)} stroke={RED} strokeWidth={1} strokeDasharray="4 3" />
      {min < buffer && (
        <text x={PAD_L} y={fmt(lineY - 3)} fontSize={9} fill={RED}>
          {t('forecast.danger_zone')}
        </text>
      )}

      <path d={linePath(points)} fill="none" stroke={INDIGO} strokeWidth={2} strokeLinejoin="round" />
      {simulated && simulated.length > 1 && (
        <path d={linePath(simulated)} fill="none" stroke={AMBER} strokeWidth={2} strokeDasharray="6 4" />
      )}

      <circle
        cx={fmt(x(lowIdx))}
        cy={fmt(y(low.balance))}
        r={4.5}
        fill={low.balance < buffer ? RED : GREEN}
        stroke="#FFFFFF"
        strokeWidth={2}
      />

      {hp && hover !== null && (
        <g pointerEvents="none">
          <line x1={fmt(hx)} x2={fmt(hx)} y1={PAD_Y} y2={H - PAD_BOTTOM} stroke={INDIGO} strokeOpacity={0.25} strokeWidth={1} />
          <circle cx={fmt(hx)} cy={fmt(hy)} r={4} fill="#FFFFFF" stroke={INDIGO} strokeWidth={2} />
          <rect x={fmt(tx)} y={fmt(ty)} width={TW} height={TH} rx={6} fill={INDIGO} />
          <text x={fmt(tx + 8)} y={fmt(ty + 13)} fontSize={10} fill="#CBD5E1">
            {shortDate(hp.date)}
          </text>
          <text x={fmt(tx + 8)} y={fmt(ty + 28)} fontSize={11} fontWeight={700} fill="#FFFFFF">
            {formatRupees(hp.balance)}
          </text>
        </g>
      )}

      <text x={PAD_L} y={H - 2} fontSize={10} fill="#64748B" textAnchor="start">
        {shortDate(points[0].date)}
      </text>
      <text x={fmt(x(midIndex))} y={H - 2} fontSize={10} fill="#64748B" textAnchor="middle">
        {shortDate(points[midIndex].date)}
      </text>
      <text x={W - PAD_R} y={H - 2} fontSize={10} fill="#64748B" textAnchor="end">
        {shortDate(points[n - 1].date)}
      </text>
    </svg>
  );
}
