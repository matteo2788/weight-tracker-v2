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

    const reminder = await kv.get(`drift:reminder:${deviceId}`);
    if (!reminder) return json(res, 404, { ok: false, error: 'No reminder found for this device' });

    return json(res, 200, {
      ok: true,
      enabled: !!reminder.enabled,
      time: reminder.time || '',
      timezone: reminder.timezone || '',
      scheduleError: reminder.scheduleError || '',
      sendError: reminder.sendError || '',
      nextDelaySeconds: reminder.nextDelaySeconds || null,
      qstashMessageId: reminder.qstashMessageId || '',
      scheduleUpdatedAt: reminder.scheduleUpdatedAt || '',
      lastSentAt: reminder.lastSentAt || '',
    });
  } catch (error) {
    console.error('Reminder status failed:', error);
    return json(res, 500, { ok: false, error: 'Could not read reminder status' });
  }
}
