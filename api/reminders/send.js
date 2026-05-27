import { kv } from '@vercel/kv';
import webpush from 'web-push';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function getLocalParts(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return {
    dateKey: `${map.year}-${map.month}-${map.day}`,
    timeKey: `${map.hour}:${map.minute}`,
  };
}

function isDue(reminder, now = new Date()) {
  const { dateKey, timeKey } = getLocalParts(now, reminder.timezone);
  if (reminder.lastSentDate === dateKey) return false;

  const [nowH, nowM] = timeKey.split(':').map(Number);
  const [targetH, targetM] = String(reminder.time || '08:00').split(':').map(Number);
  const nowMinutes = nowH * 60 + nowM;
  const targetMinutes = targetH * 60 + targetM;

  return nowMinutes >= targetMinutes && nowMinutes < targetMinutes + 10;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:oryxfitnessco@gmail.com';

  if (!publicKey || !privateKey) {
    return json(res, 500, { ok: false, error: 'Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY' });
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  try {
    const deviceIds = await kv.smembers('drift:reminder-devices');
    let checked = 0;
    let sent = 0;
    let removed = 0;
    const now = new Date();

    for (const deviceId of deviceIds || []) {
      const key = `drift:reminder:${deviceId}`;
      const reminder = await kv.get(key);
      if (!reminder || !reminder.enabled) continue;
      checked++;

      if (!isDue(reminder, now)) continue;

      try {
        await webpush.sendNotification(reminder.subscription, JSON.stringify({
          title: 'Drift',
          body: 'Log your weight',
          tag: 'drift-daily-weigh-in',
          url: '/',
        }));

        const { dateKey } = getLocalParts(now, reminder.timezone);
        await kv.set(key, { ...reminder, lastSentDate: dateKey, lastSentAt: now.toISOString() });
        sent++;
      } catch (error) {
        const status = error && (error.statusCode || error.status);
        if (status === 404 || status === 410) {
          await kv.del(key);
          await kv.srem('drift:reminder-devices', deviceId);
          removed++;
        } else {
          console.error('Push send failed:', deviceId, error);
        }
      }
    }

    return json(res, 200, { ok: true, checked, sent, removed });
  } catch (error) {
    console.error('Send reminders failed:', error);
    return json(res, 500, { ok: false, error: 'Could not send reminders' });
  }
}
