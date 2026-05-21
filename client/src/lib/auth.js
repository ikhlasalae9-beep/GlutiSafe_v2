export const USER_KEY = 'user';

export function getStoredUser() {
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    if (!user?.email) return null;

    return {
      ...user,
      email: String(user.email).trim().toLowerCase(),
      name: user.name || String(user.email).split('@')[0] || 'Guest User',
    };
  } catch {
    clearStoredUser();
    return null;
  }
}

export function setStoredUser(user) {
  const email = String(user.email || '').trim().toLowerCase();
  if (!email) {
    clearStoredUser();
    return null;
  }

  const nextUser = {
    name: String(user.name || email.split('@')[0] || 'Guest User').trim(),
    email,
  };

  localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  return nextUser;
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY);
}
