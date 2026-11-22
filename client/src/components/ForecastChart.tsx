import { useId } from 'react';
import { useI18n } from '../i18n/I18n';
import type { ForecastPoint } from '../lib/forecastApi';

// Responsive SVG line chart: green area above the buffer line, red area below, buffer line as the danger boundary.
const W = 320;
const H = 220;
const PAD_X = 8;
const PAD_Y = 12;
const PAD_BOTTOM = 18;
const GREEN = '#16A34A';
const RED = '#DC2626';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 'YYYY-MM-DD' -> '14 May' without timezone shifts.
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? ''}`.trim();
}

export interface ForecastChartProps {
  points: ForecastPoint[];
  simulated?: ForecastPoint[] | null;
  buffer?: number;
}

export default function ForecastChart({ points, simulated, buffer = 0 }: ForecastChartProps) {
  const { t } = useI18n();
  const uid = useId().replace(/:/g, '');
  const n = points.length;
  if (n < 2) return null;

  // Domain always includes the buffer line so the danger boundary is visible.
  const all = [buffer, ...points.map((p) => p.balance), ...(simulated ?? []).map((p) => p.balance)];
  const min = Math.min(...all);
  const max = Math.max(...all) === min ? min + 1 : Math.max(...all);
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y - PAD_BOTTOM;

  const x = (i: number) => PAD_X + (i / (n - 1)) * innerW;
  const y = (v: number) => PAD_Y + ((max - v) / (max - min)) * innerH;
  const lineY = y(buffer);
  const fmt = (v: number) => v.toFixed(1);

  const linePath = (pts: ForecastPoint[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${fmt(x(i))} ${fmt(y(p.balance))}`).join(' ');
  const areaPath =
    `M${fmt(x(0))} ${fmt(lineY)} ` +
    points.map((p, i) => `L${fmt(x(i))} ${fmt(y(p.balance))}`).join(' ') +
    ` L${fmt(x(n - 1))} ${fmt(lineY)} Z`;

  const midIndex = Math.floor((n - 1) / 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-hidden="true" className="block w-full">
      <defs>
        <clipPath id={`${uid}-above`}>
          <rect x="0" y="0" width={W} height={fmt(lineY)} />
        </clipPath>
        <clipPath id={`${uid}-below`}>
          <rect x="0" y={fmt(lineY)} width={W} height={fmt(H - lineY)} />
        </clipPath>
      </defs>

      <path d={areaPath} fill={GREEN} fillOpacity={0.18} clipPath={`url(#${uid}-above)`} />
      <path d={areaPath} fill={RED} fillOpacity={0.22} clipPath={`url(#${uid}-below)`} />

      <line x1={PAD_X} x2={W - PAD_X} y1={fmt(lineY)} y2={fmt(lineY)} stroke={RED} strokeWidth={1} strokeDasharray="4 3" />
      {min < buffer && (
        <text x={PAD_X} y={fmt(lineY - 3)} fontSize={9} fill={RED}>
          {t('forecast.danger_zone')}
        </text>
      )}

      <path d={linePath(points)} fill="none" stroke="#1E1B4B" strokeWidth={2} strokeLinejoin="round" />
      {simulated && simulated.length > 1 && (
        <path d={linePath(simulated)} fill="none" stroke="#F59E0B" strokeWidth={2} strokeDasharray="6 4" />
      )}

      <text x={PAD_X} y={H - 2} fontSize={10} fill="#64748B" textAnchor="start">
        {shortDate(points[0].date)}
      </text>
      <text x={fmt(x(midIndex))} y={H - 2} fontSize={10} fill="#64748B" textAnchor="middle">
        {shortDate(points[midIndex].date)}
      </text>
      <text x={W - PAD_X} y={H - 2} fontSize={10} fill="#64748B" textAnchor="end">
        {shortDate(points[n - 1].date)}
      </text>
    </svg>
  );
}
