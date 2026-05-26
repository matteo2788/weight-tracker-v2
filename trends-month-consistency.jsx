// Trends page patch — month-based consistency grid
(function () {
  const { useState } = React;

  const MonthConsistencyGrid = () => {
    const D = window.DriftData;
    const today = new Date(D.today);
    today.setHours(0, 0, 0, 0);

    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = firstDay.getDay();
    const monthName = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const cells = [];
    for (let i = 0; i < leadingBlanks; i++) {
      cells.push({ type: "blank", key: `blank-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const key = d.toISOString().slice(0, 10);
      const isFuture = d > today;
      cells.push({
        type: "day",
        key,
        day,
        logged: D.byDate.has(key),
        future: isFuture,
        today: key === today.toISOString().slice(0, 10),
        label: window.fmtDateLong(d),
      });
    }

    const loggedThisMonth = cells.filter(c => c.type === "day" && c.logged).length;
    const availableDays = cells.filter(c => c.type === "day" && !c.future).length || 1;
    const monthRate = Math.round((loggedThisMonth / availableDays) * 100);

    return (
      <>
        <div className="month-consistency-head">
          <span>{monthName}</span>
          <span>{loggedThisMonth}/{availableDays} logged</span>
        </div>

        <div className="month-weekdays" aria-hidden="true">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={`${d}-${i}`}>{d}</span>)}
        </div>

        <div className="month-consistency-grid" aria-label={`Logged days in ${monthName}`}>
          {cells.map((c) => {
            if (c.type === "blank") return <span key={c.key} className="month-dot blank" aria-hidden="true"/>;
            return (
              <span
                key={c.key}
                className={`month-dot ${c.logged ? "logged" : "empty"} ${c.future ? "future" : ""} ${c.today ? "today" : ""}`}
                title={c.label}
                aria-label={`${c.label}: ${c.logged ? "logged" : "not logged"}`}
              >
                <span>{c.day}</span>
              </span>
            );
          })}
        </div>

        <div className="month-consistency-stats">
          <div>
            <strong>{loggedThisMonth}</strong>
            <span>logged</span>
          </div>
          <div>
            <strong>{availableDays - loggedThisMonth}</strong>
            <span>missed</span>
          </div>
          <div>
            <strong>{monthRate}%</strong>
            <span>month rate</span>
          </div>
        </div>
      </>
    );
  };

  const PatchedTrendsScreen = ({ onNav }) => {
    const D = window.DriftData;
    const { entries, stats } = D;
    const [range, setRange] = useState("90");
    const days = parseInt(range, 10);

    const win = entries.slice(-days);
    const safeWin = win.length ? win : entries;
    const avg = +(safeWin.reduce((a, b) => a + b.weight, 0) / safeWin.length).toFixed(1);
    const rangeHigh = Math.max(...safeWin.map(e => e.weight));
    const rangeLow = Math.min(...safeWin.map(e => e.weight));
    const rangeChange = +(safeWin[safeWin.length - 1].avg7 - safeWin[0].avg7).toFixed(1);
    const ratePerWeek = +((rangeChange / (days / 7))).toFixed(2);

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
            {["30", "60", "90", "120"].map(r => (
              <button key={r} className={`tab ${range === r ? "active" : ""}`} onClick={() => setRange(r)}>{r}d</button>
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
            <Drift.WeeklyBars entries={entries} weeks={Math.min(12, Math.floor(days / 7))}/>
          </div>
          <div className="card month-consistency-card" style={{ padding: 32 }}>
            <span className="t-eyebrow">Consistency</span>
            <h3 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", margin: "12px 0 24px" }}>Days logged this month.</h3>
            <MonthConsistencyGrid />
          </div>
        </div>
      </div>
    );
  };

  window.Drift = window.Drift || {};
  window.Drift.TrendsScreen = PatchedTrendsScreen;
  window.Drift.MonthConsistencyGrid = MonthConsistencyGrid;
})();