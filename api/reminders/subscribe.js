import { kv } from '@vercel/kv';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

  try {
    const { deviceId, subscription, time, timezone } = req.body || {};
    if (!deviceId || !subscription || !time) {
      return json(res, 400, { ok: false, error: 'Missing deviceId, subscription, or time' });
    }

    const reminder = {
      deviceId,
      subscription,
      time,
      timezone: timezone || 'America/Toronto',
      enabled: true,
      updatedAt: new Date().toISOString(),
      lastSentDate: '',
    };

    await kv.set(`drift:reminder:${deviceId}`, reminder);
    await kv.sadd('drift:reminder-devices', deviceId);

    return json(res, 200, { ok: true });
  } catch (error) {
    console.error('Subscribe reminder failed:', error);
    return json(res, 500, { ok: false, error: 'Could not save reminder' });
  }
}
