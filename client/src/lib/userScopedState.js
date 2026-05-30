export const USER_SCOPED_STATE_CLEARED_EVENT = 'glutisafe:user-scoped-state-cleared';
export const CHATBOT_CONTEXT_KEY = 'glutisafe_last_scan_context';
export const CHATBOT_MESSAGES_KEY = 'glutisafe_chatbot_messages';
export const LOGIN_VERIFIED_KEY = 'glutisafe_login_verified';
export const TRUSTED_DEVICE_TOKEN_KEY = 'glutisafe_trusted_device_token';

const USER_SCOPED_STORAGE_KEYS = [
  LOGIN_VERIFIED_KEY,
  CHATBOT_CONTEXT_KEY,
  CHATBOT_MESSAGES_KEY,
  'glutisafe_latest_analysis',
  'glutisafe_scan_context',
  'glutisafe_assistant_context',
  'glutisafe_assistant_messages',
  'glutisafe_profile',
  'glutisafe_history',
  'glutisafe_receipts',
  'glutisafe_payment_requests',
  'glutisafe_usage',
  'latestAnalysis',
  'scanContext',
  'assistantContext',
  'assistantMessages',
  'chatMessages',
  'profile',
  'receipts',
  'analyses',
  'paymentRequests',
  'usage',
];

export function clearUserScopedState({ reason = 'reset', nextUserId = '', preserveLoginVerification = false } = {}) {
  removeUserScopedStorage(sessionStorage, { preserveLoginVerification });
  removeUserScopedStorage(localStorage, { preserveLoginVerification });

  window.dispatchEvent(
    new CustomEvent(USER_SCOPED_STATE_CLEARED_EVENT, {
      detail: { reason, nextUserId },
    }),
  );
}

export function onUserScopedStateCleared(callback) {
  const handler = (event) => callback(event.detail || {});
  window.addEventListener(USER_SCOPED_STATE_CLEARED_EVENT, handler);
  return () => window.removeEventListener(USER_SCOPED_STATE_CLEARED_EVENT, handler);
}

function removeUserScopedStorage(storage, { preserveLoginVerification = false } = {}) {
  if (!storage) return;

  USER_SCOPED_STORAGE_KEYS.forEach((key) => {
    if (preserveLoginVerification && key === LOGIN_VERIFIED_KEY) return;
    if (key !== TRUSTED_DEVICE_TOKEN_KEY) storage.removeItem(key);
  });

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (!key || key === TRUSTED_DEVICE_TOKEN_KEY) continue;
    if (key.startsWith('glutisafe_user:') || key.startsWith('glutisafe_chat:') || key.startsWith('glutisafe_scan:')) {
      storage.removeItem(key);
    }
  }
}
