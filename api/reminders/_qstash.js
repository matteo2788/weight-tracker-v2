import { kv } from '@vercel/kv';

export function getBaseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function getLocalTimeParts(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'America/Toronto',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return {
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

export function secondsUntilNextReminder(time = '08:00', timezone = 'America/Toronto') {
  const now = new Date();
  const { hour, minute } = getLocalTimeParts(now, timezone);
  const [targetH, targetM] = String(time || '08:00').split(':').map(Number);

  const nowMinutes = hour * 60 + minute;
  const targetMinutes = (Number.isFinite(targetH) ? targetH : 8) * 60 + (Number.isFinite(targetM) ? targetM : 0);
  let delayMinutes = targetMinutes - nowMinutes;

  if (delayMinutes <= 0) delayMinutes += 24 * 60;

  return Math.max(60, delayMinutes * 60);
}

export async function scheduleNextReminder(req, reminder) {
  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    return { ok: false, error: 'Missing QSTASH_TOKEN. Add Upstash QStash to enable closed-app automatic reminders.' };
  }

  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const nextReminder = {
    ...reminder,
    scheduleNonce: nonce,
    scheduleUpdatedAt: new Date().toISOString(),
  };

  await kv.set(`drift:reminder:${reminder.deviceId}`, nextReminder);

  const delaySeconds = secondsUntilNextReminder(reminder.time, reminder.timezone);
  const destination = `${getBaseUrl(req)}/api/reminders/send-device`;
  const publishUrl = `https://qstash.upstash.io/v2/publish/${encodeURIComponent(destination)}`;

  const qstashRes = await fetch(publishUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Upstash-Delay': `${delaySeconds}s`,
    },
    body: JSON.stringify({
      deviceId: reminder.deviceId,
      nonce,
    }),
  });

  const data = await qstashRes.json().catch(() => ({}));

  if (!qstashRes.ok) {
    const message = data.error || data.message || `QStash schedule failed (${qstashRes.status})`;
    await kv.set(`drift:reminder:${reminder.deviceId}`, { ...nextReminder, scheduleError: message });
    return { ok: false, error: message };
  }

  await kv.set(`drift:reminder:${reminder.deviceId}`, {
    ...nextReminder,
    qstashMessageId: data.messageId || data.deduplicatedMessageId || '',
    nextDelaySeconds: delaySeconds,
    scheduleError: '',
  });

  return { ok: true, delaySeconds, messageId: data.messageId || '' };
}
