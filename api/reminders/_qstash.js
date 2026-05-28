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
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return {
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second || 0),
  };
}

export function secondsUntilNextReminder(time = '08:00', timezone = 'America/Toronto') {
  const now = new Date();
  const { hour, minute, second } = getLocalTimeParts(now, timezone);
  const [targetH, targetM] = String(time || '08:00').split(':').map(Number);

  const nowSeconds = hour * 3600 + minute * 60 + second;
  const targetSeconds = (Number.isFinite(targetH) ? targetH : 8) * 3600 + (Number.isFinite(targetM) ? targetM : 0) * 60;
  let delaySeconds = targetSeconds - nowSeconds;

  // If the selected minute is the current minute, schedule shortly instead of waiting until tomorrow.
  // This makes quick tests like 12:08 while it is already 12:08 still fire.
  if (delaySeconds <= 0 && delaySeconds > -60) delaySeconds = 75;
  if (delaySeconds <= -60) delaySeconds += 24 * 3600;

  return Math.max(60, delaySeconds);
}

export async function scheduleNextReminder(req, reminder, overrideDelaySeconds = null) {
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

  const delaySeconds = overrideDelaySeconds || secondsUntilNextReminder(reminder.time, reminder.timezone);
  const destination = `${getBaseUrl(req)}/api/reminders/send-device`;
  const publishUrl = `https://qstash.upstash.io/v2/publish/${destination}`;

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
    return { ok: false, error: message, status: qstashRes.status };
  }

  await kv.set(`drift:reminder:${reminder.deviceId}`, {
    ...nextReminder,
    qstashMessageId: data.messageId || data.deduplicatedMessageId || '',
    nextDelaySeconds: delaySeconds,
    scheduleError: '',
  });

  return { ok: true, delaySeconds, messageId: data.messageId || data.deduplicatedMessageId || '' };
}
