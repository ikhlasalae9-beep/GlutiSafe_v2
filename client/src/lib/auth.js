export const USER_KEY = 'user';
export const USERS_KEY = 'glutisafe_users';

export function getStoredUser() {
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    if (!user?.email) return null;

    return {
      ...user,
      email: String(user.email).trim().toLowerCase(),
      name: user.name || String(user.email).split('@')[0] || 'Utilisateur',
      role: 'user',
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
    name: String(user.name || email.split('@')[0] || 'Utilisateur').trim(),
    email,
    role: 'user',
  };

  localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  return nextUser;
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY);
}

export function getRegisteredUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return Array.isArray(users)
      ? users
          .filter((user) => user?.email)
          .map((user) => ({
            ...user,
            email: String(user.email).trim().toLowerCase(),
            name: user.name || String(user.email).split('@')[0] || 'Utilisateur',
            role: 'user',
          }))
      : [];
  } catch {
    localStorage.removeItem(USERS_KEY);
    return [];
  }
}

export function isAuthenticated() {
  return Boolean(getStoredUser());
}

export async function registerUser({ name, email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const cleanName = String(name || '').trim();

  if (!cleanName || !normalizedEmail || !password) {
    throw new Error('Tous les champs sont obligatoires.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Veuillez saisir une adresse email valide.');
  }

  if (String(password).length < 6) {
    throw new Error('Le mot de passe doit contenir au moins 6 caracteres.');
  }

  const users = getRegisteredUsers();
  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('Un compte existe deja avec cet email.');
  }

  const nextUser = {
    id: crypto.randomUUID(),
    name: cleanName,
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    role: 'user',
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(USERS_KEY, JSON.stringify([...users, nextUser]));
  return setStoredUser(nextUser);
}

export async function loginUser({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new Error('Email et mot de passe sont obligatoires.');
  }

  const user = getRegisteredUsers().find((item) => item.email === normalizedEmail);
  if (!user || user.passwordHash !== (await hashPassword(password))) {
    throw new Error('Email ou mot de passe incorrect.');
  }

  return setStoredUser(user);
}

async function hashPassword(password) {
  const value = String(password || '');
  if (!globalThis.crypto?.subtle) return `plain:${value}`;

  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
