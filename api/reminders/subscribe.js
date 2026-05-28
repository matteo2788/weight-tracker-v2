import { kv } from '@vercel/kv';
import { json, scheduleNextReminder } from './_qstash.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

  try {
    const { deviceId, subscription, time, timezone } = req.body || {};
    if (!deviceId || !subscription || !time) {
      return json(res, 400, { ok: false, error: 'Missing deviceId, subscription, or time' });
    }

    const previous = await kv.get(`drift:reminder:${deviceId}`);
    const reminder = {
      ...(previous || {}),
      deviceId,
      subscription,
      time,
      timezone: timezone || 'America/Toronto',
      enabled: true,
      updatedAt: new Date().toISOString(),
      lastSentDate: previous?.lastSentDate || '',
    };

    await kv.set(`drift:reminder:${deviceId}`, reminder);
    await kv.sadd('drift:reminder-devices', deviceId);

    const scheduled = await scheduleNextReminder(req, reminder);

    if (!scheduled.ok) {
      return json(res, 200, {
        ok: true,
        scheduled: false,
        warning: scheduled.error,
      });
    }

    return json(res, 200, { ok: true, scheduled: true, delaySeconds: scheduled.delaySeconds });
  } catch (error) {
    console.error('Subscribe reminder failed:', error);
    return json(res, 500, { ok: false, error: 'Could not save reminder' });
  }
}
