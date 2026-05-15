// Vercel Serverless Function: /api/auth-verify-code
// Проверяет связку (token, code). Если HMAC сходится и не истёк TTL — возвращает session-токен.

import crypto from 'crypto';

const CODE_TTL_MS = 10 * 60 * 1000; // 10 минут
const SESSION_TTL_DAYS = 30;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: 'Bad JSON' });
  }
  const { token, code } = body || {};
  if (!token || !code) return res.status(400).json({ error: 'Введите код' });

  const secret = process.env.AUTH_SECRET;
  if (!secret) return res.status(500).json({ error: 'AUTH_SECRET not configured' });

  let decoded;
  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8');
  } catch (e) {
    return res.status(400).json({ error: 'Неверный токен' });
  }
  const parts = decoded.split('|');
  if (parts.length !== 3) return res.status(400).json({ error: 'Неверный токен' });
  const [email, issuedAtStr, expectedSig] = parts;
  const issuedAt = parseInt(issuedAtStr, 10);

  if (!issuedAt || Date.now() - issuedAt > CODE_TTL_MS) {
    return res.status(401).json({ error: 'Код истёк. Запросите новый.' });
  }

  // Перевычисляем HMAC с присланным кодом
  const payload = `${email}|${String(code).trim()}|${issuedAt}`;
  const actualSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  // timing-safe сравнение
  let ok = false;
  try {
    const a = Buffer.from(actualSig, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (e) { ok = false; }

  if (!ok) return res.status(401).json({ error: 'Неверный код' });

  // Выдаём session-токен (тоже stateless с HMAC)
  const sessionExpiry = Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  const sessionPayload = `${email}|${sessionExpiry}`;
  const sessionSig = crypto.createHmac('sha256', secret).update('session:' + sessionPayload).digest('hex');
  const sessionToken = Buffer.from(`${sessionPayload}|${sessionSig}`).toString('base64url');

  return res.status(200).json({ email, sessionToken, expiresAt: sessionExpiry });
}
