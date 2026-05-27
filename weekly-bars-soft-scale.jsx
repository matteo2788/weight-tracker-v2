// Soft-scale WeeklyBars override — keeps weekly average bars subtle and realistic
(function () {
  const WeeklyBarsSoftScale = ({ entries, weeks = 12 }) => {
    const data = (entries || []).filter(e => Number.isFinite(e.weight) && e.dateObj);
    if (!data.length) return null;

    const weekBuckets = [];
    const sorted = data.slice().sort((a, b) => a.dateObj - b.dateObj);
    let cursor = null;
    let bucket = [];

    sorted.forEach((entry) => {
      const d = new Date(entry.dateObj);
      d.setHours(0, 0, 0, 0);
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay());
      const key = start.toISOString().slice(0, 10);

      if (cursor && cursor !== key) {
        weekBuckets.push(bucket);
        bucket = [];
      }
      cursor = key;
      bucket.push(entry);
    });
    if (bucket.length) weekBuckets.push(bucket);

    const points = weekBuckets.slice(-weeks).map((items) => {
      const avg = items.reduce((sum, item) => sum + item.weight, 0) / items.length;
      const first = items[0].dateObj;
      return {
        avg: +avg.toFixed(1),
        label: window.fmtDate(first),
      };
    });

    if (!points.length) return null;

    const values = points.map(p => p.avg);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(1, max - min);

    // The important part: compress visual movement hard.
    // Weight can trend down, but the bars should feel calm and editorial, not like a crash chart.
    const minHeight = 68;
    const maxHeight = 96;
    const heightFor = (value) => {
      const normalized = span === 0 ? 0.5 : (value - min) / span;
      return minHeight + normalized * (maxHeight - minHeight);
    };

    return (
      <div className="weekly-bars weekly-bars-soft" aria-label="Weekly average weight chart">
        {points.map((point, index) => {
          const isLatest = index === points.length - 1;
          return (
            <div className="weekly-bar-item" key={`${point.label}-${index}`}>
              <div className="weekly-bar-value">{point.avg.toFixed(1)}</div>
              <div
                className={`weekly-bar ${isLatest ? "current" : ""}`}
                style={{ height: `${heightFor(point.avg)}px` }}
                title={`${point.label}: ${point.avg.toFixed(1)} lb`}
              />
              <div className="weekly-bar-label">{point.label}</div>
            </div>
          );
        })}
      </div>
    );
  };

  window.Drift = window.Drift || {};
  window.Drift.WeeklyBars = WeeklyBarsSoftScale;
})();
