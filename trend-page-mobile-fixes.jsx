// Drift — trends page mobile readability fixes
(function () {
  const { useState } = React;

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function avg(list) {
    if (!list || !list.length) return 0;
    return list.reduce((sum, item) => sum + (Number(item.weight) || 0), 0) / list.length;
  }
  function round(n, digits = 1) {
    const p = Math.pow(10, digits);
    return Math.round((Number(n) || 0) * p) / p;
  }
  function safeFmt(n, digits = 1) { return Number(n || 0).toFixed(digits); }
  function changeText(n) {
    const v = Number(n || 0);
    if (Math.abs(v) < 0.05) return "0.0";
    return (v > 0 ? "+" : "") + v.toFixed(1);
  }
  function dateShort(d) {
    const dt = typeof d === "string" ? new Date(d + "T00:00:00") : d;
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  function getWindow(entries, days) {
    const list = entries || [];
    return list.slice(-Math.min(days, list.length));
  }
  function estimateSlopePerWeek(entries) {
    const list = entries || [];
    if (list.length < 2) return 0;
    const first = list[0].avg7 ?? list[0].weight;
    const last = list[list.length - 1].avg7 ?? list[list.length - 1].weight;
    return ((last - first) / Math.max(1, list.length - 1)) * 7;
  }
  function volatility(entries) {
    const list = entries || [];
    if (list.length < 2) return 0;
    const diffs = [];
    for (let i = 1; i < list.length; i++) diffs.push(Math.abs((list[i].weight || 0) - (list[i - 1].weight || 0)));
    return diffs.reduce((a,b)=>a+b,0) / diffs.length;
  }
  function loggingRate(entries, days) {
    if (!days) return 0;
    return clamp(Math.round(((entries || []).length / days) * 100), 0, 100);
  }
  function verdict(rate) {
    if (rate <= -1.25) return { label: "Fast drop", copy: "The trend is dropping quickly. Keep an eye on energy, hunger, lifts, and recovery." };
    if (rate <= -0.25) return { label: "Cutting pace", copy: "Your average is moving down at a realistic pace. Keep judging the trend, not one weigh-in." };
    if (rate < 0.25) return { label: "Holding steady", copy: "Your trend is mostly flat. That can be maintenance, water noise, or a short plateau." };
    return { label: "Trending up", copy: "Your average is moving up. Check weekends, snacks, sodium, and logging consistency before panicking." };
  }
  function buildWeeks(entries, count) {
    const list = entries || [];
    const weeks = [];
    for (let i = count - 1; i >= 0; i--) {
      const end = list.length - i * 7;
      const start = Math.max(0, end - 7);
      const slice = list.slice(start, end);
      if (!slice.length) continue;
      weeks.push({ label: dateShort(slice[0].dateObj || slice[0].date), avg: round(avg(slice), 1) });
    }
    return weeks;
  }
  function projection(entries) {
    if (!entries.length) return [];
    const last = entries[entries.length - 1];
    const base = last.avg7 || last.weight;
    const perDay = estimateSlopePerWeek(entries) / 7;
    return [7, 14, 21, 28].map(day => ({ day, weight: round(base + perDay * day, 1) }));
  }

  const PlainCard = ({ eyebrow, title, body, children }) => (
    <div className="card" style={{ padding: 24, color: "var(--ink)", background: "var(--paper)", border: "1px solid var(--line-soft)" }}>
      <div className="t-eyebrow" style={{ color: "var(--ink-3)" }}>{eyebrow}</div>
      <h3 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", margin: "10px 0 8px", color: "var(--ink)" }}>{title}</h3>
      {body && <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0, color: "var(--ink-3)" }}>{body}</p>}
      {children && <div style={{ marginTop: 18 }}>{children}</div>}
    </div>
  );

  const MetricLine = ({ label, value, sub }) => (
    <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 16, color: "var(--ink)" }}>
      <div className="t-label" style={{ color: "var(--ink-3)" }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 30, fontWeight: 500, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{value}</div>
      {sub && <div style={{ marginTop: 4, fontSize: 12, color: "var(--ink-3)", lineHeight: 1.35 }}>{sub}</div>}
    </div>
  );

  const WeekStrip = ({ weeks }) => {
    if (!weeks.length) return null;
    const vals = weeks.map(w => w.avg);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const spread = Math.max(0.1, max - min);
    return (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gap: 8, alignItems: "end", height: 190 }}>
        {weeks.map((w, i) => {
          const h = 42 + ((w.avg - min) / spread) * 105;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 11, color: "var(--ink-3)", fontVariantNumeric: "tabular-nums" }}>{w.avg.toFixed(1)}</div>
              <div style={{ width: "100%", height: h, borderRadius: 999, background: i === weeks.length - 1 ? "var(--ink)" : "var(--card-soft)", border: i === weeks.length - 1 ? "none" : "1px solid var(--line)" }}></div>
              <div style={{ fontSize: 10, color: "var(--ink-3)", whiteSpace: "nowrap" }}>{w.label}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const ProjectionRail = ({ items }) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
      {items.map(p => (
        <div key={p.day} style={{ padding: 14, border: "1px solid var(--line-soft)", borderRadius: 18, background: "var(--card-soft)", color: "var(--ink)" }}>
          <div className="t-label" style={{ color: "var(--ink-3)" }}>+{p.day}d</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 500, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{p.weight.toFixed(1)}</div>
        </div>
      ))}
    </div>
  );

  const EmptyTrendState = () => (
    <div className="big-card" style={{ padding: 34, textAlign: "center" }}>
      <div className="t-eyebrow">Trend lab</div>
      <h2 style={{ fontSize: "clamp(30px, 5vw, 52px)", fontWeight: 500, letterSpacing: "-0.04em", margin: "12px 0 10px" }}>No trend yet.</h2>
      <p className="t-body" style={{ maxWidth: 520, margin: "0 auto", lineHeight: 1.55 }}>Log a few weigh-ins and Drift will start showing the real trend behind the daily noise.</p>
    </div>
  );

  const TrendsScreenFixed = ({ onNav }) => {
    const D = window.DriftData;
    const entries = D.entries || [];
    const [range, setRange] = useState("60");
    const days = parseInt(range, 10);
    const win = getWindow(entries, days);
    const hasData = entries.length > 0;
    const pace = estimateSlopePerWeek(win);
    const read = verdict(pace);
    const noise = volatility(win);
    const logged = loggingRate(win, days);
    const weeks = buildWeeks(win, Math.min(8, Math.ceil(days / 7)));
    const proj = projection(win);
    const avgWeight = round(avg(win), 1);
    const high = win.length ? Math.max(...win.map(e => e.weight)) : 0;
    const low = win.length ? Math.min(...win.map(e => e.weight)) : 0;
    const change = win.length > 1 ? round((win[win.length - 1].avg7 || win[win.length - 1].weight) - (win[0].avg7 || win[0].weight), 1) : 0;

    return (
      <div className="page-enter container section trend-page-fixed">
        <div className="section-head" style={{ marginBottom: 32 }}>
          <div>
            <span className="t-eyebrow">Trend lab</span>
            <h1 className="section-title" style={{ marginTop: 12 }}>Your weight, <span className="ital">decoded</span>.</h1>
            <p className="t-body" style={{ maxWidth: 560, marginTop: 14 }}>This page tells you what the line means, how noisy it is, how reliable it is, and what to do next.</p>
          </div>
          <div className="tabs">
            {["14","30","60","90","120"].map(r => <button key={r} className={`tab ${range===r?"active":""}`} onClick={() => setRange(r)}>{r}d</button>)}
          </div>
        </div>

        {!hasData ? <EmptyTrendState/> : (
          <>
            <div className="big-card trend-main-card" style={{ padding: "clamp(18px, 4vw, 34px)", color: "var(--ink)", background: "var(--paper)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 26 }} className="resp-2col trend-main-grid">
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "end", marginBottom: 18, flexWrap: "wrap" }}>
                    <div>
                      <div className="t-label">Signal score</div>
                      <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: "clamp(38px, 7vw, 70px)", fontWeight: 500, letterSpacing: "-0.05em", color: "var(--ink)" }}>{read.label}</span>
                      </div>
                    </div>
                    <div className="trend-change-box" style={{ textAlign: "right" }}>
                      <div className="t-label">Selected change</div>
                      <div style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{changeText(change)} <span className="serif-i" style={{ fontSize: 17, color: "var(--ink-3)" }}>lb</span></div>
                    </div>
                  </div>
                  <div className="trend-chart-big-mobile">
                    <Drift.TrendChart entries={win} days={Math.min(win.length, days)} height={560}/>
                  </div>
                </div>
                <div style={{ display: "grid", gap: 14 }}>
                  <PlainCard eyebrow="Coach read" title={read.label} body={read.copy}/>
                  <MetricLine label="Trend pace" value={`${changeText(pace)} lb/wk`} sub="Based on the 7-day average direction" />
                  <MetricLine label="Noise level" value={`${safeFmt(noise, 1)} lb`} sub="Average day-to-day jump" />
                </div>
              </div>
            </div>

            <div className="grid grid-4" style={{ marginTop: 24 }}>
              <Drift.MetricCard label="Average" value={safeFmt(avgWeight, 1)} unit="lb" sub={`over ${Math.min(days, win.length)} logged days`}/>
              <Drift.MetricCard label="High" value={safeFmt(high, 1)} unit="lb" sub="highest weigh-in"/>
              <Drift.MetricCard label="Low" value={safeFmt(low, 1)} unit="lb" sub="lowest weigh-in"/>
              <Drift.MetricCard label="Logging rate" value={`${logged}`} unit="%" sub="range coverage"/>
            </div>

            <div className="grid grid-2" style={{ marginTop: 24 }}>
              <div className="card" style={{ padding: 30, color: "var(--ink)", background: "var(--paper)" }}>
                <span className="t-eyebrow">Week ladder</span>
                <h3 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", margin: "12px 0 20px", color: "var(--ink)" }}>Each week as a step.</h3>
                <WeekStrip weeks={weeks}/>
                <p style={{ margin: "18px 0 0", fontSize: 13, color: "var(--ink-3)", lineHeight: 1.45 }}>This makes the real direction easier to see than daily spikes.</p>
              </div>
              <div className="card" style={{ padding: 30, color: "var(--ink)", background: "var(--paper)" }}>
                <span className="t-eyebrow">Projection</span>
                <h3 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", margin: "12px 0 20px", color: "var(--ink)" }}>If this pace continues.</h3>
                <ProjectionRail items={proj}/>
                <p style={{ margin: "18px 0 0", fontSize: 13, color: "var(--ink-3)", lineHeight: 1.45 }}>Not a promise. Just a calm estimate from your current trend pace.</p>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  window.Drift = window.Drift || {};
  window.Drift.TrendsScreen = TrendsScreenFixed;
})();
