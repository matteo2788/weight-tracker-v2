import { kv } from '@vercel/kv';
import webpush from 'web-push';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:oryxfitnessco@gmail.com';

  if (!publicKey || !privateKey) {
    return json(res, 500, { ok: false, error: 'Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY' });
  }

  try {
    const { deviceId } = req.body || {};
    if (!deviceId) return json(res, 400, { ok: false, error: 'Missing deviceId' });

    const key = `drift:reminder:${deviceId}`;
    const reminder = await kv.get(key);
    if (!reminder || !reminder.subscription) {
      return json(res, 404, { ok: false, error: 'No saved push subscription found for this device' });
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    await webpush.sendNotification(reminder.subscription, JSON.stringify({
      title: 'Drift',
      body: 'Log your weight',
      tag: 'drift-backend-test',
      url: '/',
    }));

    return json(res, 200, { ok: true });
  } catch (error) {
    const status = error && (error.statusCode || error.status);
    console.error('Backend test push failed:', error);
    return json(res, 500, { ok: false, error: `Backend test push failed${status ? ` (${status})` : ''}` });
  }
}
