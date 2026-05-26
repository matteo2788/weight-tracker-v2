// Drift — synthetic weight data + small helpers
// Build ~120 days of weight log with a gentle downward trend + daily noise + missed days.

window.DriftData = (function () {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const TODAY = new Date(start);

  // Deterministic-ish PRNG so the chart looks the same each refresh
  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const DAYS = 120;
  const STARTING_WEIGHT = 184.4; // lb
  const TARGET_END = 176.8;
  const entries = [];

  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - i);

    // Linear trend with weekly cycle + noise
    const progress = (DAYS - 1 - i) / (DAYS - 1);
    const trend = STARTING_WEIGHT + (TARGET_END - STARTING_WEIGHT) * progress;
    const weekly = Math.sin(((DAYS - 1 - i) / 7) * Math.PI * 2) * 0.5;
    const noise = (rand() - 0.5) * 2.4;
    const weight = +(trend + weekly + noise).toFixed(1);

    // Skip a few days to simulate missed entries (about 14%)
    const skip = rand() < 0.14 && i > 2 && i < DAYS - 1;
    if (!skip) {
      entries.push({
        date: d.toISOString().slice(0, 10),
        dateObj: d,
        weight,
        note: noteFor(d, i, weight),
      });
    }
  }

  function noteFor(d, i, w) {
    const day = d.getDay();
    if (i === 0) return "Morning, post-coffee.";
    if (day === 0 && rand() < 0.3) return "Saturday dinner showing.";
    if (rand() < 0.08) return "Felt lighter than expected.";
    if (rand() < 0.05) return "Slept poorly.";
    return "";
  }

  // 7-day moving average aligned to each entry by date
  const byDate = new Map(entries.map(e => [e.date, e]));
  const rolling = entries.map(e => {
    const d = new Date(e.dateObj);
    const win = [];
    for (let k = 0; k < 7; k++) {
      const dd = new Date(d); dd.setDate(dd.getDate() - k);
      const key = dd.toISOString().slice(0, 10);
      if (byDate.has(key)) win.push(byDate.get(key).weight);
    }
    return {
      ...e,
      avg7: win.length ? +(win.reduce((a, b) => a + b, 0) / win.length).toFixed(2) : e.weight,
    };
  });

  const latest = rolling[rolling.length - 1];
  const weekAgo = rolling[rolling.length - 8] || rolling[0];
  const monthAgo = rolling[rolling.length - 31] || rolling[0];
  const first = rolling[0];

  // Streak from end going back; count consecutive logged days
  let streak = 0;
  {
    let cur = new Date(TODAY);
    while (true) {
      const key = cur.toISOString().slice(0, 10);
      if (byDate.has(key)) {
        streak++;
        cur.setDate(cur.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // monthly stats — last 30 days window
  const last30 = rolling.slice(-30);
  const monthHigh = Math.max(...last30.map(e => e.weight));
  const monthLow = Math.min(...last30.map(e => e.weight));

  const weekData = rolling.slice(-7);
  const weeklyAvg = +(weekData.reduce((a, b) => a + b.weight, 0) / weekData.length).toFixed(1);
  const prevWeekData = rolling.slice(-14, -7);
  const prevWeeklyAvg = prevWeekData.length ? +(prevWeekData.reduce((a, b) => a + b.weight, 0) / prevWeekData.length).toFixed(1) : weeklyAvg;

  const stats = {
    today: latest.weight,
    todayAvg: latest.avg7,
    weeklyAvg,
    prevWeeklyAvg,
    weekChange: +(latest.avg7 - weekAgo.avg7).toFixed(1),
    monthChange: +(latest.avg7 - monthAgo.avg7).toFixed(1),
    totalChange: +(latest.avg7 - first.avg7).toFixed(1),
    monthHigh, monthLow,
    streak,
    daysLogged: rolling.length,
    daysTotal: DAYS,
    avgRatePerWeek: +(((latest.avg7 - monthAgo.avg7) / 4)).toFixed(2),
  };

  return {
    entries: rolling,
    byDate,
    today: TODAY,
    stats,
    latest,
    weekAgo, monthAgo,
  };
})();

window.fmtWeight = (w) => Number(w).toFixed(1);
window.fmtChange = (c) => (c > 0 ? "+" : "") + c.toFixed(1);
window.fmtDate = (d) => {
  const dt = typeof d === "string" ? new Date(d + "T00:00:00") : d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
window.fmtDateLong = (d) => {
  const dt = typeof d === "string" ? new Date(d + "T00:00:00") : d;
  return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
};
