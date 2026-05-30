import { API_URL } from '../config/api.js';
import { supabase } from './supabaseClient.js';

const SESSION_VERIFIED_KEY = 'glutisafe_login_verified';
const TRUSTED_DEVICE_TOKEN_KEY = 'glutisafe_trusted_device_token';

export function markLoginVerified(value) {
  sessionStorage.setItem(SESSION_VERIFIED_KEY, value ? 'true' : 'false');
}

export function isLoginVerified() {
  return sessionStorage.getItem(SESSION_VERIFIED_KEY) === 'true';
}

export function clearLoginVerification() {
  sessionStorage.removeItem(SESSION_VERIFIED_KEY);
}

export function forgetTrustedDevice() {
  localStorage.removeItem(TRUSTED_DEVICE_TOKEN_KEY);
}

export async function checkTrustedDeviceAfterLogin() {
  const deviceToken = localStorage.getItem(TRUSTED_DEVICE_TOKEN_KEY);
  if (!deviceToken) return { trusted: false };

  try {
    const result = await loginSecurityRequest('/api/login-security/check-trusted', { deviceToken });
    if (!result.trusted) localStorage.removeItem(TRUSTED_DEVICE_TOKEN_KEY);
    return result;
  } catch {
    localStorage.removeItem(TRUSTED_DEVICE_TOKEN_KEY);
    return { trusted: false };
  }
}

export async function sendLoginCode() {
  return loginSecurityRequest('/api/login-security/send-code', {});
}

export async function verifyLoginCode({ code, rememberDevice }) {
  const result = await loginSecurityRequest('/api/login-security/verify', {
    code,
    rememberDevice,
    deviceLabel: getDeviceLabel(),
  });

  if (result.deviceToken) {
    localStorage.setItem(TRUSTED_DEVICE_TOKEN_KEY, result.deviceToken);
  }

  markLoginVerified(true);
  return result;
}

async function loginSecurityRequest(path, body) {
  const token = await getAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body || {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || 'Verification de connexion indisponible.');
    error.code = payload.error || '';
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function getAccessToken() {
  if (!supabase) return '';
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

function getDeviceLabel() {
  const platform = navigator.userAgentData?.platform || navigator.platform || '';
  const browser = navigator.userAgentData?.brands?.[0]?.brand || 'Navigateur actuel';
  return `${browser}${platform ? ` - ${platform}` : ''}`;
}
