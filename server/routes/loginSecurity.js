import { Router } from 'express';
import { checkTrustedLoginDevice, sendLoginVerificationCode, verifyLoginCode } from '../../client/src/server/loginSecurity.js';

const router = Router();

router.post('/login-security/check-trusted', async (req, res) => {
  sendLoginSecurityResult(res, checkTrustedLoginDevice({ requesterToken: readBearerToken(req), deviceToken: req.body?.deviceToken }));
});

router.post('/login-security/send-code', async (req, res) => {
  sendLoginSecurityResult(res, sendLoginVerificationCode({ requesterToken: readBearerToken(req) }));
});

router.post('/login-security/verify', async (req, res) => {
  sendLoginSecurityResult(
    res,
    verifyLoginCode({
      requesterToken: readBearerToken(req),
      code: req.body?.code,
      rememberDevice: Boolean(req.body?.rememberDevice),
      deviceLabel: req.body?.deviceLabel,
    }),
  );
});

function readBearerToken(req) {
  return String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
}

async function sendLoginSecurityResult(res, promise) {
  try {
    res.json(await promise);
  } catch (error) {
    console.error('[login-security] request failed', { message: error.message, reason: error.reason });
    res.status(error.status || 503).json({
      error: error.reason || 'LOGIN_SECURITY_UNAVAILABLE',
      message: safeLoginSecurityMessage(error),
    });
  }
}

function safeLoginSecurityMessage(error) {
  if (['wrong_code', 'expired', 'too_many_attempts'].includes(error.reason)) return error.message;
  if (error.status === 503 && String(error.message || '').includes("Impossible d'envoyer")) return error.message;
  return 'Verification de connexion indisponible.';
}

export default router;
