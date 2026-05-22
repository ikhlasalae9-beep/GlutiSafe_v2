const ADMIN_SESSION_KEY = 'glutisafe_principal_admin';

const PRINCIPAL_ADMIN = {
  identifier: 'AI109-OU',
  password: 'Alaeikhlas@2006',
  role: 'principal_admin',
  name: 'Alae',
};

export function loginPrincipalAdmin({ identifier, password }) {
  const isValid =
    String(identifier || '').trim() === PRINCIPAL_ADMIN.identifier &&
    String(password || '') === PRINCIPAL_ADMIN.password;

  if (!isValid) {
    throw new Error('Identifiant ou mot de passe incorrect.');
  }

  const session = {
    name: PRINCIPAL_ADMIN.name,
    role: PRINCIPAL_ADMIN.role,
    authenticatedAt: new Date().toISOString(),
  };

  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getPrincipalAdminSession() {
  try {
    const session = JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) || 'null');
    return session?.role === PRINCIPAL_ADMIN.role ? session : null;
  } catch {
    clearPrincipalAdminSession();
    return null;
  }
}

export function clearPrincipalAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}
