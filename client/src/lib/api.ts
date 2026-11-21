export const TOKEN_KEY = 'baakipay_token';
export const SHOP_KEY = 'baakipay_shop_id';
export const CACHE_PREFIX = 'baakipay_';
const LANG_KEY = 'baakipay_lang';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

interface CacheEntry<T> {
  savedAt: number;
  data: T;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getShopId(): string | null {
  return localStorage.getItem(SHOP_KEY);
}

export function setSession(token: string, shopId: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(SHOP_KEY, shopId);
}

export function clearSession(): void {
  const shopId = getShopId();
  const toRemove: string[] = [TOKEN_KEY, SHOP_KEY];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (shopId) {
      if (key.startsWith(`${CACHE_PREFIX}${shopId}_`)) toRemove.push(key);
    } else if (key.startsWith(CACHE_PREFIX) && key !== LANG_KEY) {
      toRemove.push(key);
    }
  }

  for (const key of new Set(toRemove)) {
    localStorage.removeItem(key);
  }
}

export function cacheKey(resource: string): string | null {
  const shopId = getShopId();
  return shopId ? `${CACHE_PREFIX}${shopId}_${resource}` : null;
}

function readEntry<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CacheEntry<T>) : null;
  } catch {
    return null;
  }
}

export function readCache<T>(resource: string): T | null {
  const key = cacheKey(resource);
  if (!key) return null;
  return readEntry<T>(key)?.data ?? null;
}

export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (err) {
    if (err instanceof TypeError) throw new ApiError(0, 'OFFLINE');
    throw err;
  }

  if (!res.ok) {
    let json: { error?: string } | null = null;
    try {
      json = (await res.json()) as { error?: string } | null;
    } catch {
      // Body was not JSON; fall through to the generic code.
    }
    if (res.status === 401 && token) clearSession();
    throw new ApiError(res.status, json?.error ?? 'HTTP_ERROR');
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function cachedGet<T>(resource: string, path: string): Promise<{ offline: boolean; data: T }> {
  try {
    const data = await apiFetch<T>(path);
    const key = cacheKey(resource);
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
      } catch {
        // Quota or storage failure: the live response is still valid.
      }
    }
    return { offline: false, data };
  } catch (err) {
    if (err instanceof ApiError && err.code === 'OFFLINE') {
      const key = cacheKey(resource);
      const entry = key ? readEntry<T>(key) : null;
      if (entry) return { offline: true, data: entry.data };
    }
    throw err;
  }
}
