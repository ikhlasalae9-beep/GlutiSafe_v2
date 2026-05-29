import nodemailer from 'nodemailer';

export async function sendPackConfirmationEmail({
  to,
  customerName,
  packType,
  startDate,
  endDate,
  amount,
  receiptNumber,
}) {
  validateSmtpEnv();

  console.log('[EMAIL] provider:', process.env.EMAIL_PROVIDER);
  console.log('[EMAIL] sending to:', to);
  console.log('[EMAIL] from:', process.env.FROM_EMAIL);
  console.log('[EMAIL] smtp user:', process.env.SMTP_USER);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const siteUrl = cleanText(process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://gluti-safe-v2.vercel.app');
  const packLabel = packType === 'yearly' ? 'Annuel' : 'Mensuel';

  try {
    return await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject: 'Votre pack GlutiSafe est activé',
      html: buildPackConfirmationHtml({
        customerName,
        packLabel,
        startDate,
        endDate,
        amount,
        receiptNumber,
        profileUrl: `${siteUrl}/profile`,
      }),
    });
  } catch (error) {
    console.error('[EMAIL] failed:', error);
    throw error;
  }
}

export async function sendTestEmail({ to }) {
  validateSmtpEnv();

  console.log('[EMAIL] provider:', process.env.EMAIL_PROVIDER);
  console.log('[EMAIL] sending to:', to);
  console.log('[EMAIL] from:', process.env.FROM_EMAIL);
  console.log('[EMAIL] smtp user:', process.env.SMTP_USER);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    return await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject: 'Test e-mail GlutiSafe',
      html: '<div style="font-family:Arial,sans-serif;color:#1d252b;line-height:1.6"><h1 style="color:#008f45">Test e-mail GlutiSafe</h1><p>La configuration Gmail SMTP fonctionne.</p><p>GlutiSafe — Scan, Check, Stay Safe</p></div>',
    });
  } catch (error) {
    console.error('[EMAIL] failed:', error);
    throw error;
  }
}

function validateSmtpEnv() {
  if (!process.env.SMTP_USER) throw new Error('SMTP_USER missing');
  if (!process.env.SMTP_PASS) throw new Error('SMTP_PASS missing');
  if (!process.env.FROM_EMAIL) throw new Error('FROM_EMAIL missing');
}

function buildPackConfirmationHtml({ customerName, packLabel, startDate, endDate, amount, receiptNumber, profileUrl }) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f7f8f6;padding:28px;color:#1d252b">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dfe8df;border-radius:18px;overflow:hidden">
        <div style="background:#008f45;color:#ffffff;padding:24px 28px">
          <h1 style="margin:0;font-size:24px">Votre pack est activé</h1>
          <p style="margin:6px 0 0;font-weight:700">GlutiSafe — Scan, Check, Stay Safe</p>
        </div>
        <div style="padding:28px">
          <p>Bonjour ${escapeHtml(customerName || 'Client')},</p>
          <p>Votre paiement a été confirmé et votre Pack ${escapeHtml(packLabel)} est maintenant actif.</p>
          <table style="width:100%;border-collapse:collapse;margin:22px 0">
            <tr><td style="padding:10px;border-bottom:1px solid #dfe8df;font-weight:700">Date de début</td><td style="padding:10px;border-bottom:1px solid #dfe8df">${escapeHtml(startDate)}</td></tr>
            <tr><td style="padding:10px;border-bottom:1px solid #dfe8df;font-weight:700">Date de fin</td><td style="padding:10px;border-bottom:1px solid #dfe8df">${escapeHtml(endDate)}</td></tr>
            <tr><td style="padding:10px;border-bottom:1px solid #dfe8df;font-weight:700">Montant</td><td style="padding:10px;border-bottom:1px solid #dfe8df">${escapeHtml(amount)} MAD</td></tr>
            <tr><td style="padding:10px;border-bottom:1px solid #dfe8df;font-weight:700">Numéro de reçu</td><td style="padding:10px;border-bottom:1px solid #dfe8df">${escapeHtml(receiptNumber)}</td></tr>
          </table>
          <p><a href="${profileUrl}" style="display:inline-block;background:#008f45;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700">Accéder à mon profil</a></p>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cleanText(value) {
  return String(value || '').trim();
}
