(function () {
  const STORAGE_KEY = 'drift-weight-entries-v1';

  function todayDate() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function toKey(value) {
    const d = typeof value === 'string' ? new Date(value + 'T00:00:00') : new Date(value);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }

  function cleanEntries(entries) {
    const map = new Map();
    (entries || []).forEach(function (entry) {
      const weight = Number(entry.weight);
      if (!Number.isFinite(weight) || weight <= 0) return;
      const date = toKey(entry.date || entry.dateObj || todayDate());
      map.set(date, {
        date: date,
        weight: Math.round(weight * 10) / 10,
        note: entry.note || ''
      });
    });
    return Array.from(map.values()).sort(function (a, b) { return a.date.localeCompare(b.date); });
  }

  function readEntries() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return cleanEntries(JSON.parse(saved));
    } catch (error) {}
    return cleanEntries((window.DriftData && window.DriftData.entries) || []);
  }

  function writeEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanEntries(entries)));
  }

  function buildData(entriesInput) {
    const today = todayDate();
    const base = cleanEntries(entriesInput);
    const baseMap = new Map(base.map(function (e) { return [e.date, e]; }));

    const rolling = base.map(function (e) {
      const d = new Date(e.date + 'T00:00:00');
      const win = [];
      for (let k = 0; k < 7; k++) {
        const dd = new Date(d);
        dd.setDate(dd.getDate() - k);
        const key = toKey(dd);
        if (baseMap.has(key)) win.push(baseMap.get(key).weight);
      }
      const avg7 = win.length ? Math.round((win.reduce(function (a, b) { return a + b; }, 0) / win.length) * 100) / 100 : e.weight;
      return {
        date: e.date,
        dateObj: d,
        weight: e.weight,
        note: e.note || '',
        avg7: avg7
      };
    });

    const byDate = new Map(rolling.map(function (e) { return [e.date, e]; }));
    const latest = rolling[rolling.length - 1] || { date: toKey(today), dateObj: today, weight: 0, note: '', avg7: 0 };
    const weekAgo = rolling[rolling.length - 8] || rolling[0] || latest;
    const monthAgo = rolling[rolling.length - 31] || rolling[0] || latest;
    const first = rolling[0] || latest;

    let streak = 0;
    let cur = new Date(today);
    while (true) {
      const key = toKey(cur);
      if (!byDate.has(key)) break;
      streak += 1;
      cur.setDate(cur.getDate() - 1);
    }

    const last30 = rolling.slice(-30);
    const weekData = rolling.slice(-7);
    const prevWeekData = rolling.slice(-14, -7);

    function avg(list, fallback) {
      if (!list.length) return fallback || 0;
      return Math.round((list.reduce(function (a, b) { return a + b.weight; }, 0) / list.length) * 10) / 10;
    }

    const weeklyAvg = avg(weekData, latest.weight);
    const prevWeeklyAvg = avg(prevWeekData, weeklyAvg);
    const monthHigh = last30.length ? Math.max.apply(null, last30.map(function (e) { return e.weight; })) : latest.weight;
    const monthLow = last30.length ? Math.min.apply(null, last30.map(function (e) { return e.weight; })) : latest.weight;

    return {
      entries: rolling,
      byDate: byDate,
      today: today,
      latest: latest,
      weekAgo: weekAgo,
      monthAgo: monthAgo,
      stats: {
        today: latest.weight,
        todayAvg: latest.avg7,
        weeklyAvg: weeklyAvg,
        prevWeeklyAvg: prevWeeklyAvg,
        weekChange: Math.round((latest.avg7 - weekAgo.avg7) * 10) / 10,
        monthChange: Math.round((latest.avg7 - monthAgo.avg7) * 10) / 10,
        totalChange: Math.round((latest.avg7 - first.avg7) * 10) / 10,
        monthHigh: monthHigh,
        monthLow: monthLow,
        streak: streak,
        daysLogged: rolling.length,
        daysTotal: Math.max(120, rolling.length),
        avgRatePerWeek: Math.round(((latest.avg7 - monthAgo.avg7) / 4) * 100) / 100
      }
    };
  }

  window.DriftStore = {
    getEntries: function () {
      return readEntries();
    },
    saveEntry: function (entry) {
      const weight = Number(entry.weight);
      if (!Number.isFinite(weight) || weight <= 0) throw new Error('Please enter a valid weight.');
      const date = toKey(entry.date || todayDate());
      const entries = readEntries();
      const next = { date: date, weight: Math.round(weight * 10) / 10, note: entry.note || '' };
      const idx = entries.findIndex(function (e) { return e.date === date; });
      if (idx >= 0) entries[idx] = next;
      else entries.push(next);
      const clean = cleanEntries(entries);
      writeEntries(clean);
      window.DriftData = buildData(clean);
      window.dispatchEvent(new CustomEvent('drift:data-updated'));
      return window.DriftData;
    },
    resetDemo: function () {
      localStorage.removeItem(STORAGE_KEY);
      window.DriftData = buildData((window.DriftData && window.DriftData.entries) || []);
      window.dispatchEvent(new CustomEvent('drift:data-updated'));
      return window.DriftData;
    },
    exportCsv: function () {
      const data = buildData(readEntries());
      const lines = ['date,weight,avg7,note'];
      data.entries.forEach(function (e) {
        const note = String(e.note || '').split('"').join('""');
        lines.push(e.date + ',' + e.weight.toFixed(1) + ',' + e.avg7.toFixed(2) + ',"' + note + '"');
      });
      return lines.join('\n');
    },
    buildData: buildData
  };

  const initial = readEntries();
  writeEntries(initial);
  window.DriftData = buildData(initial);
})();