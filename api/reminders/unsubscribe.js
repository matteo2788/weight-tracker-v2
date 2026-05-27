import { kv } from '@vercel/kv';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

  try {
    const { deviceId } = req.body || {};
    if (!deviceId) return json(res, 400, { ok: false, error: 'Missing deviceId' });

    await kv.del(`drift:reminder:${deviceId}`);
    await kv.srem('drift:reminder-devices', deviceId);

    return json(res, 200, { ok: true });
  } catch (error) {
    console.error('Unsubscribe reminder failed:', error);
    return json(res, 500, { ok: false, error: 'Could not remove reminder' });
  }
}
