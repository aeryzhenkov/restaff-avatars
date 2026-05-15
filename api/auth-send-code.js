// Vercel Serverless Function: /api/auth-send-code
// Принимает email, генерирует 6-значный код, отправляет через Resend.
// Код подписывается HMAC-SHA256 и возвращается клиенту (stateless подход).
// Клиент сохраняет токен в localStorage, при подтверждении кода — отправляет токен и код обратно.

import crypto from 'crypto';

const ALLOWED_DOMAINS = ['restaff.pro', 'restaff.tech', 'staffco.ru'];
const CODE_TTL_MS = 10 * 60 * 1000; // 10 минут

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: 'Bad JSON' });
  }
  const email = (body && body.email || '').trim().toLowerCase();
  if (!email.includes('@')) return res.status(400).json({ error: 'Введите корректный email' });
  const domain = email.split('@')[1];
  if (!ALLOWED_DOMAINS.includes(domain)) {
    return res.status(403).json({ error: 'Доступ только для сотрудников ReStaff' });
  }

  const secret = process.env.AUTH_SECRET;
  const resendKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.AUTH_SENDER_EMAIL || 'noreply@restaff.pro';
  if (!secret) return res.status(500).json({ error: 'AUTH_SECRET not configured' });
  if (!resendKey) return res.status(500).json({ error: 'RESEND_API_KEY not configured' });

  // Генерируем 6-значный код
  const code = String(crypto.randomInt(100000, 1000000));
  const issuedAt = Date.now();

  // Создаём stateless токен: payload + HMAC подпись
  // payload = email|code|issuedAt
  const payload = `${email}|${code}|${issuedAt}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const token = Buffer.from(`${email}|${issuedAt}|${sig}`).toString('base64url');

  // Отправляем код через Resend
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `ReStaff Avatars <${senderEmail}>`,
        to: [email],
        subject: `Код входа: ${code}`,
        html: `
          <div style="font-family:-apple-system,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a24">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#7C3AED;margin-bottom:12px;font-weight:600">ReStaff Avatars</div>
            <h1 style="font-size:22px;font-weight:600;margin:0 0 12px;line-height:1.3">Ваш код входа</h1>
            <p style="font-size:14px;color:#6b6b78;line-height:1.5;margin:0 0 28px">Введите этот код в окне входа. Действует 10 минут.</p>
            <div style="background:#f5f3fc;border:1px solid #e9e3fc;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <div style="font-size:32px;font-weight:600;letter-spacing:0.2em;color:#7C3AED;font-family:'SF Mono',Menlo,Consolas,monospace">${code}</div>
            </div>
            <p style="font-size:12px;color:#a8a8b3;line-height:1.5;margin:0">Если вы не запрашивали код — просто проигнорируйте это письмо.</p>
          </div>
        `,
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Resend error:', resp.status, errText);
      return res.status(500).json({ error: 'Не получилось отправить письмо. Попробуйте позже.' });
    }
  } catch (e) {
    console.error('Send error:', e);
    return res.status(500).json({ error: 'Ошибка отправки' });
  }

  // ВАЖНО: код НЕ отправляем клиенту, только токен.
  // Чтобы подтвердить — клиент должен прислать токен + код, и сервер проверит HMAC.
  return res.status(200).json({ token, ttl: CODE_TTL_MS / 1000 });
}
