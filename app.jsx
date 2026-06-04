// Drift — main app shell
const { useState: useStateApp, useEffect: useEffectApp } = React;

const App = () => {
  const [screen, setScreen] = useStateApp("dashboard");
  const [logOpen, setLogOpen] = useStateApp(false);
  const [editingEntry, setEditingEntry] = useStateApp(null);
  const [menuOpen, setMenuOpen] = useStateApp(false);
  const [dataVersion, setDataVersion] = useStateApp(0);
  const [dailyPromptOpen, setDailyPromptOpen] = useStateApp(false);

  const todayKey = () => window.DriftStore && window.DriftStore.todayKey ? window.DriftStore.todayKey() : new Date().toISOString().slice(0, 10);
  const promptKey = () => `drift-daily-prompt-seen-${todayKey()}`;

  const maybeShowDailyPrompt = () => {
    if (!window.DriftStore || typeof window.DriftStore.hasLoggedToday !== "function") return;
    if (window.DriftStore.hasLoggedToday()) return;
    if (sessionStorage.getItem(promptKey()) === "1") return;
    sessionStorage.setItem(promptKey(), "1");
    setDailyPromptOpen(true);
  };

  useEffectApp(() => {
    const refresh = () => {
      if (window.DriftStore && typeof window.DriftStore.buildData === "function" && typeof window.DriftStore.getEntries === "function") {
        window.DriftData = window.DriftStore.buildData(window.DriftStore.getEntries());
      }
      setDataVersion(v => v + 1);
    };
    window.addEventListener("drift:data-updated", refresh);
    return () => window.removeEventListener("drift:data-updated", refresh);
  }, []);

  useEffectApp(() => {
    maybeShowDailyPrompt();
    const tick = setInterval(() => {
      if (window.DriftStore && typeof window.DriftStore.buildData === "function" && typeof window.DriftStore.getEntries === "function") {
        const before = window.DriftData && window.DriftData.todayKey;
        window.DriftData = window.DriftStore.buildData(window.DriftStore.getEntries());
        const after = window.DriftData && window.DriftData.todayKey;
        if (before !== after) {
          setDataVersion(v => v + 1);
          maybeShowDailyPrompt();
        }
      }
    }, 60000);
    const onVisible = () => {
      if (!document.hidden) {
        if (window.DriftStore && typeof window.DriftStore.buildData === "function" && typeof window.DriftStore.getEntries === "function") {
          window.DriftData = window.DriftStore.buildData(window.DriftStore.getEntries());
          setDataVersion(v => v + 1);
        }
        maybeShowDailyPrompt();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "trends", label: "Trends" },
    { id: "goals", label: "Goals" },
    { id: "history", label: "History" },
    { id: "insights", label: "Insights" },
    { id: "settings", label: "Settings" },
  ];

  const openLog = (entry) => {
    setEditingEntry(entry || null);
    setLogOpen(true);
  };

  const openTodayLog = () => {
    setDailyPromptOpen(false);
    setEditingEntry(null);
    setLogOpen(true);
  };

  const goTo = (id) => { setScreen(id); setMenuOpen(false); window.scrollTo(0, 0); };

  const handleSaveEntry = (entry) => {
    if (!window.DriftStore || typeof window.DriftStore.saveEntry !== "function") return;
    window.DriftStore.saveEntry(entry);
    setDailyPromptOpen(false);
    setDataVersion(v => v + 1);
  };

  const D = window.DriftData;
  const needsTodayLog = D && !D.hasTodayEntry;

  return (
    <div className="shell" data-screen-label={screen} data-data-version={dataVersion}>
      <header className="nav">
        <div className="container nav-inner">
          <button className="logo" onClick={() => goTo("dashboard")} aria-label="Drift home">
            <span>Drift</span>
            <span className="logo-dot"></span>
          </button>
          <nav className="nav-links">
            {navItems.map(it => (
              <button
                key={it.id}
                className={`nav-link ${screen === it.id ? "active" : ""}`}
                onClick={() => goTo(it.id)}
              >
                {it.label}
              </button>
            ))}
          </nav>
          <div className="nav-right">
            <button className="btn btn-primary" onClick={() => openLog()}>
              <Drift.Icon name="plus" size={14}/> <span className="btn-label">Log weight</span>
            </button>
            <button className="icon-btn" aria-label="daily weigh-in" onClick={openTodayLog}><Drift.Icon name="bell" size={17}/></button>
            <div className="avatar">HF</div>
            <button
              className="nav-menu-btn"
              aria-label="open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(o => !o)}
            >
              {menuOpen
                ? <Drift.Icon name="x" size={18}/>
                : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="4" y1="7" x2="20" y2="7"/>
                    <line x1="4" y1="13" x2="20" y2="13"/>
                    <line x1="4" y1="19" x2="14" y2="19"/>
                  </svg>
                )
              }
            </button>
          </div>
        </div>
        <div className={`nav-sheet ${menuOpen ? "open" : ""}`}>
          {navItems.map(it => (
            <button
              key={it.id}
              className={`nav-sheet-link ${screen === it.id ? "active" : ""}`}
              onClick={() => goTo(it.id)}
            >
              <span>{it.label}</span>
              <Drift.Icon name="arrow-right" size={14} style={{ color: "var(--ink-3)" }}/>
            </button>
          ))}
        </div>
        {menuOpen && <div className="nav-scrim" onClick={() => setMenuOpen(false)}/>} 
      </header>

      <main key={`${screen}-${dataVersion}`}>
        {screen === "dashboard" && <Drift.Dashboard onNav={goTo} onLog={() => openLog()}/>} 
        {screen === "trends" && <Drift.TrendsScreen onNav={goTo}/>} 
        {screen === "goals" && <Drift.GoalsScreen/>}
        {screen === "history" && <Drift.HistoryScreen onNav={goTo} onEdit={openLog}/>} 
        {screen === "insights" && <Drift.InsightsScreen onNav={goTo}/>} 
        {screen === "settings" && <Drift.SettingsScreen/>}
      </main>

      {dailyPromptOpen && needsTodayLog && (
        <div className="modal-backdrop" onClick={() => setDailyPromptOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="t-eyebrow">New day</div>
            <h2 style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.03em", margin: "10px 0 8px" }}>Log today’s weight.</h2>
            <p className="t-body" style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
              Your dashboard resets at 12:00 AM Toronto time. Add today’s weigh-in to start the new day clean.
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <button className="btn btn-ghost" onClick={() => setDailyPromptOpen(false)}>Later</button>
              <button className="btn btn-primary btn-lg" onClick={openTodayLog}><Drift.Icon name="plus" size={16}/> Log weight</button>
            </div>
          </div>
        </div>
      )}

      <Drift.LogWeightModal
        open={logOpen}
        onClose={() => { setLogOpen(false); setEditingEntry(null); }}
        onSave={handleSaveEntry}
        initial={editingEntry}
      />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);