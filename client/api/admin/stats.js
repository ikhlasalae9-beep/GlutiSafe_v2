import { readAdminStats } from '../_lib/adminStats.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' });
  }

  try {
    const stats = await readAdminStats({ requesterToken: readBearerToken(req) });
    return res.status(200).json(stats);
  } catch (error) {
    console.error('[vercel-admin:stats] failed', { message: error.message });
    return res.status(error.status || 503).json({
      error: 'ADMIN_STATS_UNAVAILABLE',
      message: error.message || 'Impossible de charger les statistiques admin.',
    });
  }
}

function readBearerToken(req) {
  return String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
}
