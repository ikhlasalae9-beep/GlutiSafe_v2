import { deleteUserAccount } from '../_lib/adminStats.js';
import { allowPostOnly, readJsonBody } from '../_lib/request.js';

export default async function handler(req, res) {
  if (allowPostOnly(req, res)) return;

  try {
    const body = await readJsonBody(req);
    const result = await deleteUserAccount({
      requesterToken: readBearerToken(req),
      userId: body.userId,
      deleteAnalyses: Boolean(body.deleteAnalyses),
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error('[vercel-admin:delete-user] failed', { message: error.message });
    return res.status(error.status || 503).json({
      error: 'ADMIN_ACTION_UNAVAILABLE',
      message: error.message || 'Action admin impossible.',
    });
  }
}

function readBearerToken(req) {
  return String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
}
