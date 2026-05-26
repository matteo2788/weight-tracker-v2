// Drift — remaining screens
const { useState: useState_x, useMemo: useMemo_x, useEffect: useEffect_x } = React;

/* ============== LOG WEIGHT MODAL ============== */
const LogWeightModal = ({ open, onClose, onSave, initial }) => {
  const D = window.DriftData;
  const [weight, setWeight] = useState_x(initial?.weight ?? D.latest.weight);
  const [dateStr, setDateStr] = useState_x(initial?.date ?? D.today.toISOString().slice(0,10));
  const [note, setNote] = useState_x(initial?.note ?? "");
  const [saved, setSaved] = useState_x(false);

  useEffect_x(() => {
    if (open) {
      setWeight(initial?.weight ?? D.latest.weight);
      setDateStr(initial?.date ?? D.today.toISOString().slice(0,10));
      setNote(initial?.note ?? "");
      setSaved(false);
    }
  }, [open]);

  if (!open) return null;

  const adjust = (delta) => setWeight(w => +(Number(w) + delta).toFixed(1));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      onSave && onSave({ weight: Number(weight), date: dateStr, note });
      onClose();
    }, 700);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="t-eyebrow">{initial ? "Edit weigh-in" : "New weigh-in"}</div>
            <h2 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", margin: "8px 0 0" }}>
              {window.fmtDateLong(dateStr)}
            </h2>
          </div>
          <button className="icon-btn" onClick={onClose}><Drift.Icon name="x" size={18}/></button>
        </div>

        <div className="stepper">
          <button className="stepper-btn" onClick={() => adjust(-0.1)}><Drift.Icon name="minus" size={16}/></button>
          <div style={{ textAlign: "center" }}>
            <input
              value={weight}
              onChange={e => setWeight(e.target.value)}
              style={{
                width: 200, textAlign: "center",
                border: "none", background: "transparent",
                fontFamily: "var(--font-sans)",
                fontWeight: 500, fontSize: 88,
                letterSpacing: "-0.04em",
                color: "var(--ink)",
                fontVariantNumeric: "tabular-nums",
                outline: "none",
                padding: 0,
              }}
            />
            <span className="stepper-unit">lb</span>
          </div>
          <button className="stepper-btn" onClick={() => adjust(0.1)}><Drift.Icon name="plus" size={16}/></button>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 4 }}>
          {[-1, -0.5, +0.5, +1].map(v => (
            <button key={v} className="btn btn-secondary" style={{ height: 30, fontSize: 12, padding: "0 12px" }} onClick={() => adjust(v)}>
              {v > 0 ? "+" : ""}{v}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <label className="t-label" style={{ display: "block", marginBottom: 6 }}>Date</label>
          <input className="input" type="date" value={dateStr} onChange={e => setDateStr(e.target.value)}/>
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="t-label" style={{ display: "block", marginBottom: 6 }}>Note <span style={{ color: "var(--ink-4)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· optional</span></label>
          <textarea
            className="input"
            placeholder="Slept poorly. Heavy dinner last night."
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{ height: 72, padding: 12, resize: "none", lineHeight: 1.45 }}
          />
        </div>

        <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-lg" onClick={handleSave} style={{ minWidth: 140, justifyContent: "center" }}>
            {saved ? <><Drift.Icon name="check" size={16}/> Saved</> : (initial ? "Save changes" : "Save weigh-in")}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============== HISTORY / CALENDAR ============== */
const HistoryScreen = ({ onNav, onEdit }) => {
  const D = window.DriftData;
  const [view, setView] = useState_x("calendar"); // calendar | timeline
  const [monthOffset, setMonthOffset] = useState_x(0);

  const today = new Date(D.today);
  const monthDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthName = monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Build cells: leading blanks + days
  const firstDay = monthDate.getDay(); // 0 = Sunday
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
    const key = dt.toISOString().slice(0,10);
    const entry = D.byDate.get(key);
    const isToday = dt.toDateString() === today.toDateString();
    cells.push({ d, dt, entry, isToday });
  }

  const monthEntries = D.entries.filter(e =>
    e.dateObj.getMonth() === monthDate.getMonth() && e.dateObj.getFullYear() === monthDate.getFullYear()
  );
  const monthAvg = monthEntries.length ? +(monthEntries.reduce((a,b)=>a+b.weight,0) / monthEntries.length).toFixed(1) : 0;
  const monthHigh = monthEntries.length ? Math.max(...monthEntries.map(e => e.weight)) : 0;
  const monthLow = monthEntries.length ? Math.min(...monthEntries.map(e => e.weight)) : 0;

  return (
    <div className="page-enter container section">
      <div className="section-head">
        <div>
          <span className="t-eyebrow">History</span>
          <h1 className="section-title" style={{ marginTop: 12 }}>
            Every <span className="ital">morning</span>, archived.
          </h1>
        </div>
        <div className="tabs">
          <button className={`tab ${view==="calendar"?"active":""}`} onClick={() => setView("calendar")}>Calendar</button>
          <button className={`tab ${view==="timeline"?"active":""}`} onClick={() => setView("timeline")}>Timeline</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }} className="resp-2col">
        <div className="big-card" style={{ padding: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", margin: 0 }}>{monthName}</h2>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="icon-btn" onClick={() => setMonthOffset(o => o - 1)}><Drift.Icon name="chevron-left" size={16}/></button>
              <button className="btn btn-secondary" style={{ height: 32, fontSize: 12 }} onClick={() => setMonthOffset(0)}>Today</button>
              <button className="icon-btn" onClick={() => setMonthOffset(o => Math.min(0, o + 1))}><Drift.Icon name="chevron-right" size={16}/></button>
            </div>
          </div>

          {view === "calendar" ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }}>
                {["S","M","T","W","T","F","S"].map((d, i) => (
                  <div key={i} style={{ textAlign: "center", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.08em", fontWeight: 500 }}>{d}</div>
                ))}
              </div>
              <div className="cal-grid">
                {cells.map((c, i) => {
                  if (!c) return <div key={i} className="cal-cell empty"></div>;
                  const cls = ["cal-cell"];
                  if (c.entry) cls.push("logged");
                  if (c.isToday) cls.push("today");
                  return (
                    <div key={i} className={cls.join(" ")} onClick={() => c.entry && onEdit({ weight: c.entry.weight, date: c.entry.date, note: c.entry.note })}>
                      <span style={{ fontWeight: c.isToday ? 600 : 500 }}>{c.d}</span>
                      {c.entry ? <span className="cal-wt">{c.entry.weight.toFixed(1)}</span> : <span style={{ fontSize: 10, color: "var(--ink-4)" }}>—</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 18, marginTop: 24, fontSize: 12 }}>
                <div className="row gap-2"><span style={{ width: 12, height: 12, background: "#fff", border: "1px solid var(--line)", borderRadius: 3 }}/> Logged</div>
                <div className="row gap-2"><span style={{ width: 12, height: 12, background: "var(--card-soft)", border: "1px solid var(--line)", borderRadius: 3 }}/> Missed</div>
                <div className="row gap-2"><span style={{ width: 12, height: 12, background: "var(--ink)", borderRadius: 3 }}/> Today</div>
              </div>
            </>
          ) : (
            <Timeline entries={D.entries.filter(e =>
              e.dateObj.getMonth() === monthDate.getMonth() && e.dateObj.getFullYear() === monthDate.getFullYear()
            ).slice().reverse()} onEdit={onEdit}/>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <span className="t-label">Month average</span>
            <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 4 }}>
              <span className="t-num-xl" style={{ fontSize: 40, fontWeight: 500 }}>{monthAvg.toFixed(1)}</span>
              <span className="serif-i" style={{ fontSize: 18, color: "var(--ink-3)" }}>lb</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>{monthEntries.length} entries</div>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <span className="t-label">Range</span>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{monthLow.toFixed(1)}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>low</div>
              </div>
              <div style={{ width: 1, background: "var(--line-soft)" }}/>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 24, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{monthHigh.toFixed(1)}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>high</div>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <span className="t-label">Logging rate</span>
            <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 4 }}>
              <span className="t-num-xl" style={{ fontSize: 40, fontWeight: 500 }}>{daysInMonth ? Math.round(monthEntries.length / daysInMonth * 100) : 0}%</span>
            </div>
            <div style={{ height: 6, background: "var(--card-soft)", borderRadius: 999, marginTop: 12, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--ink)", width: `${Math.round(monthEntries.length / daysInMonth * 100)}%`, borderRadius: 999 }}/>
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>{monthEntries.length} of {daysInMonth} days</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Timeline = ({ entries, onEdit }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {entries.map((e, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "100px 1fr auto",
          alignItems: "center", padding: "16px 0",
          borderBottom: i === entries.length - 1 ? "none" : "1px solid var(--line-soft)",
          gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{e.dateObj.getDate()}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{e.dateObj.toLocaleDateString("en-US", { weekday: "short" })}</div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{e.weight.toFixed(1)}</span>
              <span className="serif-i" style={{ fontSize: 14, color: "var(--ink-3)" }}>lb</span>
              <span style={{ marginLeft: 12, fontSize: 12, color: "var(--ink-3)" }}>· 7d avg {e.avg7.toFixed(2)}</span>
            </div>
            {e.note && <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4, fontStyle: "italic" }}>"{e.note}"</div>}
          </div>
          <button className="icon-btn" onClick={() => onEdit({ weight: e.weight, date: e.date, note: e.note })}>
            <Drift.Icon name="edit" size={15}/>
          </button>
        </div>
      ))}
    </div>
  );
};

/* ============== INSIGHTS ============== */
const InsightsScreen = ({ onNav }) => {
  const D = window.DriftData;
  const { stats, entries } = D;
  const monthAvg = +(entries.slice(-30).reduce((a,b)=>a+b.weight,0)/30).toFixed(1);
  const prevMonthAvg = +(entries.slice(-60,-30).reduce((a,b)=>a+b.weight,0)/Math.max(1,entries.slice(-60,-30).length)).toFixed(1);

  const insights = [
    {
      tone: "sage",
      eyebrow: "This week",
      headline: <>Your 7-day average is down <span className="serif-i">{Math.abs(stats.weekChange).toFixed(1)} lb</span> from last week.</>,
      body: "That's a meaningful change — well above day-to-day variation. Keep doing what you're doing.",
      tag: "↓ trending down",
    },
    {
      tone: "sand",
      eyebrow: "Today",
      headline: <>Today's weigh-in is a <span className="serif-i">normal fluctuation</span>.</>,
      body: `Daily weight typically varies ±1.5 lb due to water, sodium, and timing. You're inside that band.`,
      tag: "noise, not signal",
    },
    {
      tone: "sky",
      eyebrow: "Consistency",
      headline: <>You've logged <span className="serif-i">{stats.streak} days</span> in a row.</>,
      body: "Frequent logging makes the 7-day average more accurate. Try to weigh at the same time each morning.",
      tag: `${stats.streak}-day streak`,
    },
    {
      tone: "sage",
      eyebrow: "Month over month",
      headline: <>This month's average is <span className="serif-i">{(monthAvg - prevMonthAvg).toFixed(1)} lb</span> {monthAvg < prevMonthAvg ? "lower than" : "higher than"} last month.</>,
      body: `Tracking a 4-week comparison is more reliable than a single week — it filters weekly water cycles and weekend effects.`,
      tag: "30 vs 30",
    },
  ];

  return (
    <div className="page-enter container section">
      <div className="section-head" style={{ marginBottom: 16 }}>
        <div>
          <span className="t-eyebrow">Insights</span>
          <h1 className="section-title" style={{ marginTop: 12 }}>
            Calm observations, <span className="ital">drawn</span> from your data.
          </h1>
          <p className="t-body" style={{ maxWidth: 560, marginTop: 14 }}>
            Drift looks for patterns over weeks and months — not minutes. Here's what it's seeing right now.
          </p>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 32 }}>
        {insights.map((ins, i) => (
          <div key={i} className="card" style={{ padding: 32, position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
              <span className="t-eyebrow">{ins.eyebrow}</span>
              <span className={`pill pill-${ins.tone}`}>{ins.tag}</span>
            </div>
            <h3 style={{
              fontSize: 26, fontWeight: 500, lineHeight: 1.2,
              letterSpacing: "-0.015em", margin: "0 0 16px", color: "var(--ink)",
              textWrap: "balance",
            }}>
              {ins.headline}
            </h3>
            <p className="t-body" style={{ margin: 0 }}>{ins.body}</p>
          </div>
        ))}
      </div>

      {/* Long-running observation */}
      <div className="card resp-2col" style={{ padding: 40, marginTop: 24, display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)", gap: 40, alignItems: "center" }}>
        <div>
          <span className="t-eyebrow">Long view</span>
          <h3 style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.02em", margin: "12px 0 16px", textWrap: "balance" }}>
            Since you started, your <span className="serif-i">7-day average</span> has moved {window.fmtChange(stats.totalChange)} lb.
          </h3>
          <p className="t-body" style={{ margin: 0 }}>
            At your current rate, you're trending {Math.abs(stats.avgRatePerWeek)} lb per week. The chart shows the steady direction — even on the days the scale jumps around.
          </p>
        </div>
        <div>
          <Drift.TrendChart entries={entries} height={220} days={120}/>
        </div>
      </div>
    </div>
  );
};

/* ============== SETTINGS ============== */
const SettingsScreen = () => {
  const [unit, setUnit] = useState_x("lb");
  const [reminder, setReminder] = useState_x(true);
  const [weekStart, setWeekStart] = useState_x("Sunday");
  const [theme, setTheme] = useState_x("Cream");
  const [showDaily, setShowDaily] = useState_x(true);
  const [goal, setGoal] = useState_x("172.0");

  const Row = ({ label, hint, children }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 24, padding: "20px 0", borderBottom: "1px solid var(--line-soft)" }}>
      <div>
        <div style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );

  const SegBtn = ({ value, current, set, children }) => (
    <button className="tab" onClick={() => set(value)} style={{
      padding: "8px 14px",
      background: current === value ? "var(--ink)" : "transparent",
      color: current === value ? "#fff" : "var(--ink-3)",
    }}>{children}</button>
  );

  return (
    <div className="page-enter container section">
      <div className="section-head" style={{ marginBottom: 40 }}>
        <div>
          <span className="t-eyebrow">Settings</span>
          <h1 className="section-title" style={{ marginTop: 12 }}>
            Make Drift <span className="ital">yours</span>.
          </h1>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="resp-2col">
        <div className="big-card">
          <h3 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 8px" }}>Preferences</h3>
          <Row label="Units" hint="Show weights in pounds or kilograms.">
            <div className="tabs"><SegBtn value="lb" current={unit} set={setUnit}>lb</SegBtn><SegBtn value="kg" current={unit} set={setUnit}>kg</SegBtn></div>
          </Row>
          <Row label="Daily reminder" hint="A gentle nudge at 8am to weigh in.">
            <div className={`toggle ${reminder ? "on" : ""}`} onClick={() => setReminder(r => !r)}><div className="toggle-knob"/></div>
          </Row>
          <Row label="Show daily dots" hint="Display individual weigh-ins beneath the trend.">
            <div className={`toggle ${showDaily ? "on" : ""}`} onClick={() => setShowDaily(s => !s)}><div className="toggle-knob"/></div>
          </Row>
          <Row label="Week starts on">
            <div className="tabs"><SegBtn value="Sunday" current={weekStart} set={setWeekStart}>Sun</SegBtn><SegBtn value="Monday" current={weekStart} set={setWeekStart}>Mon</SegBtn></div>
          </Row>
          <Row label="Theme">
            <div className="tabs"><SegBtn value="Cream" current={theme} set={setTheme}>Cream</SegBtn><SegBtn value="Linen" current={theme} set={setTheme}>Linen</SegBtn><SegBtn value="Stone" current={theme} set={setTheme}>Stone</SegBtn></div>
          </Row>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="big-card">
            <h3 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 8px" }}>Goal</h3>
            <Row label="Target weight" hint="Used only to track progress — never a deadline.">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input className="input" value={goal} onChange={e => setGoal(e.target.value)} style={{ width: 88, textAlign: "right", fontVariantNumeric: "tabular-nums" }}/>
                <span className="serif-i" style={{ color: "var(--ink-3)" }}>lb</span>
              </div>
            </Row>
            <Row label="Auto-recompute trend" hint="Drift updates the 7-day average on every new entry.">
              <div className={`toggle on`}><div className="toggle-knob"/></div>
            </Row>
          </div>

          <div className="big-card">
            <h3 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 8px" }}>Account</h3>
            <Row label="Email" hint="howard@example.com">
              <button className="btn btn-secondary" style={{ height: 32, fontSize: 12 }}>Change</button>
            </Row>
            <Row label="Export data" hint="Download all entries as CSV.">
              <button className="btn btn-secondary" style={{ height: 32, fontSize: 12 }}>Export</button>
            </Row>
            <Row label="Sign out">
              <button className="btn btn-ghost" style={{ height: 32, fontSize: 12 }}>Sign out</button>
            </Row>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Drift = window.Drift || {};
Object.assign(window.Drift, { LogWeightModal, HistoryScreen, InsightsScreen, SettingsScreen });
