// Drift — trend revamp for dashboard + trends page
(function () {
  const { useMemo, useState } = React;

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function round(n, digits = 1) {
    const p = Math.pow(10, digits);
    return Math.round((Number(n) || 0) * p) / p;
  }
  function avg(list, key = "weight") {
    if (!list || !list.length) return 0;
    return list.reduce((sum, item) => sum + (Number(item[key]) || 0), 0) / list.length;
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
    const days = Math.max(1, list.length - 1);
    return ((last - first) / days) * 7;
  }
  function volatility(entries) {
    const list = entries || [];
    if (list.length < 2) return 0;
    const diffs = [];
    for (let i = 1; i < list.length; i++) diffs.push(Math.abs((list[i].weight || 0) - (list[i - 1].weight || 0)));
    return avg(diffs.map(v => ({ weight: v })));
  }
  function loggingRate(entries, days) {
    if (!days) return 0;
    return clamp(Math.round(((entries || []).length / days) * 100), 0, 100);
  }
  function buildWeeks(entries, weekCount = 6) {
    const list = entries || [];
    const weeks = [];
    for (let i = weekCount - 1; i >= 0; i--) {
      const end = list.length - i * 7;
      const start = Math.max(0, end - 7);
      const slice = list.slice(start, end);
      if (!slice.length) continue;
      weeks.push({
        label: dateShort(slice[0].dateObj || slice[0].date),
        avg: round(avg(slice), 1),
        entries: slice.length,
        change: weeks.length ? round(avg(slice) - weeks[weeks.length - 1].avg, 1) : 0,
      });
    }
    return weeks;
  }
  function trendVerdict(rate) {
    if (rate <= -1.25) return { label: "Fast drop", tone: "strong", copy: "You are trending down quickly. Make sure energy, training, and recovery still feel good." };
    if (rate <= -0.25) return { label: "Cutting pace", tone: "good", copy: "The trend is moving down at a realistic pace. Keep judging the average, not single weigh-ins." };
    if (rate < 0.25) return { label: "Holding steady", tone: "neutral", copy: "Your trend is mostly stable. This can be maintenance, water noise, or a short plateau." };
    return { label: "Trending up", tone: "watch", copy: "Your trend is moving up. Check calories, sodium, weekends, and logging consistency before panicking." };
  }
  function futureProjection(entries, days = 28) {
    if (!entries.length) return [];
    const last = entries[entries.length - 1];
    const slopePerDay = estimateSlopePerWeek(entries) / 7;
    const base = last.avg7 || last.weight;
    return [7, 14, 21, 28].map(d => ({ day: d, weight: round(base + slopePerDay * d, 1) }));
  }

  const EmptyTrendState = ({ onLog }) => (
    <div className="big-card" style={{ padding: 34, textAlign: "center" }}>
      <div className="t-eyebrow">Trend engine</div>
      <h2 style={{ fontSize: "clamp(30px, 5vw, 52px)", fontWeight: 500, letterSpacing: "-0.04em", margin: "12px 0 10px" }}>
        No trend yet.
      </h2>
      <p className="t-body" style={{ maxWidth: 520, margin: "0 auto 22px", lineHeight: 1.55 }}>
        Log a few morning weigh-ins and Drift will separate water noise from actual progress. The magic starts after about 7 entries.
      </p>
      {onLog && <button className="btn btn-primary btn-lg" onClick={onLog}><Drift.Icon name="plus" size={16}/> Log your first weight</button>}
    </div>
  );

  const MiniTrend = ({ entries, height = 190 }) => {
    if (!entries || entries.length < 2) return <div style={{ height, display: "grid", placeItems: "center", color: "var(--ink-3)", fontSize: 13 }}>Log 2+ days to draw a trend.</div>;
    return <Drift.TrendChart entries={entries} days={Math.min(entries.length, 90)} height={height}/>;
  };

  const InsightCard = ({ eyebrow, title, body, children, dark }) => (
    <div className={dark ? "big-card" : "card"} style={{ padding: 24, background: dark ? "var(--ink)" : undefined, color: dark ? "#fff" : undefined }}>
      <div className="t-eyebrow" style={{ color: dark ? "rgba(255,255,255,.58)" : undefined }}>{eyebrow}</div>
      <h3 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", margin: "10px 0 8px" }}>{title}</h3>
      {body && <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0, color: dark ? "rgba(255,255,255,.72)" : "var(--ink-3)" }}>{body}</p>}
      {children && <div style={{ marginTop: 18 }}>{children}</div>}
    </div>
  );

  const SignalPill = ({ label, value, sub }) => (
    <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 16 }}>
      <div className="t-label">{label}</div>
      <div style={{ marginTop: 6, fontSize: 30, fontWeight: 500, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{value}</div>
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
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gap: 8, alignItems: "end", height: 160 }}>
        {weeks.map((w, i) => {
          const h = 36 + ((w.avg - min) / spread) * 84;
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

  const ProjectionRail = ({ projection }) => {
    if (!projection.length) return null;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {projection.map(p => (
          <div key={p.day} style={{ padding: 14, border: "1px solid var(--line-soft)", borderRadius: 18, background: "var(--card-soft)" }}>
            <div className="t-label">+{p.day}d</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 500, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{p.weight.toFixed(1)}</div>
          </div>
        ))}
      </div>
    );
  };

  const DashboardRevamp = ({ onNav, onLog }) => {
    const D = window.DriftData;
    const entries = D.entries || [];
    const hasData = entries.length > 0;
    const last30 = getWindow(entries, 30);
    const last14 = getWindow(entries, 14);
    const rate = estimateSlopePerWeek(last30.length >= 7 ? last30 : entries);
    const verdict = trendVerdict(rate);
    const weekChange = D.stats?.weekChange || 0;
    const v = volatility(last14);
    const rate30 = loggingRate(last30, 30);

    return (
      <div className="page-enter">
        <section className="hero container" style={{ paddingBottom: 26 }}>
          <div className="hero-eyebrow"><span>The Drift Index · {window.fmtDateLong(D.today)}</span></div>
          <h1 className="hero-title">See the signal.<br/><span className="ital">Ignore</span> the noise.</h1>
          <p className="hero-sub">Drift now reads your weigh-ins like a trend coach: today, direction, noise, consistency, and what the next few weeks probably look like.</p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={onLog}><Drift.Icon name="plus" size={16}/> Log today's weight</button>
            <button className="btn btn-secondary btn-lg" onClick={() => onNav("trends")}>Open trend lab <Drift.Icon name="arrow-right" size={14}/></button>
          </div>
        </section>

        <section className="container" style={{ paddingBottom: 72 }}>
          {!hasData ? <EmptyTrendState onLog={onLog}/> : (
            <div className="big-card" style={{ padding: "clamp(22px, 4vw, 38px)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(280px, .75fr)", gap: 28 }} className="resp-2col">
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", marginBottom: 20 }}>
                    <div>
                      <div className="t-eyebrow">Today’s signal</div>
                      <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "clamp(56px, 11vw, 108px)", fontWeight: 500, letterSpacing: "-0.06em", lineHeight: .9, fontVariantNumeric: "tabular-nums" }}>{D.hasTodayEntry ? safeFmt(D.stats.today, 1) : "—"}</span>
                        <span className="serif-i" style={{ fontSize: 28, color: "var(--ink-3)" }}>lb</span>
                      </div>
                      <p style={{ margin: "12px 0 0", color: "var(--ink-3)", fontSize: 14 }}>{D.hasTodayEntry ? `7-day signal: ${safeFmt(D.stats.todayAvg, 2)} lb` : "New day started. Log today to refresh the dashboard."}</p>
                    </div>
                    <span className="pill pill-sage"><span className="dot" style={{ background: D.hasTodayEntry ? "#4D6248" : "var(--ink-4)" }}></span>{D.hasTodayEntry ? "logged" : "fresh day"}</span>
                  </div>
                  <MiniTrend entries={entries} height={260}/>
                </div>

                <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
                  <InsightCard eyebrow="Read this first" title={verdict.label} body={verdict.copy} dark>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div><div className="t-label" style={{ color: "rgba(255,255,255,.55)" }}>pace</div><div style={{ fontSize: 28, fontWeight: 500, marginTop: 6 }}>{changeText(rate)}<span className="serif-i" style={{ fontSize: 15, marginLeft: 4 }}>lb/wk</span></div></div>
                      <div><div className="t-label" style={{ color: "rgba(255,255,255,.55)" }}>noise</div><div style={{ fontSize: 28, fontWeight: 500, marginTop: 6 }}>{safeFmt(v, 1)}<span className="serif-i" style={{ fontSize: 15, marginLeft: 4 }}>lb/day</span></div></div>
                    </div>
                  </InsightCard>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <SignalPill label="7-day move" value={`${changeText(weekChange)} lb`} sub="Latest average vs one week ago" />
                    <SignalPill label="Logging" value={`${rate30}%`} sub="Last 30 days captured" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {hasData && <section className="container" style={{ paddingBottom: 82 }}>
          <div className="section-head">
            <div>
              <span className="t-eyebrow">Next-best actions</span>
              <h2 className="section-title" style={{ marginTop: 12, fontSize: "clamp(28px, 4vw, 44px)" }}>What your trend is asking for.</h2>
            </div>
            <button className="btn btn-secondary" onClick={() => onNav("trends")}>Open trend lab <Drift.Icon name="arrow-right" size={14}/></button>
          </div>
          <div className="grid grid-3" style={{ marginTop: 22 }}>
            <InsightCard eyebrow="Do" title={rate30 < 60 ? "Log more often" : "Keep the rhythm"} body={rate30 < 60 ? "The trend is only as smart as the entries. Aim for 4–7 weigh-ins per week." : "Your consistency is strong enough for the trend to mean something."}/>
            <InsightCard eyebrow="Watch" title={v > 1.2 ? "High water noise" : "Normal fluctuation"} body={v > 1.2 ? "Big day-to-day swings usually mean food volume, sodium, stress, or sleep are masking fat loss." : "Your daily changes are not too chaotic. The average should be fairly readable."}/>
            <InsightCard eyebrow="Judge" title="Use 14–30 days" body="One weigh-in is a weather report. Two to four weeks is the climate. Make decisions from the climate."/>
          </div>
        </section>}
      </div>
    );
  };

  const TrendsRevamp = ({ onNav }) => {
    const D = window.DriftData;
    const entries = D.entries || [];
    const [range, setRange] = useState("60");
    const days = parseInt(range, 10);
    const win = getWindow(entries, days);
    const hasData = entries.length > 0;
    const rate = estimateSlopePerWeek(win);
    const verdict = trendVerdict(rate);
    const v = volatility(win);
    const rateLogged = loggingRate(win, days);
    const weeks = buildWeeks(win, Math.min(8, Math.ceil(days / 7)));
    const projection = futureProjection(win);
    const avgWeight = round(avg(win), 1);
    const high = win.length ? Math.max(...win.map(e => e.weight)) : 0;
    const low = win.length ? Math.min(...win.map(e => e.weight)) : 0;
    const change = win.length > 1 ? round((win[win.length - 1].avg7 || win[win.length - 1].weight) - (win[0].avg7 || win[0].weight), 1) : 0;

    return (
      <div className="page-enter container section">
        <div className="section-head" style={{ marginBottom: 32 }}>
          <div>
            <span className="t-eyebrow">Trend lab</span>
            <h1 className="section-title" style={{ marginTop: 12 }}>Your weight, <span className="ital">decoded</span>.</h1>
            <p className="t-body" style={{ maxWidth: 560, marginTop: 14 }}>This page does more than show a line. It tells you what the line means, how noisy it is, how reliable it is, and what to do next.</p>
          </div>
          <div className="tabs">
            {["14","30","60","90","120"].map(r => <button key={r} className={`tab ${range===r?"active":""}`} onClick={() => setRange(r)}>{r}d</button>)}
          </div>
        </div>

        {!hasData ? <EmptyTrendState/> : (
          <>
            <div className="big-card" style={{ padding: "clamp(22px, 4vw, 36px)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 26 }} className="resp-2col">
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "end", marginBottom: 18, flexWrap: "wrap" }}>
                    <div>
                      <div className="t-label">Signal score</div>
                      <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: "clamp(44px, 7vw, 72px)", fontWeight: 500, letterSpacing: "-0.05em" }}>{verdict.label}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="t-label">Selected change</div>
                      <div style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>{changeText(change)} <span className="serif-i" style={{ fontSize: 17, color: "var(--ink-3)" }}>lb</span></div>
                    </div>
                  </div>
                  <MiniTrend entries={win} height={390}/>
                </div>
                <div style={{ display: "grid", gap: 14 }}>
                  <InsightCard eyebrow="Coach read" title={verdict.label} body={verdict.copy} dark/>
                  <SignalPill label="Trend pace" value={`${changeText(rate)} lb/wk`} sub="Based on the 7-day average direction" />
                  <SignalPill label="Noise level" value={`${safeFmt(v, 1)} lb`} sub="Average day-to-day jump" />
                </div>
              </div>
            </div>

            <div className="grid grid-4" style={{ marginTop: 24 }}>
              <Drift.MetricCard label="Average" value={safeFmt(avgWeight, 1)} unit="lb" sub={`over ${Math.min(days, win.length)} logged days`}/>
              <Drift.MetricCard label="High" value={safeFmt(high, 1)} unit="lb" sub="highest weigh-in"/>
              <Drift.MetricCard label="Low" value={safeFmt(low, 1)} unit="lb" sub="lowest weigh-in"/>
              <Drift.MetricCard label="Logging rate" value={`${rateLogged}`} unit="%" sub="range coverage"/>
            </div>

            <div className="grid grid-2" style={{ marginTop: 24 }}>
              <div className="card" style={{ padding: 30 }}>
                <span className="t-eyebrow">Week ladder</span>
                <h3 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", margin: "12px 0 20px" }}>Each week as a step, not a messy line.</h3>
                <WeekStrip weeks={weeks}/>
                <p style={{ margin: "18px 0 0", fontSize: 13, color: "var(--ink-3)", lineHeight: 1.45 }}>This makes the real direction easier to see than daily spikes.</p>
              </div>
              <div className="card" style={{ padding: 30 }}>
                <span className="t-eyebrow">Projection</span>
                <h3 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", margin: "12px 0 20px" }}>If this pace continues.</h3>
                <ProjectionRail projection={projection}/>
                <p style={{ margin: "18px 0 0", fontSize: 13, color: "var(--ink-3)", lineHeight: 1.45 }}>Not a promise. Just a calm estimate from your current trend pace.</p>
              </div>
            </div>

            <div className="grid grid-3" style={{ marginTop: 24 }}>
              <InsightCard eyebrow="Decision rule" title="Don’t adjust from one bad weigh-in" body="Only change calories or habits when the 14–30 day trend disagrees with your goal."/>
              <InsightCard eyebrow="If stuck" title="Check adherence before cutting more" body="Look at weekends, portions, sauces, snacks, steps, sleep, and logging consistency first."/>
              <InsightCard eyebrow="If dropping fast" title="Protect performance" body="Fast drops can feel exciting, but energy, lifts, mood, and hunger matter too."/>
            </div>
          </>
        )}
      </div>
    );
  };

  window.Drift = window.Drift || {};
  Object.assign(window.Drift, { Dashboard: DashboardRevamp, TrendsScreen: TrendsRevamp });
})();
