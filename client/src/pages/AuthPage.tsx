import { useState, type FormEvent } from 'react';
import { LangSwitcher, Field, linkClass, primaryClass } from '../components/FormControls';
import { useI18n } from '../i18n/I18n';
import type { TranslationKey } from '../i18n/translations';
import { ApiError } from '../lib/api';
import { forgotPassword, login, register, resetPassword, type Shop } from '../lib/shopApi';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';
type ErrorMap = Record<string, TranslationKey>;

const MIN_PASSWORD = 8;
const missing = (...values: string[]) => values.some((v) => v.trim() === '');

const HEADINGS: Record<Mode, TranslationKey> = { login: 'auth_login', signup: 'auth_signup', forgot: 'auth_forgot', reset: 'auth_forgot' };
const SUBMIT_LABELS: Record<Mode, TranslationKey> = {
  login: 'auth_signIn',
  signup: 'auth_createAccount',
  forgot: 'auth_sendOtp',
  reset: 'auth_resetPassword',
};
const LINKS: Record<Mode, { key: TranslationKey; to: Mode }[]> = {
  login: [
    { key: 'auth_toSignup', to: 'signup' },
    { key: 'auth_forgotLink', to: 'forgot' },
  ],
  signup: [{ key: 'auth_toLogin', to: 'login' }],
  forgot: [{ key: 'auth_backToLogin', to: 'login' }],
  reset: [{ key: 'auth_backToLogin', to: 'login' }],
};

export default function AuthPage({ onAuthed }: { onAuthed: (shop: Shop) => void }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>('login');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [sandboxHint, setSandboxHint] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
    setSandboxHint(null);
  }

  // Shared request wrapper: maps known ApiError codes; everything else is a network/generic error.
  async function run(action: () => Promise<void>, codes: ErrorMap = {}) {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      const mapped = err instanceof ApiError ? codes[err.code] : undefined;
      setError(t(mapped ?? 'networkError'));
    } finally {
      setBusy(false);
    }
  }

  function doLogin() {
    if (missing(emailOrPhone, password)) return setError(t('auth_required'));
    void run(
      async () => {
        const res = await login(emailOrPhone.trim(), password);
        onAuthed(res.shop);
      },
      { INVALID_CREDENTIALS: 'auth_invalidCredentials' },
    );
  }

  function doSignup() {
    if (missing(shopName, ownerName, emailOrPhone, password)) return setError(t('auth_required'));
    if (password.length < MIN_PASSWORD) return setError(t('auth_minPassword'));
    void run(
      async () => {
        const res = await register(emailOrPhone.trim(), password, shopName.trim(), ownerName.trim());
        onAuthed(res.shop);
      },
      { ACCOUNT_EXISTS: 'auth_accountExists' },
    );
  }

  function doForgot() {
    if (missing(emailOrPhone)) return setError(t('auth_required'));
    void run(
      async () => {
        const res = await forgotPassword(emailOrPhone.trim());
        setInfo(res.message || t('auth_otpSent'));
        setSandboxHint(res.sandboxOtpHint ? t('auth_sandboxHint') : null);
        setMode('reset');
      },
      { ACCOUNT_NOT_FOUND: 'auth_notFound' },
    );
  }

  function doReset() {
    if (missing(otp, newPassword)) return setError(t('auth_required'));
    if (newPassword.length < MIN_PASSWORD) return setError(t('auth_minPassword'));
    void run(
      async () => {
        await resetPassword(emailOrPhone.trim(), otp.trim(), newPassword);
        setOtp('');
        setNewPassword('');
        setPassword('');
        setSandboxHint(null);
        setMode('login');
        setInfo(t('auth_resetDone'));
      },
      { INVALID_OTP: 'auth_invalidOtp' },
    );
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const handlers: Record<Mode, () => void> = { login: doLogin, signup: doSignup, forgot: doForgot, reset: doReset };
    handlers[mode]();
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
        <LangSwitcher />

        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-[#1E1B4B]">{t('appName')}</h1>
          <p className="text-sm text-slate-600">{t('tagline')}</p>
        </div>

        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#1E1B4B]">{t(HEADINGS[mode])}</h2>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {mode === 'signup' && (
              <>
                <Field id="shopName" label={t('auth_shopName')} value={shopName} autoComplete="organization" onChange={(e) => setShopName(e.target.value)} />
                <Field id="ownerName" label={t('auth_ownerName')} value={ownerName} autoComplete="name" onChange={(e) => setOwnerName(e.target.value)} />
              </>
            )}

            {mode !== 'reset' && (
              <Field id="emailOrPhone" label={t('auth_email')} value={emailOrPhone} autoComplete="username" onChange={(e) => setEmailOrPhone(e.target.value)} />
            )}

            {(mode === 'login' || mode === 'signup') && (
              <Field id="password" label={t('auth_password')} type="password" value={password}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} onChange={(e) => setPassword(e.target.value)} />
            )}

            {mode === 'reset' && (
              <>
                <Field id="otp" label={t('auth_otp')} value={otp} inputMode="numeric" autoComplete="one-time-code" onChange={(e) => setOtp(e.target.value)} />
                <Field id="newPassword" label={t('auth_newPassword')} type="password" value={newPassword} autoComplete="new-password" onChange={(e) => setNewPassword(e.target.value)} />
                {sandboxHint && <p className="text-sm text-slate-600">{sandboxHint}</p>}
              </>
            )}

            {mode === 'signup' && (
              <p className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs text-slate-600">{t('auth_privacy')}</p>
            )}

            {error && (
              <p role="alert" className="text-sm font-semibold text-[#DC2626]">
                {error}
              </p>
            )}
            {info && (
              <p role="status" className="text-sm font-semibold text-[#16A34A]">
                {info}
              </p>
            )}

            <button type="submit" disabled={busy} className={primaryClass}>
              {t(SUBMIT_LABELS[mode])}
            </button>
          </form>

          <div className="mt-4 flex flex-col items-center gap-1">
            {LINKS[mode].map((link) => (
              <button key={link.key} type="button" className={linkClass} onClick={() => switchMode(link.to)}>
                {t(link.key)}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
