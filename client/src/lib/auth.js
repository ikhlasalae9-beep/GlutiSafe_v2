import { requireSupabaseClient, supabase } from './supabaseClient.js';

export async function registerUser({ name, email, password }) {
  const client = requireSupabaseClient();
  const normalizedEmail = normalizeEmail(email);
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

  const { data, error } = await client.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: cleanName,
        name: cleanName,
      },
    },
  });

  if (error) throw new Error(cleanAuthError(error));
  return toAppUser(data.user);
}

export async function loginUser({ email, password }) {
  const client = requireSupabaseClient();
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    throw new Error('Email et mot de passe sont obligatoires.');
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) throw new Error(cleanAuthError(error));
  return toAppUser(data.user);
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function clearStoredUser() {
  await signOut();
}

export async function getCurrentUser() {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return toAppUser(data.user);
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user || !supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, pack_status, pack_type, pack_start_at, pack_end_at, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw new Error(cleanSupabaseError(error));
  return data ? normalizeProfile(data) : { ...user, role: 'user' };
}

export function onAuthStateChange(callback) {
  if (!supabase) {
    callback(null);
    return { unsubscribe() {} };
  }

  const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
    callback(session?.user ? toAppUser(session.user) : null);
  });

  return data.subscription;
}

export async function isAuthenticated() {
  return Boolean(await getCurrentUser());
}

export async function getStoredUser() {
  return getCurrentUser();
}

export async function getRegisteredUsers() {
  const profile = await getCurrentProfile();
  if (profile?.role !== 'admin') return [];

  const { data, error } = await requireSupabaseClient()
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(cleanSupabaseError(error));
  return data.map(normalizeProfile);
}

function toAppUser(user) {
  if (!user?.id) return null;

  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur';
  return {
    id: user.id,
    name: fullName,
    email: normalizeEmail(user.email),
    role: 'user',
  };
}

export function normalizeProfile(profile = {}) {
  return {
    id: profile.id,
    name: profile.full_name || profile.email?.split('@')[0] || 'Utilisateur',
    fullName: profile.full_name || '',
    email: normalizeEmail(profile.email),
    role: profile.role || 'user',
    packStatus: profile.pack_status || 'free',
    packType: profile.pack_type || 'none',
    packStartAt: profile.pack_start_at || null,
    packEndAt: profile.pack_end_at || null,
    createdAt: profile.created_at || null,
  };
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function cleanAuthError(error) {
  if (error?.message?.toLowerCase().includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect.';
  }

  return error?.message || 'Impossible de finaliser cette action.';
}

export function cleanSupabaseError(error) {
  if (String(error?.message || '').toLowerCase().includes('row-level security')) {
    return "Accès refusé par les règles de sécurité Supabase.";
  }

  return error?.message || 'Erreur Supabase.';
}
