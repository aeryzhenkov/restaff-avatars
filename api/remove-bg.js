// Vercel Serverless Function: /api/remove-bg
// Принимает фото от фронта, отправляет на remove.bg с секретным ключом,
// возвращает PNG без фона. Ключ читается из переменной окружения REMOVE_BG_API_KEY.

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '15mb',
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  try {
    // Собираем тело запроса вручную (bodyParser отключен)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Формируем multipart/form-data для remove.bg
    const boundary = '----restaffavatars' + Date.now();
    const contentType = req.headers['content-type'] || 'image/jpeg';

    // Парсим оригинальный multipart (фронт отправляет image_file)
    // Простая логика: фронт отправляет raw image bytes с заголовком
    // image-content-type
    const imageContentType = req.headers['x-image-type'] || 'image/jpeg';

    const formStart = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="image_file"; filename="photo.jpg"\r\n` +
      `Content-Type: ${imageContentType}\r\n\r\n`
    );
    const formMiddle = Buffer.from(
      `\r\n--${boundary}\r\n` +
      `Content-Disposition: form-data; name="size"\r\n\r\nauto\r\n` +
      `--${boundary}--\r\n`
    );
    const body = Buffer.concat([formStart, buffer, formMiddle]);

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(body.length),
      },
      body,
    });

    if (!response.ok) {
      let errorMsg = `remove.bg returned HTTP ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.errors && errData.errors[0]) {
          errorMsg = errData.errors[0].title || errorMsg;
        }
      } catch (e) {}
      if (response.status === 402) errorMsg = 'Месячный лимит remove.bg исчерпан';
      if (response.status === 403) errorMsg = 'Серверный ключ remove.bg недействителен';
      return res.status(response.status).json({ error: errorMsg });
    }

    // Возвращаем PNG напрямую
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(imageBuffer);

  } catch (e) {
    console.error('remove-bg proxy error:', e);
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
