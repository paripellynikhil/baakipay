import { apiFetch, cachedGet, cacheKey, setSession } from './api';

export interface Shop {
  id: string;
  email_or_phone: string;
  shop_name: string | null;
  owner_name: string | null;
  bio: string | null;
  address: string | null;
  upi_id: string | null;
  cash_in_hand: string | number;
  default_credit_limit: string | number;
  default_due_days: number;
  language: string;
  plan: 'trial' | 'pro' | 'free';
  trial_expires_at: string;
  onboarded: boolean;
  created_at: string;
}

export type EffectivePlan = 'trial' | 'pro' | 'free';

export interface AuthResult {
  token: string;
  shop: Shop;
  effectivePlan: EffectivePlan;
}

export interface ProfileResult {
  shop: Shop;
  effectivePlan: EffectivePlan;
}

export interface RecurringBillInput {
  title: string;
  category: string;
  amount: number;
  dueDate: string;
}

export interface ProfileUpdate {
  shop_name?: string;
  owner_name?: string;
  bio?: string;
  address?: string;
  upi_id?: string;
  language?: string;
  cash_in_hand?: number;
  default_credit_limit?: number;
  default_due_days?: number;
  onboarded?: boolean;
  recurringBills?: RecurringBillInput[];
}

export async function login(emailOrPhone: string, password: string): Promise<AuthResult> {
  const result = await apiFetch<AuthResult>('/api/auth/login', {
    method: 'POST',
    body: { emailOrPhone, password },
  });
  setSession(result.token, result.shop.id);
  return result;
}

export async function register(
  emailOrPhone: string,
  password: string,
  shopName: string,
  ownerName: string,
): Promise<AuthResult> {
  const result = await apiFetch<AuthResult>('/api/auth/register', {
    method: 'POST',
    body: { emailOrPhone, password, shopName, ownerName },
  });
  setSession(result.token, result.shop.id);
  return result;
}

export function forgotPassword(emailOrPhone: string): Promise<{ message: string; sandboxOtpHint?: string }> {
  return apiFetch<{ message: string; sandboxOtpHint?: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: { emailOrPhone },
  });
}

export function resetPassword(emailOrPhone: string, otp: string, newPassword: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/api/auth/reset-password', {
    method: 'POST',
    body: { emailOrPhone, otp, newPassword },
  });
}

export function getProfile(): Promise<{ offline: boolean; data: ProfileResult }> {
  return cachedGet<ProfileResult>('profile', '/api/shop/profile');
}

export async function updateProfile(update: ProfileUpdate): Promise<ProfileResult & { recurringBillsAdded?: number }> {
  const res = await apiFetch<ProfileResult & { recurringBillsAdded?: number }>('/api/shop/profile', {
    method: 'PUT',
    body: update,
  });

  const key = cacheKey('profile');
  if (key) {
    const entry: { savedAt: number; data: ProfileResult } = {
      savedAt: Date.now(),
      data: { shop: res.shop, effectivePlan: res.effectivePlan },
    };
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Cache write is best-effort.
    }
  }
  return res;
}
