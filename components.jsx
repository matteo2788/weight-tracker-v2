// Drift — shared UI primitives & icons
const { useState, useEffect, useMemo, useRef } = React;

/* ---------------- ICONS ---------------- */
const Icon = ({ name, size = 18, stroke = 1.6, className = "", style }) => {
  const s = { width: size, height: size, ...style };
  const props = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: stroke,
    strokeLinecap: "round", strokeLinejoin: "round",
    className, style: s,
  };
  switch (name) {
    case "arrow-down": return <svg {...props}><path d="M12 5v14M5 12l7 7 7-7"/></svg>;
    case "arrow-up": return <svg {...props}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case "arrow-right": return <svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case "trend-down": return <svg {...props}><path d="M3 7l6 6 4-4 8 8"/><path d="M21 17v0M21 17h-4M21 17v-4"/></svg>;
    case "trend-up": return <svg {...props}><path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v4M21 7h-4"/></svg>;
    case "plus": return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case "minus": return <svg {...props}><path d="M5 12h14"/></svg>;
    case "search": return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>;
    case "calendar": return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>;
    case "settings": return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case "check": return <svg {...props}><path d="M4 12l5 5L20 6"/></svg>;
    case "chevron-left": return <svg {...props}><path d="M15 18l-6-6 6-6"/></svg>;
    case "chevron-right": return <svg {...props}><path d="M9 18l6-6-6-6"/></svg>;
    case "edit": return <svg {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
    case "x": return <svg {...props}><path d="M18 6L6 18M6 6l12 12"/></svg>;
    case "sparkle": return <svg {...props}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14z"/></svg>;
    case "bell": return <svg {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/></svg>;
    case "user": return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    case "scale": return <svg {...props}><path d="M3 7l2 12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2l2-12"/><path d="M3 7h18"/><circle cx="12" cy="12" r="2"/></svg>;
    case "circle": return <svg {...props}><circle cx="12" cy="12" r="9"/></svg>;
    default: return null;
  }
};

/* ---------------- SPARKLINE ---------------- */
const Sparkline = ({ data, width = 140, height = 44, color = "var(--ink)", fill = false, dotted = false }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = 4;
  const w = width;
  const h = height;
  const xs = data.map((_, i) => pad + (i * (w - pad * 2)) / (data.length - 1));
  const ys = data.map(v => {
    if (max === min) return h / 2;
    return pad + (1 - (v - min) / (max - min)) * (h - pad * 2);
  });
  // smooth path (catmull-rom -> bezier)
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
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="spark">
      {fill && (
        <path
          d={`${d} L ${xs[xs.length-1]} ${h - pad} L ${xs[0]} ${h - pad} Z`}
          fill={color}
          opacity="0.08"
        />
      )}
      <path d={d} stroke={color} strokeWidth={dotted ? 1 : 1.6} fill="none" strokeLinecap="round" strokeDasharray={dotted ? "2 3" : ""} />
    </svg>
  );
};

/* ---------------- CHART (big trend) ---------------- */
const TrendChart = ({ entries, height = 360, showAxes = true, days = 90 }) => {
  const data = entries.slice(-days);
  const ref = useRef(null);
  const [w, setW] = useState(900);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(es => setW(es[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const padL = 56, padR = 24, padT = 24, padB = 36;
  const innerW = Math.max(0, w - padL - padR);
  const innerH = height - padT - padB;

  const weights = data.map(d => d.weight);
  const avgs = data.map(d => d.avg7);
  const all = [...weights, ...avgs];
  const min = Math.floor(Math.min(...all) - 0.6);
  const max = Math.ceil(Math.max(...all) + 0.6);

  const xAt = i => padL + (i * innerW) / (data.length - 1 || 1);
  const yAt = v => padT + (1 - (v - min) / (max - min)) * innerH;

  // smooth path for avg7
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

  // gridlines
  const gridSteps = 4;
  const grid = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const v = min + ((max - min) * i) / gridSteps;
    return { v: Math.round(v * 10) / 10, y: yAt(v) };
  });

  // x labels — show ~6 month/day labels
  const xLabelCount = 5;
  const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
    const idx = Math.round((i * (data.length - 1)) / (xLabelCount - 1));
    return { idx, x: xAt(idx), label: window.fmtDate(data[idx].dateObj) };
  });

  const [hoverIdx, setHoverIdx] = useState(null);
  const onMove = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (x - padL) / innerW));
    const idx = Math.round(ratio * (data.length - 1));
    setHoverIdx(idx);
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <svg
        width={w}
        height={height}
        onMouseMove={onMove}
        onMouseLeave={() => setHoverIdx(null)}
        style={{ display: "block", cursor: "crosshair" }}
      >
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--ink)" stopOpacity="0.10"/>
            <stop offset="100%" stopColor="var(--ink)" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* gridlines */}
        {grid.map((g, i) => (
          <g key={i}>
            <line x1={padL} x2={w - padR} y1={g.y} y2={g.y} stroke="var(--line-soft)" strokeDasharray={i === 0 || i === gridSteps ? "0" : "2 4"}/>
            {showAxes && <text x={padL - 10} y={g.y + 4} fontSize="11" fill="var(--ink-3)" textAnchor="end" style={{ fontVariantNumeric: "tabular-nums" }}>{g.v.toFixed(1)}</text>}
          </g>
        ))}

        {/* x labels */}
        {showAxes && xLabels.map((l, i) => (
          <text key={i} x={l.x} y={height - 12} fontSize="11" fill="var(--ink-3)" textAnchor="middle">{l.label}</text>
        ))}

        {/* avg fill */}
        <path
          d={`${avgPath.d} L ${avgPath.xs[avgPath.xs.length-1]} ${padT + innerH} L ${avgPath.xs[0]} ${padT + innerH} Z`}
          fill="url(#trendFill)"
        />

        {/* daily dots — light/muted */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xAt(i)}
            cy={yAt(d.weight)}
            r={2}
            fill="var(--ink-4)"
            opacity="0.55"
          />
        ))}

        {/* avg line */}
        <path d={avgPath.d} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round"/>

        {/* hover */}
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
            <div style={{ opacity: 0.6, fontSize: 11, marginBottom: 4 }}>
              {window.fmtDateLong(data[hoverIdx].dateObj)}
            </div>
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

/* ---------------- PILL / METRIC CARD ---------------- */
const MetricCard = ({ label, value, unit = "lb", change, sub, accent, sparkData, big, style, className = "" }) => {
  const positive = change != null && change > 0;
  const negative = change != null && change < 0;
  const accentClass = accent === "sage" ? "pill-sage" : accent === "sand" ? "pill-sand" : accent === "coral" ? "pill-coral" : accent === "sky" ? "pill-sky" : "";
  return (
    <div className={`card ${className}`} style={{ padding: 22, ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <span className="t-label">{label}</span>
        {accent && <span className={`pill ${accentClass}`} style={{ height: 22 }}>{accent === "sage" ? "↓ trend" : accent === "coral" ? "↑ trend" : accent === "sand" ? "steady" : "info"}</span>}
      </div>
      <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 4 }}>
        <span className="t-num-xl" style={{ fontSize: big ? 56 : 40, fontWeight: 500 }}>{value}</span>
        <span className="serif-i" style={{ fontSize: big ? 22 : 16, color: "var(--ink-3)" }}>{unit}</span>
      </div>
      {(change != null || sub) && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div className="t-body" style={{ fontSize: 13, color: "var(--ink-3)" }}>{sub}</div>
          {change != null && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              color: negative ? "#4D6248" : positive ? "#8A3D2A" : "var(--ink-3)",
              fontSize: 13, fontWeight: 500, fontVariantNumeric: "tabular-nums",
            }}>
              {negative ? "↓" : positive ? "↑" : "·"} {Math.abs(change).toFixed(1)}
            </div>
          )}
        </div>
      )}
      {sparkData && (
        <div style={{ marginTop: 14 }}>
          <Sparkline data={sparkData} width={260} height={36} color="var(--ink)" />
        </div>
      )}
    </div>
  );
};

window.Drift = window.Drift || {};
Object.assign(window.Drift, { Icon, Sparkline, TrendChart, MetricCard });
