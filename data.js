// Drift — empty default data + small helpers
// The app starts blank. Users can log or import their own weigh-ins.

window.DriftData = (function () {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const TODAY = new Date(start);
  const entries = [];
  const byDate = new Map();
  const latest = { date: TODAY.toISOString().slice(0, 10), dateObj: TODAY, weight: 0, note: '', avg7: 0 };

  return {
    entries,
    byDate,
    today: TODAY,
    stats: {
      today: 0,
      todayAvg: 0,
      weeklyAvg: 0,
      prevWeeklyAvg: 0,
      weekChange: 0,
      monthChange: 0,
      totalChange: 0,
      monthHigh: 0,
      monthLow: 0,
      streak: 0,
      daysLogged: 0,
      daysTotal: 0,
      avgRatePerWeek: 0,
    },
    latest,
    weekAgo: latest,
    monthAgo: latest,
  };
})();

window.fmtWeight = (w) => Number(w || 0).toFixed(1);
window.fmtChange = (c) => {
  const n = Number(c || 0);
  return (n > 0 ? "+" : "") + n.toFixed(1);
};
window.fmtDate = (d) => {
  const dt = typeof d === "string" ? new Date(d + "T00:00:00") : d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
window.fmtDateLong = (d) => {
  const dt = typeof d === "string" ? new Date(d + "T00:00:00") : d;
  return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
};