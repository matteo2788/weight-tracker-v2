(function () {
  const STORAGE_KEY = 'drift-weight-entries-v2';
  const OLD_KEYS = ['drift-weight-entries-v1'];
  const APP_TZ = 'America/Toronto';

  function timeZoneDateKey(value) {
    const d = value ? new Date(value) : new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: APP_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(d);
    const map = Object.fromEntries(parts.map(function (p) { return [p.type, p.value]; }));
    return map.year + '-' + map.month + '-' + map.day;
  }

  function dateObjFromKey(key) {
    return new Date(key + 'T00:00:00');
  }

  function todayKey() {
    return timeZoneDateKey(new Date());
  }

  function todayDate() {
    return dateObjFromKey(todayKey());
  }

  function toKey(value) {
    if (!value) return todayKey();
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const iso = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
      if (iso) {
        const y = iso[1];
        const m = String(iso[2]).padStart(2, '0');
        const d = String(iso[3]).padStart(2, '0');
        return y + '-' + m + '-' + d;
      }
      const parsed = new Date(trimmed);
      if (Number.isNaN(parsed.getTime())) return null;
      return timeZoneDateKey(parsed);
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return timeZoneDateKey(d);
  }

  function cleanEntries(entries) {
    const map = new Map();
    (entries || []).forEach(function (entry) {
      const weight = Number(entry.weight);
      if (!Number.isFinite(weight) || weight <= 0) return;
      const date = toKey(entry.date || entry.dateObj || todayKey());
      if (!date) return;
      map.set(date, { date: date, weight: Math.round(weight * 10) / 10, note: entry.note || '' });
    });
    return Array.from(map.values()).sort(function (a, b) { return a.date.localeCompare(b.date); });
  }

  function readEntries() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return cleanEntries(JSON.parse(saved));
    } catch (error) {}
    return [];
  }

  function writeEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanEntries(entries)));
  }

  function removeAllStoredWeightData() {
    localStorage.removeItem(STORAGE_KEY);
    OLD_KEYS.forEach(function (key) { localStorage.removeItem(key); });
  }

  function buildData(entriesInput) {
    const todayK = todayKey();
    const today = dateObjFromKey(todayK);
    const base = cleanEntries(entriesInput);
    const baseMap = new Map(base.map(function (e) { return [e.date, e]; }));

    const rolling = base.map(function (e) {
      const d = dateObjFromKey(e.date);
      const win = [];
      for (let k = 0; k < 7; k++) {
        const dd = new Date(d);
        dd.setDate(dd.getDate() - k);
        const key = dd.toISOString().slice(0, 10);
        if (baseMap.has(key)) win.push(baseMap.get(key).weight);
      }
      const avg7 = win.length ? Math.round((win.reduce(function (a, b) { return a + b; }, 0) / win.length) * 100) / 100 : e.weight;
      return { date: e.date, dateObj: d, weight: e.weight, note: e.note || '', avg7: avg7 };
    });

    const byDate = new Map(rolling.map(function (e) { return [e.date, e]; }));
    const latest = rolling[rolling.length - 1] || { date: todayK, dateObj: today, weight: 0, note: '', avg7: 0 };
    const todayEntry = byDate.get(todayK) || null;
    const weekAgo = rolling[rolling.length - 8] || rolling[0] || latest;
    const monthAgo = rolling[rolling.length - 31] || rolling[0] || latest;
    const first = rolling[0] || latest;

    let streak = 0;
    let cur = new Date(today);
    while (true) {
      const key = cur.toISOString().slice(0, 10);
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
    const monthHigh = last30.length ? Math.max.apply(null, last30.map(function (e) { return e.weight; })) : 0;
    const monthLow = last30.length ? Math.min.apply(null, last30.map(function (e) { return e.weight; })) : 0;
    const currentDisplayWeight = todayEntry ? todayEntry.weight : 0;
    const currentDisplayAvg = todayEntry ? todayEntry.avg7 : (rolling.length ? latest.avg7 : 0);

    return {
      entries: rolling,
      byDate: byDate,
      today: today,
      todayKey: todayK,
      todayEntry: todayEntry,
      hasTodayEntry: !!todayEntry,
      latest: latest,
      weekAgo: weekAgo,
      monthAgo: monthAgo,
      stats: {
        today: currentDisplayWeight,
        todayAvg: currentDisplayAvg,
        latestWeight: latest.weight,
        latestAvg: latest.avg7,
        weeklyAvg: weeklyAvg,
        prevWeeklyAvg: prevWeeklyAvg,
        weekChange: Math.round((latest.avg7 - weekAgo.avg7) * 10) / 10,
        monthChange: Math.round((latest.avg7 - monthAgo.avg7) * 10) / 10,
        totalChange: Math.round((latest.avg7 - first.avg7) * 10) / 10,
        monthHigh: monthHigh,
        monthLow: monthLow,
        streak: streak,
        daysLogged: rolling.length,
        daysTotal: rolling.length,
        avgRatePerWeek: Math.round(((latest.avg7 - monthAgo.avg7) / 4) * 100) / 100
      }
    };
  }

  function parseImportText(text) {
    const rows = String(text || '').split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
    const parsed = [];
    const rejected = [];
    rows.forEach(function (line, index) {
      const cleaned = line.replace(/[|\t;]/g, ',');
      const parts = cleaned.split(',').map(function (p) { return p.trim().replace(/^"|"$/g, ''); }).filter(Boolean);
      let date = null;
      let weight = null;
      let note = '';
      if (parts.length >= 2) {
        date = toKey(parts[0]);
        weight = Number(String(parts[1]).replace(/[^0-9.\-]/g, ''));
        note = parts.slice(2).join(', ');
      } else {
        const match = line.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}|[A-Za-z]{3,9}\s+\d{1,2}(?:,\s*\d{4})?)\s*[-–:,]?\s*(\d+(?:\.\d+)?)/);
        if (match) {
          const rawDate = match[1];
          const hasYear = /\d{4}/.test(rawDate);
          date = toKey(hasYear ? rawDate : rawDate + ', ' + new Date().getFullYear());
          weight = Number(match[2]);
          note = line.slice(match.index + match[0].length).trim().replace(/^[-–:,]\s*/, '');
        }
      }
      if (!date || !Number.isFinite(weight) || weight <= 0) rejected.push({ line: index + 1, text: line });
      else parsed.push({ date, weight: Math.round(weight * 10) / 10, note });
    });
    return { entries: cleanEntries(parsed), rejected };
  }

  function replaceAll(entries) {
    const clean = cleanEntries(entries);
    writeEntries(clean);
    window.DriftData = buildData(clean);
    window.dispatchEvent(new CustomEvent('drift:data-updated'));
    return window.DriftData;
  }

  window.DriftStore = {
    getEntries: function () { return readEntries(); },
    todayKey: todayKey,
    hasLoggedToday: function () { return !!buildData(readEntries()).hasTodayEntry; },
    saveEntry: function (entry) {
      const weight = Number(entry.weight);
      if (!Number.isFinite(weight) || weight <= 0) throw new Error('Please enter a valid weight.');
      const date = toKey(entry.date || todayKey());
      if (!date) throw new Error('Please enter a valid date.');
      const entries = readEntries();
      const next = { date: date, weight: Math.round(weight * 10) / 10, note: entry.note || '' };
      const idx = entries.findIndex(function (e) { return e.date === date; });
      if (idx >= 0) entries[idx] = next;
      else entries.push(next);
      return replaceAll(entries);
    },
    importEntries: function (entries, mode) {
      const imported = cleanEntries(entries);
      if (mode === 'merge') return replaceAll(readEntries().concat(imported));
      return replaceAll(imported);
    },
    parseImportText: parseImportText,
    clearAll: function () {
      removeAllStoredWeightData();
      window.DriftData = buildData([]);
      window.dispatchEvent(new CustomEvent('drift:data-updated'));
      return window.DriftData;
    },
    resetDemo: function () {
      removeAllStoredWeightData();
      window.DriftData = buildData([]);
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

  window.DriftData = buildData(readEntries());
})();