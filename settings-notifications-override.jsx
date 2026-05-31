// Drift — Settings override without notification controls
(function () {
  const { useState } = React;

  const SettingsScreenClean = () => {
    const [unit, setUnit] = useState("lb");
    const [weekStart, setWeekStart] = useState("Sunday");
    const [theme, setTheme] = useState("Cream");
    const [showDaily, setShowDaily] = useState(true);
    const [goal, setGoal] = useState("172.0");

    const Row = ({ label, hint, children }) => (
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 24, padding: "20px 0", borderBottom: "1px solid var(--line-soft)" }}>
        <div>
          <div style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500 }}>{label}</div>
          {hint && <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4, maxWidth: 440 }}>{hint}</div>}
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
  window.Drift.SettingsScreen = SettingsScreenClean;
})();
