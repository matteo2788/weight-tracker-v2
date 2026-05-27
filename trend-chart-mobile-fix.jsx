// Mobile-safe TrendChart override
(function () {
  const { useEffect, useRef, useState } = React;

  const MobileSafeTrendChart = ({ entries, height = 360, showAxes = true, days = 90 }) => {
    const data = (entries || []).slice(-days);
    const ref = useRef(null);
    const [w, setW] = useState(900);
    const [hoverIdx, setHoverIdx] = useState(null);

    useEffect(() => {
      if (!ref.current) return;
      const ro = new ResizeObserver((items) => {
        const next = Math.max(280, items[0].contentRect.width || 0);
        setW(next);
      });
      ro.observe(ref.current);
      return () => ro.disconnect();
    }, []);

    if (!data.length) return null;

    const mobile = w < 560;
    const chartHeight = mobile ? Math.max(330, height - 20) : height;
    const padL = mobile ? 68 : 56;
    const padR = mobile ? 14 : 24;
    const padT = mobile ? 30 : 24;
    const padB = mobile ? 64 : 44;
    const innerW = Math.max(20, w - padL - padR);
    const innerH = Math.max(80, chartHeight - padT - padB);

    const weights = data.map(d => d.weight);
    const avgs = data.map(d => d.avg7);
    const all = weights.concat(avgs).filter(Number.isFinite);
    const min = Math.floor(Math.min(...all) - 0.6);
    const max = Math.ceil(Math.max(...all) + 0.6);
    const span = max - min || 1;

    const xAt = (i) => padL + (i * innerW) / (data.length - 1 || 1);
    const yAt = (v) => padT + (1 - (v - min) / span) * innerH;

    const buildSmooth = (vals) => {
      const xs = vals.map((_, i) => xAt(i));
      const ys = vals.map(v => yAt(v));
      let d = `M ${xs[0]} ${ys[0]}`;
      for (let i = 0; i < xs.length - 1; i++) {
        const x0 = xs[i - 1] ?? xs[i];
        const y0 = ys[i - 1] ?? ys[i];
        const x1 = xs[i], y1 = ys[i];
        const x2 = xs[i + 1], y2 = ys[i + 1];
        const x3 = xs[i + 2] ?? x2, y3 = ys[i + 2] ?? y2;
        const c1x = x1 + (x2 - x0) / 6;
        const c1y = y1 + (y2 - y0) / 6;
        const c2x = x2 - (x3 - x1) / 6;
        const c2y = y2 - (y3 - y1) / 6;
        d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
      }
      return { d, xs, ys };
    };

    const avgPath = buildSmooth(avgs);
    const gridSteps = mobile ? 3 : 4;
    const grid = Array.from({ length: gridSteps + 1 }, (_, i) => {
      const v = min + ((max - min) * i) / gridSteps;
      return { v: Math.round(v * 10) / 10, y: yAt(v) };
    });

    const labelCount = mobile ? 4 : 5;
    const xLabels = Array.from({ length: labelCount }, (_, i) => {
      const idx = Math.round((i * (data.length - 1)) / (labelCount - 1));
      return { idx, x: xAt(idx), label: window.fmtDate(data[idx].dateObj) };
    });

    const onMove = (e) => {
      if (mobile) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, (x - padL) / innerW));
      const idx = Math.round(ratio * (data.length - 1));
      setHoverIdx(idx);
    };

    return (
      <div ref={ref} className="trend-chart-fixed" style={{ position: "relative", width: "100%" }}>
        <svg
          width={w}
          height={chartHeight}
          viewBox={`0 0 ${w} ${chartHeight}`}
          onMouseMove={onMove}
          onMouseLeave={() => setHoverIdx(null)}
          style={{ display: "block", width: "100%", height: chartHeight, overflow: "visible", cursor: mobile ? "default" : "crosshair" }}
        >
          <defs>
            <linearGradient id="trendFillMobileSafe" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--ink)" stopOpacity="0.09"/>
              <stop offset="100%" stopColor="var(--ink)" stopOpacity="0"/>
            </linearGradient>
          </defs>

          {grid.map((g, i) => (
            <g key={i}>
              <line x1={padL} x2={w - padR} y1={g.y} y2={g.y} stroke="var(--line-soft)" strokeDasharray={i === 0 || i === gridSteps ? "0" : "2 4"}/>
              {showAxes && (
                <text
                  x={mobile ? 6 : padL - 10}
                  y={g.y + 4}
                  fontSize={mobile ? 10 : 11}
                  fill="var(--ink-3)"
                  textAnchor={mobile ? "start" : "end"}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {g.v.toFixed(1)}
                </text>
              )}
            </g>
          ))}

          <path
            d={`${avgPath.d} L ${avgPath.xs[avgPath.xs.length - 1]} ${padT + innerH} L ${avgPath.xs[0]} ${padT + innerH} Z`}
            fill="url(#trendFillMobileSafe)"
          />

          {data.map((d, i) => (
            <circle key={i} cx={xAt(i)} cy={yAt(d.weight)} r={mobile ? 1.8 : 2} fill="var(--ink-4)" opacity="0.48" />
          ))}

          <path d={avgPath.d} fill="none" stroke="var(--ink)" strokeWidth={mobile ? 2.2 : 2} strokeLinecap="round"/>

          {showAxes && xLabels.map((l, i) => {
            const anchor = mobile && i === 0 ? "start" : mobile && i === xLabels.length - 1 ? "end" : "middle";
            return (
              <text
                key={i}
                x={l.x}
                y={chartHeight - 22}
                fontSize={mobile ? 10 : 11}
                fill="var(--ink-3)"
                textAnchor={anchor}
              >
                {l.label}
              </text>
            );
          })}

          {hoverIdx != null && data[hoverIdx] && (() => {
            const hx = xAt(hoverIdx);
            const hy = yAt(data[hoverIdx].avg7);
            const dy = yAt(data[hoverIdx].weight);
            return (
              <g>
                <line x1={hx} x2={hx} y1={padT} y2={padT + innerH} stroke="var(--ink-4)" strokeDasharray="3 3"/>
                <circle cx={hx} cy={dy} r="3.5" fill="var(--ink-4)"/>
                <circle cx={hx} cy={hy} r="5" fill="var(--card)" stroke="var(--ink)" strokeWidth="2"/>
              </g>
            );
          })()}
        </svg>

        {hoverIdx != null && data[hoverIdx] && (() => {
          const hx = xAt(hoverIdx);
          const left = Math.min(Math.max(hx - 80, 8), w - 168);
          return (
            <div style={{
              position: "absolute", top: 8, left,
              background: "var(--ink)", color: "#fff",
              borderRadius: 10, padding: "10px 12px",
              fontSize: 12, lineHeight: 1.4,
              boxShadow: "var(--shadow-md)",
              pointerEvents: "none", width: 160,
            }}>
              <div style={{ opacity: 0.6, fontSize: 11, marginBottom: 4 }}>{window.fmtDateLong(data[hoverIdx].dateObj)}</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ opacity: 0.7 }}>Weigh-in</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{data[hoverIdx].weight.toFixed(1)} lb</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ opacity: 0.7 }}>7-day avg</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{data[hoverIdx].avg7.toFixed(2)} lb</span>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  window.Drift = window.Drift || {};
  window.Drift.TrendChart = MobileSafeTrendChart;
})();