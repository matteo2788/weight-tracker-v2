// Drift — screens
const { useState: useState_s, useEffect: useEffect_s, useMemo: useMemo_s } = React;

/* ============== DASHBOARD ============== */
const Dashboard = ({ onNav, onLog }) => {
  const D = window.DriftData;
  const { stats, entries, latest } = D;

  // Trim sparkline data
  const last30 = entries.slice(-30).map(e => e.avg7);
  const last14weights = entries.slice(-14).map(e => e.weight);
  const last30avg = entries.slice(-30).map(e => e.avg7);

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="hero container">
        <div className="hero-eyebrow">
          <span>The Drift Index · {window.fmtDateLong(D.today)}</span>
        </div>
        <h1 className="hero-title">
          See the trend.<br/>
          <span className="ital">Ignore</span> the noise.
        </h1>
        <p className="hero-sub">
          Track daily weigh-ins, understand the real trend, and make sense of progress that unfolds in weeks — not in mornings.
        </p>
        <div className="hero-cta">
          <button className="btn btn-primary btn-lg" onClick={onLog}>
            <Drift.Icon name="plus" size={16}/> Log today's weight
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => onNav("trends")}>
            View the trend <Drift.Icon name="arrow-right" size={14}/>
          </button>
        </div>

        {/* Layered floating cards stage */}
        <div className="stage-scroll">
          <div className="stage" aria-hidden="false">
          {/* Card 1 — Today's weight (centerpiece) */}
          <div className="float-card" style={{
            "--rot": "-2deg",
            transform: "rotate(-2deg)",
            width: 320, top: 30, left: "50%", marginLeft: -160,
            zIndex: 5, animationDelay: "120ms",
            padding: "26px 28px 24px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="t-label">Today</span>
              <span className="pill pill-sage">
                <span className="dot" style={{ background: "#4D6248" }}></span>
                logged
              </span>
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "baseline" }}>
              <span className="t-num-xl" style={{ fontSize: 76, fontWeight: 500, lineHeight: 0.95 }}>
                {window.fmtWeight(stats.today)}
              </span>
              <span className="serif-i" style={{ fontSize: 26, color: "var(--ink-3)", marginLeft: 6 }}>lb</span>
            </div>
            <div className="hairline-soft" style={{ margin: "16px 0" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--ink-3)" }}>7-day average</span>
              <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)", fontWeight: 500 }}>
                {stats.todayAvg.toFixed(2)} lb
              </span>
            </div>
          </div>

          {/* Card 2 — Weekly change (left) */}
          <div className="float-card" style={{
            "--rot": "-7deg",
            transform: "rotate(-7deg)",
            width: 240, top: 90, left: "calc(50% - 360px)",
            zIndex: 3, animationDelay: "0ms", padding: 20,
          }}>
            <span className="t-label">This week</span>
            <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 4 }}>
              <span className="t-num-xl" style={{ fontSize: 44, fontWeight: 500 }}>
                {window.fmtChange(stats.weekChange)}
              </span>
              <span className="serif-i" style={{ fontSize: 18, color: "var(--ink-3)" }}>lb</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <Drift.Sparkline data={entries.slice(-7).map(e => e.avg7)} width={200} height={32} color="#4D6248" fill/>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)" }}>vs. last week's avg</div>
          </div>

          {/* Card 3 — Monthly trend (right) */}
          <div className="float-card" style={{
            "--rot": "8deg",
            transform: "rotate(8deg)",
            width: 260, top: 60, left: "calc(50% + 130px)",
            zIndex: 4, animationDelay: "240ms", padding: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="t-label">30 days</span>
              <Drift.Icon name="trend-down" size={16} style={{ color: "#4D6248" }}/>
            </div>
            <div style={{ marginTop: 10 }}>
              <Drift.Sparkline data={last30avg} width={220} height={56} color="var(--ink)" fill/>
            </div>
            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ color: "var(--ink-3)", fontSize: 12 }}>net change</span>
              <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500, fontSize: 18 }}>
                {window.fmtChange(stats.monthChange)} <span className="serif-i" style={{ fontSize: 13, color: "var(--ink-3)" }}>lb</span>
              </span>
            </div>
          </div>

          {/* Card 4 — Streak (far left small) */}
          <div className="float-card" style={{
            "--rot": "-5deg",
            transform: "rotate(-5deg)",
            width: 180, top: 250, left: "calc(50% - 460px)",
            zIndex: 2, animationDelay: "380ms", padding: 18,
          }}>
            <span className="t-label">Streak</span>
            <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 4 }}>
              <span className="t-num-xl" style={{ fontSize: 40, fontWeight: 500 }}>{stats.streak}</span>
              <span className="serif-i" style={{ fontSize: 15, color: "var(--ink-3)" }}>days</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>consecutive weigh-ins</div>
          </div>

          {/* Card 5 — Range (right small) */}
          <div className="float-card" style={{
            "--rot": "6deg",
            transform: "rotate(6deg)",
            width: 200, top: 270, left: "calc(50% + 220px)",
            zIndex: 2, animationDelay: "440ms", padding: 18,
          }}>
            <span className="t-label">Month range</span>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "var(--ink-3)" }}>low</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{stats.monthLow.toFixed(1)}</span>
              </div>
              <div style={{ height: 4, background: "var(--card-soft)", borderRadius: 2, position: "relative" }}>
                <div style={{
                  position: "absolute", left: "12%", right: "18%", top: 0, bottom: 0,
                  background: "var(--ink)", borderRadius: 2,
                }}></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 6 }}>
                <span style={{ fontSize: 11, color: "var(--ink-3)" }}>high</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{stats.monthHigh.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Card 6 — Insight note (bottom-center) */}
          <div className="float-card" style={{
            "--rot": "1.5deg",
            transform: "rotate(1.5deg)",
            width: 280, top: 330, left: "50%", marginLeft: -140,
            zIndex: 6, animationDelay: "560ms", padding: 18,
            background: "var(--ink)", color: "#fff",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Drift.Icon name="sparkle" size={14} style={{ color: "#C9A87C" }}/>
              <span className="t-label" style={{ color: "rgba(255,255,255,0.6)" }}>Insight</span>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.45 }}>
              Your 7-day average is down <span style={{ fontWeight: 600 }}>{Math.abs(stats.weekChange).toFixed(1)} lb</span> from last week. Today's weigh-in is well within normal fluctuation.
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Trend — editorial, no-card */}
      <section className="section container" style={{ paddingTop: 60 }}>
        <div className="section-head">
          <div>
            <span className="t-eyebrow">Trend · last 90 days</span>
            <h2 className="section-title" style={{ marginTop: 12 }}>
              The shape of <span className="ital">your</span> progress.
            </h2>
          </div>
          <button className="btn btn-secondary" onClick={() => onNav("trends")}>
            Open trends <Drift.Icon name="arrow-right" size={14}/>
          </button>
        </div>

        {/* Trend headline row */}
        <div className="trend-headline">
          <div>
            <div className="t-label" style={{ marginBottom: 8 }}>7-day average</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span className="t-num-xl" style={{ fontSize: "clamp(56px, 9vw, 96px)", fontWeight: 500, lineHeight: 0.95 }}>{stats.todayAvg.toFixed(2)}</span>
              <span className="serif-i" style={{ fontSize: "clamp(22px, 3vw, 32px)", color: "var(--ink-3)" }}>lb</span>
            </div>
          </div>
          <div className="trend-headline-meta">
            <div className="trend-meta-row">
              <span className="t-label">30-day change</span>
              <span className="t-num-meta">↓ {Math.abs(stats.monthChange).toFixed(1)} lb</span>
            </div>
            <div className="trend-meta-row">
              <span className="t-label">vs last week</span>
              <span className="t-num-meta">{stats.weekChange < 0 ? "↓" : "↑"} {Math.abs(stats.weekChange).toFixed(1)} lb</span>
            </div>
            <div className="trend-meta-row">
              <span className="t-label">streak</span>
              <span className="t-num-meta">{stats.streak} days</span>
            </div>
          </div>
        </div>

        {/* Chart — no card */}
        <div className="trend-chart-wrap">
          <Drift.TrendChart entries={entries} height={360} days={90}/>
        </div>

        <div className="chart-legend">
          <div className="row gap-2"><span className="dot" style={{ background: "var(--ink)" }}></span><span>7-day average</span></div>
          <div className="row gap-2"><span className="dot" style={{ background: "var(--ink-4)" }}></span><span>Daily weigh-ins</span></div>
        </div>
      </section>

      {/* Inline stats row — no cards, just hairlines */}
      <section className="container" style={{ paddingBottom: 80 }}>
        <div className="stat-row">
          <div className="stat-cell">
            <div className="t-label">Weekly avg</div>
            <div className="stat-val">{stats.weeklyAvg.toFixed(1)}<span className="serif-i stat-unit">lb</span></div>
            <div className="stat-meta">
              <span>last 7 days</span>
              <span className={(stats.weeklyAvg - stats.prevWeeklyAvg) < 0 ? "delta-down" : "delta-up"}>
                {(stats.weeklyAvg - stats.prevWeeklyAvg) < 0 ? "↓" : "↑"} {Math.abs(stats.weeklyAvg - stats.prevWeeklyAvg).toFixed(1)}
              </span>
            </div>
          </div>
          <div className="stat-cell">
            <div className="t-label">Monthly avg</div>
            <div className="stat-val">{(entries.slice(-30).reduce((a,b)=>a+b.weight,0)/30).toFixed(1)}<span className="serif-i stat-unit">lb</span></div>
            <div className="stat-meta">
              <span>last 30 days</span>
              <span className="delta-down">↓ {Math.abs(stats.monthChange).toFixed(1)}</span>
            </div>
          </div>
          <div className="stat-cell">
            <div className="t-label">Total change</div>
            <div className="stat-val">{window.fmtChange(stats.totalChange)}<span className="serif-i stat-unit">lb</span></div>
            <div className="stat-meta">
              <span>since you started</span>
            </div>
          </div>
          <div className="stat-cell">
            <div className="t-label">Avg rate</div>
            <div className="stat-val">{window.fmtChange(stats.avgRatePerWeek)}<span className="serif-i stat-unit">lb/wk</span></div>
            <div className="stat-meta">
              <span>30-day trend</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent entries — list, not card */}
      <section className="container" style={{ paddingBottom: 80 }}>
        <div className="recent-head">
          <div>
            <span className="t-eyebrow">Recent</span>
            <h2 className="section-title" style={{ marginTop: 12, fontSize: "clamp(28px, 4vw, 44px)" }}>
              Last <span className="ital">seven</span> weigh-ins.
            </h2>
          </div>
          <button className="btn btn-ghost" onClick={() => onNav("history")} style={{ alignSelf: "end" }}>
            Full history <Drift.Icon name="arrow-right" size={14}/>
          </button>
        </div>

        <div className="recent-list">
          {entries.slice(-7).reverse().map((e, i) => {
            const day = e.dateObj.toLocaleDateString("en-US", { weekday: "long" });
            const dt = e.dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return (
              <div key={i} className="recent-row">
                <div className="recent-day">
                  <div className="recent-weekday">{day}</div>
                  <div className="recent-date">{dt}</div>
                </div>
                <div className="recent-note">{e.note || <span style={{ color: "var(--ink-4)" }}>—</span>}</div>
                <div className="recent-avg">
                  <span className="t-label" style={{ marginRight: 6 }}>7d</span>
                  <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink-2)" }}>{e.avg7.toFixed(2)}</span>
                </div>
                <div className="recent-wt">
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{e.weight.toFixed(1)}</span>
                  <span className="serif-i" style={{ fontSize: 14, color: "var(--ink-3)", marginLeft: 4 }}>lb</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

/* ============== TRENDS ============== */
const TrendsScreen = ({ onNav }) => {
  const D = window.DriftData;
  const { entries, stats } = D;
  const [range, setRange] = useState_s("90");
  const days = parseInt(range, 10);

  const win = entries.slice(-days);
  const avg = +(win.reduce((a, b) => a + b.weight, 0) / win.length).toFixed(1);
  const rangeHigh = Math.max(...win.map(e => e.weight));
  const rangeLow = Math.min(...win.map(e => e.weight));
  const rangeChange = +(win[win.length - 1].avg7 - win[0].avg7).toFixed(1);
  const ratePerWeek = +((rangeChange / (days / 7)) ).toFixed(2);

  return (
    <div className="page-enter container section">
      <div className="section-head" style={{ marginBottom: 32 }}>
        <div>
          <span className="t-eyebrow">Trends</span>
          <h1 className="section-title" style={{ marginTop: 12 }}>
            Progress, <span className="ital">slowly</span> resolved.
          </h1>
          <p className="t-body" style={{ maxWidth: 480, marginTop: 14 }}>
            Daily weight is noisy. The shapes below filter that out so you see the direction your body is actually moving.
          </p>
        </div>
        <div className="tabs">
          {["30","60","90","120"].map(r => (
            <button key={r} className={`tab ${range===r?"active":""}`} onClick={() => setRange(r)}>{r}d</button>
          ))}
        </div>
      </div>

      <div className="big-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 24 }}>
          <div>
            <div className="t-label">Average · selected range</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
              <span className="t-num-xl" style={{ fontSize: 56 }}>{avg.toFixed(1)}</span>
              <span className="serif-i" style={{ fontSize: 22, color: "var(--ink-3)" }}>lb</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="t-label">Net change</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4, justifyContent: "flex-end" }}>
              <span className="t-num-xl" style={{ fontSize: 36, color: rangeChange < 0 ? "#4D6248" : "var(--ink)" }}>{window.fmtChange(rangeChange)}</span>
              <span className="serif-i" style={{ fontSize: 16, color: "var(--ink-3)" }}>lb</span>
            </div>
          </div>
        </div>
        <Drift.TrendChart entries={entries} height={380} days={days}/>
      </div>

      <div className="grid grid-4" style={{ marginTop: 24 }}>
        <Drift.MetricCard label="7-day avg" value={stats.todayAvg.toFixed(1)} change={stats.weekChange} sub="vs. last week"/>
        <Drift.MetricCard label="Weekly rate" value={window.fmtChange(ratePerWeek)} unit="lb/wk" sub={`over ${days} days`}/>
        <Drift.MetricCard label="High · range" value={rangeHigh.toFixed(1)} sub={`over ${days} days`}/>
        <Drift.MetricCard label="Low · range" value={rangeLow.toFixed(1)} sub={`over ${days} days`}/>
      </div>

      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <div className="card" style={{ padding: 32 }}>
          <span className="t-eyebrow">Weekly averages</span>
          <h3 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", margin: "12px 0 24px" }}>How each week landed.</h3>
          <WeeklyBars entries={entries} weeks={Math.min(12, Math.floor(days / 7))}/>
        </div>
        <div className="card" style={{ padding: 32 }}>
          <span className="t-eyebrow">Consistency</span>
          <h3 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", margin: "12px 0 24px" }}>Days logged.</h3>
          <ConsistencyGrid entries={entries} days={Math.min(56, days)}/>
          <div className="hairline-soft" style={{ margin: "20px 0 16px" }}></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{stats.daysLogged}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>of {stats.daysTotal} days</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{stats.streak}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>current streak</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{Math.round(stats.daysLogged / stats.daysTotal * 100)}%</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>logging rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WeeklyBars = ({ entries, weeks = 8 }) => {
  // Group entries into weeks from the end
  const groups = [];
  for (let w = 0; w < weeks; w++) {
    const sliceEnd = entries.length - w * 7;
    const sliceStart = sliceEnd - 7;
    const slice = entries.slice(Math.max(0, sliceStart), sliceEnd);
    if (slice.length) {
      const avg = +(slice.reduce((a, b) => a + b.weight, 0) / slice.length).toFixed(1);
      groups.unshift({ avg, label: window.fmtDate(slice[0].dateObj) });
    }
  }
  if (!groups.length) return null;
  const min = Math.floor(Math.min(...groups.map(g => g.avg)) - 0.4);
  const max = Math.ceil(Math.max(...groups.map(g => g.avg)) + 0.4);

  return (
    <div style={{ display: "flex", alignItems: "end", gap: 10, height: 180 }}>
      {groups.map((g, i) => {
        const h = ((g.avg - min) / (max - min)) * 140 + 20;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 11, color: "var(--ink-3)", fontVariantNumeric: "tabular-nums" }}>{g.avg.toFixed(1)}</div>
            <div style={{
              width: "100%", height: h,
              background: i === groups.length - 1 ? "var(--ink)" : "var(--card-soft)",
              border: i === groups.length - 1 ? "none" : "1px solid var(--line)",
              borderRadius: 8,
            }}/>
            <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{g.label}</div>
          </div>
        );
      })}
    </div>
  );
};

const ConsistencyGrid = ({ entries, days = 56 }) => {
  const D = window.DriftData;
  const today = new Date(D.today);
  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ d, logged: D.byDate.has(key) });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(14, 1fr)`, gap: 4 }}>
      {cells.map((c, i) => (
        <div key={i} title={window.fmtDateLong(c.d)} style={{
          aspectRatio: "1",
          background: c.logged ? "var(--ink)" : "var(--card-soft)",
          border: c.logged ? "none" : "1px solid var(--line)",
          borderRadius: 4,
        }}/>
      ))}
    </div>
  );
};

window.Drift = window.Drift || {};
Object.assign(window.Drift, { Dashboard, TrendsScreen, WeeklyBars, ConsistencyGrid });
