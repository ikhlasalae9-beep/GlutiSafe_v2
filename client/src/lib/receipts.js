import { API_URL } from '../config/api.js';
import { requireSupabaseClient } from './supabaseClient.js';

const RECEIPT_BUCKET = 'pack-receipts';

export async function getMyReceipts() {
  const client = requireSupabaseClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  const user = authData?.user;

  if (authError || !user?.id) {
    throw new Error('Connectez-vous pour consulter vos recus.');
  }

  const { data, error } = await client
    .from('pack_receipts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return [];
  return data || [];
}

export async function createReceiptSignedUrl(pdfPath) {
  if (!pdfPath) throw new Error('Recu PDF introuvable.');
  const client = requireSupabaseClient();
  const { data, error } = await client.storage.from(RECEIPT_BUCKET).createSignedUrl(pdfPath, 60 * 60);
  if (error) throw new Error(error.message || 'Impossible de preparer le telechargement du recu.');
  return data.signedUrl;
}

export async function openReceiptPdf(pdfPath) {
  const signedUrl = await createReceiptSignedUrl(pdfPath);
  window.open(signedUrl, '_blank', 'noopener,noreferrer');
}

export async function openOwnReceiptPdf(receipt) {
  const client = requireSupabaseClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  const user = authData?.user;

  if (authError || !user?.id || receipt?.user_id !== user.id) {
    return null;
  }

  const signedUrl = await createReceiptSignedUrl(receipt.pdf_path);
  window.open(signedUrl, '_blank', 'noopener,noreferrer');
  return signedUrl;
}

export async function resendReceiptEmail(receiptId) {
  const client = requireSupabaseClient();
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error('Session admin introuvable.');
  }

  const response = await fetch(`${API_URL}/api/admin/receipts/${receiptId}/resend`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Envoi email impossible.');
  }

  return payload;
}

export async function sendAdminTestEmail(to) {
  const client = requireSupabaseClient();
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error('Session admin introuvable.');
  }

  const response = await fetch(`${API_URL}/api/test-email`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Test e-mail impossible.');
  }

  return payload;
}
