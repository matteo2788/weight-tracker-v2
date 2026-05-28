import { kv } from '@vercel/kv';
import webpush from 'web-push';
import { json, scheduleNextReminder } from './_qstash.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:oryxfitnessco@gmail.com';

  if (!publicKey || !privateKey) {
    return json(res, 500, { ok: false, error: 'Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY' });
  }

  try {
    const { deviceId, nonce } = req.body || {};
    if (!deviceId || !nonce) return json(res, 400, { ok: false, error: 'Missing deviceId or nonce' });

    const key = `drift:reminder:${deviceId}`;
    const reminder = await kv.get(key);
    if (!reminder || !reminder.enabled || !reminder.subscription) {
      return json(res, 404, { ok: false, error: 'Reminder is not active for this device' });
    }

    if (reminder.scheduleNonce !== nonce) {
      return json(res, 200, { ok: true, skipped: true, reason: 'Old scheduled reminder ignored' });
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    try {
      await webpush.sendNotification(reminder.subscription, JSON.stringify({
        title: 'Drift',
        body: 'Log your weight',
        tag: 'drift-daily-weigh-in',
        url: '/',
      }));

      await kv.set(key, {
        ...reminder,
        lastSentAt: new Date().toISOString(),
        sendError: '',
      });
    } catch (error) {
      const status = error && (error.statusCode || error.status);
      if (status === 404 || status === 410) {
        await kv.del(key);
        await kv.srem('drift:reminder-devices', deviceId);
        return json(res, 410, { ok: false, error: 'Push subscription expired and was removed' });
      }

      await kv.set(key, { ...reminder, sendError: `Push send failed${status ? ` (${status})` : ''}` });
      throw error;
    }

    const fresh = await kv.get(key);
    const scheduled = await scheduleNextReminder(req, fresh || reminder);

    return json(res, 200, { ok: true, sent: true, nextScheduled: scheduled.ok, scheduleError: scheduled.error || '' });
  } catch (error) {
    console.error('QStash device reminder failed:', error);
    return json(res, 500, { ok: false, error: 'Could not send device reminder' });
  }
}
