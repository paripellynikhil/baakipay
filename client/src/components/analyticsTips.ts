import type { AnalyticsResponse } from '../lib/analyticsApi';
import { formatRupees } from '../lib/invoiceMath';
import type { useI18n } from '../i18n/I18n';

// Smart Tips are built on the client from the analytics numbers so they follow the
// selected language. Conditions mirror buildSmartTips() in server/routes/analytics.js.
export type SmartTip = { id: 'on_time' | 'top_overdue' | 'avg_days' | 'outstanding'; text: string };

type Translate = ReturnType<typeof useI18n>['t'];

// Replaces each {key} placeholder in the template with the matching value.
function fill(template: string, vars: Record<string, string | number>): string {
  return Object.keys(vars).reduce((s, k) => s.split(`{${k}}`).join(String(vars[k])), template);
}

export function buildSmartTips(data: AnalyticsResponse, t: Translate): SmartTip[] {
  const tips: SmartTip[] = [];
  // The response has no paid-invoice count. avgDaysToCollect is 0 when nothing is paid,
  // so it stands in for the server's paidCount > 0 check.
  if (data.avgDaysToCollect > 0 && data.onTimeRate < 50) {
    tips.push({
      id: 'on_time',
      text: fill(t('analytics.tip_on_time'), { rate: data.onTimeRate }),
    });
  }
  if (data.topOverdue.length > 0) {
    const top = data.topOverdue[0];
    tips.push({
      id: 'top_overdue',
      text: fill(t('analytics.tip_top_overdue'), {
        name: top.name,
        amount: formatRupees(top.outstanding),
        days: top.maxDaysOverdue,
      }),
    });
  }
  if (data.avgDaysToCollect > 30) {
    tips.push({
      id: 'avg_days',
      text: fill(t('analytics.tip_avg_days'), { days: Math.round(data.avgDaysToCollect) }),
    });
  }
  if (data.totalOutstanding > 0) {
    tips.push({
      id: 'outstanding',
      text: fill(t('analytics.tip_outstanding'), { total: formatRupees(data.totalOutstanding) }),
    });
  }
  return tips;
}
