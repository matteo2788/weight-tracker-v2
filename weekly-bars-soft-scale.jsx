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

    // Compress movement hard: tiny weekly weight changes should not look like a dramatic crash.
    const minHeight = 74;
    const maxHeight = 104;
    const heightFor = (value) => {
      const normalized = span === 0 ? 0.5 : (value - min) / span;
      return minHeight + normalized * (maxHeight - minHeight);
    };

    return (
      <div
        aria-label="Weekly average weight chart"
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 10,
          height: 168,
          width: "100%",
          paddingTop: 14,
          overflow: "visible",
        }}
      >
        {points.map((point, index) => {
          const isLatest = index === points.length - 1;
          return (
            <div
              key={`${point.label}-${index}`}
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <div style={{
                fontSize: 11,
                lineHeight: 1,
                color: "var(--ink-3)",
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}>
                {point.avg.toFixed(1)}
              </div>
              <div
                title={`${point.label}: ${point.avg.toFixed(1)} lb`}
                style={{
                  width: "100%",
                  height: `${heightFor(point.avg)}px`,
                  background: isLatest ? "var(--ink)" : "rgba(255, 255, 255, 0.34)",
                  border: isLatest ? "none" : "1px solid rgba(23, 22, 20, 0.10)",
                  borderRadius: 999,
                  boxSizing: "border-box",
                  transition: "height 220ms ease",
                }}
              />
              <div style={{
                fontSize: 10,
                lineHeight: 1,
                color: "var(--ink-3)",
                whiteSpace: "nowrap",
              }}>
                {point.label}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  window.Drift = window.Drift || {};
  window.Drift.WeeklyBars = WeeklyBarsSoftScale;
})();
