const SANDBOX_OTP = '123456';

function isSandbox() {
  return process.env.OTP_PROVIDER === 'sandbox';
}

async function sendOtp(contact) {
  if (isSandbox()) {
    return { sent: true, sandboxOtpHint: SANDBOX_OTP };
  }
  // Production MSG91 / Email adapter plugs in here.
  const err = new Error('OTP provider not configured');
  err.code = 'OTP_PROVIDER_NOT_CONFIGURED';
  throw err;
}

function verifyOtp(code) {
  return isSandbox() && String(code) === SANDBOX_OTP;
}

module.exports = { sendOtp, verifyOtp, isSandbox, SANDBOX_OTP };
