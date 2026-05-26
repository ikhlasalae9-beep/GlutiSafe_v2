import { Router } from 'express';
import { activateUserPack, blockUser, deleteUserAccount, expireUserPack, makeUserAdmin, readAdminStats, unblockUser } from '../lib/adminStats.js';

const router = Router();

router.get('/admin/stats', async (_req, res) => {
  try {
    const stats = await readAdminStats({ requesterToken: readBearerToken(req) });
    res.json(stats);
  } catch (error) {
    sendAdminError(res, error);
  }
});

router.post('/admin/users/:id/activate-pack', async (req, res) => {
  try {
    const result = await activateUserPack({
      requesterToken: readBearerToken(req),
      userId: req.params.id,
      packType: req.body?.pack_type,
    });
    res.json(result);
  } catch (error) {
    sendAdminError(res, error);
  }
});

router.post('/admin/users/:id/expire-pack', async (req, res) => {
  try {
    const result = await expireUserPack({
      requesterToken: readBearerToken(req),
      userId: req.params.id,
    });
    res.json(result);
  } catch (error) {
    sendAdminError(res, error);
  }
});

router.post('/admin/users/:id/block', async (req, res) => {
  try {
    const result = await blockUser({
      requesterToken: readBearerToken(req),
      userId: req.params.id,
    });
    res.json(result);
  } catch (error) {
    sendAdminError(res, error);
  }
});

router.post('/admin/users/:id/unblock', async (req, res) => {
  try {
    const result = await unblockUser({
      requesterToken: readBearerToken(req),
      userId: req.params.id,
    });
    res.json(result);
  } catch (error) {
    sendAdminError(res, error);
  }
});

router.post('/admin/users/:id/make-admin', async (req, res) => {
  try {
    const result = await makeUserAdmin({
      requesterToken: readBearerToken(req),
      userId: req.params.id,
    });
    res.json(result);
  } catch (error) {
    sendAdminError(res, error);
  }
});

router.post('/admin/delete-user', async (req, res) => {
  try {
    const result = await deleteUserAccount({
      requesterToken: readBearerToken(req),
      userId: req.body?.userId,
      deleteAnalyses: Boolean(req.body?.deleteAnalyses),
    });
    res.json(result);
  } catch (error) {
    sendAdminError(res, error);
  }
});

function readBearerToken(req) {
  return String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
}

function sendAdminError(res, error) {
  console.error('[admin:action] failed', { message: error.message });
  res.status(error.status || 503).json({
    error: 'ADMIN_ACTION_UNAVAILABLE',
    message: error.message || 'Action admin impossible.',
  });
}

export default router;
