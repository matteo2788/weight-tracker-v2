// Drift — main app shell
const { useState: useStateApp, useEffect: useEffectApp } = React;

const App = () => {
  const [screen, setScreen] = useStateApp("dashboard");
  const [logOpen, setLogOpen] = useStateApp(false);
  const [editingEntry, setEditingEntry] = useStateApp(null);
  const [menuOpen, setMenuOpen] = useStateApp(false);
  const [dataVersion, setDataVersion] = useStateApp(0);

  useEffectApp(() => {
    const refresh = () => setDataVersion(v => v + 1);
    window.addEventListener("drift:data-updated", refresh);
    return () => window.removeEventListener("drift:data-updated", refresh);
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

  const goTo = (id) => { setScreen(id); setMenuOpen(false); window.scrollTo(0, 0); };

  const handleSaveEntry = (entry) => {
    if (!window.DriftStore || typeof window.DriftStore.saveEntry !== "function") return;
    window.DriftStore.saveEntry(entry);
    setDataVersion(v => v + 1);
  };

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
            <button className="icon-btn" aria-label="notifications"><Drift.Icon name="bell" size={17}/></button>
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

      <footer style={{ borderTop: "1px solid var(--line-soft)", marginTop: 80 }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", padding: "32px 40px", color: "var(--ink-3)", fontSize: 13 }}>
          <div className="row gap-3">
            <span className="logo" style={{ fontSize: 18 }}>Drift<span className="logo-dot" style={{ width: 4, height: 4, top: -7 }}/></span>
            <span style={{ marginLeft: 12 }}>The quiet weight tracker</span>
          </div>
          <div className="row gap-6">
            <span>v 2.5</span>
            <span>{window.fmtDateLong(window.DriftData.today)}</span>
            <span>·</span>
            <span>Saved locally</span>
          </div>
        </div>
      </footer>

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