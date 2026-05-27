// Drift — Settings override with working notification controls
(function () {
  const { useEffect, useState } = React;

  const SettingsScreenWithNotifications = () => {
    const reminderApi = window.DriftReminder;
    const initialReminder = reminderApi ? reminderApi.load() : { enabled: false, time: "08:00" };

    const [unit, setUnit] = useState("lb");
    const [weekStart, setWeekStart] = useState("Sunday");
    const [theme, setTheme] = useState("Cream");
    const [showDaily, setShowDaily] = useState(true);
    const [goal, setGoal] = useState("172.0");
    const [reminder, setReminder] = useState(initialReminder.enabled);
    const [reminderTime, setReminderTime] = useState(initialReminder.time || "08:00");
    const [permission, setPermission] = useState(reminderApi ? reminderApi.permission() : "unsupported");
    const [notice, setNotice] = useState("");
    const [testing, setTesting] = useState(false);

    useEffect(() => {
      const sync = () => {
        const next = reminderApi ? reminderApi.load() : { enabled: false, time: "08:00" };
        setReminder(next.enabled);
        setReminderTime(next.time || "08:00");
        setPermission(reminderApi ? reminderApi.permission() : "unsupported");
      };
      window.addEventListener("drift:reminder-updated", sync);
      sync();
      return () => window.removeEventListener("drift:reminder-updated", sync);
    }, []);

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

    const enableReminder = async () => {
      if (!reminderApi || !reminderApi.isSupported()) {
        setNotice("This browser does not support web notifications.");
        return;
      }

      const result = await reminderApi.requestPermission();
      setPermission(result);

      if (result === "granted") {
        reminderApi.save({ enabled: true, time: reminderTime });
        setReminder(true);
        setNotice("Reminder is on. Tap Test notification to confirm your iPhone allows Drift alerts.");
      } else if (result === "denied") {
        reminderApi.save({ enabled: false });
        setReminder(false);
        setNotice("Notifications are blocked. On iPhone, open Settings > Notifications and allow Drift notifications.");
      } else {
        reminderApi.save({ enabled: false });
        setReminder(false);
        setNotice("Permission was not granted yet. Tap the reminder again when you are ready to allow notifications.");
      }
    };

    const toggleReminder = async () => {
      if (reminder) {
        reminderApi && reminderApi.save({ enabled: false });
        setReminder(false);
        setNotice("Daily reminder is off.");
      } else {
        await enableReminder();
      }
    };

    const changeReminderTime = (value) => {
      setReminderTime(value);
      reminderApi && reminderApi.save({ time: value, enabled: reminder });
      if (reminder) setNotice(`Daily reminder set for ${value}.`);
    };

    const testNotification = async () => {
      if (!reminderApi) return;
      setTesting(true);
      const ok = await reminderApi.test();
      setTesting(false);
      setPermission(reminderApi.permission());
      setNotice(ok ? "Test sent. If it did not pop up, check iPhone notification settings for Drift." : "Test could not send because notification permission is not allowed yet.");
    };

    const permissionLabel = permission === "granted" ? "Allowed" : permission === "denied" ? "Blocked" : permission === "unsupported" ? "Unsupported" : "Not allowed yet";
    const standaloneHint = reminderApi && !reminderApi.isStandalone()
      ? "For iPhone notifications, add Drift to your Home Screen first, then open it from that Home Screen icon."
      : "Works best when Drift is opened from your iPhone Home Screen.";

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

            <Row label="Daily reminder" hint={`A gentle nudge at your chosen time. ${standaloneHint}`}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <input className="input" type="time" value={reminderTime} onChange={e => changeReminderTime(e.target.value)} style={{ width: 112, height: 38, fontSize: 13 }}/>
                <div className={`toggle ${reminder ? "on" : ""}`} onClick={toggleReminder}><div className="toggle-knob"/></div>
              </div>
            </Row>

            <div style={{ padding: "16px 0 20px", borderBottom: "1px solid var(--line-soft)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500 }}>Notification status</div>
                  <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>{permissionLabel}</div>
                </div>
                <button className="btn btn-secondary" style={{ height: 34, fontSize: 12 }} onClick={testNotification}>{testing ? "Sending..." : "Test notification"}</button>
              </div>
              {notice && <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.4, color: "var(--ink-2)", background: "var(--card-soft)", border: "1px solid var(--line-soft)", padding: 12, borderRadius: 14 }}>{notice}</div>}
            </div>

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
  window.Drift.SettingsScreen = SettingsScreenWithNotifications;
})();
