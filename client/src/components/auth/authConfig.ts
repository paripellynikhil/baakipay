import type { TranslationKey } from '../../i18n/translations';

export type Mode = 'login' | 'signup' | 'forgot' | 'reset';

export const HEADINGS: Record<Mode, TranslationKey> = { login: 'auth_login', signup: 'auth_signup', forgot: 'auth_forgot', reset: 'auth_forgot' };

export const SUBMIT_LABELS: Record<Mode, TranslationKey> = {
  login: 'auth_signIn',
  signup: 'auth_createAccount',
  forgot: 'auth_sendOtp',
  reset: 'auth_resetPassword',
};

export const LINKS: Record<Mode, { key: TranslationKey; to: Mode }[]> = {
  login: [
    { key: 'auth_toSignup', to: 'signup' },
    { key: 'auth_forgotLink', to: 'forgot' },
  ],
  signup: [{ key: 'auth_toLogin', to: 'login' }],
  forgot: [{ key: 'auth_backToLogin', to: 'login' }],
  reset: [{ key: 'auth_backToLogin', to: 'login' }],
};
