import { blockUser } from '../../../_lib/adminStats.js';
import { allowPostOnly } from '../../../_lib/request.js';

export default async function handler(req, res) {
  if (allowPostOnly(req, res)) return;

  try {
    const result = await blockUser({
      requesterToken: readBearerToken(req),
      userId: req.query.id,
    });
    return res.status(200).json(result);
  } catch (error) {
    return sendAdminError(res, error);
  }
}

function readBearerToken(req) {
  return String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
}

function sendAdminError(res, error) {
  console.error('[vercel-admin:block] failed', { message: error.message });
  return res.status(error.status || 503).json({
    error: 'ADMIN_ACTION_UNAVAILABLE',
    message: error.message || 'Action admin impossible.',
  });
}
