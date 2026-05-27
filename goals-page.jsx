// Drift — Goals page
(function () {
  const { useMemo, useState } = React;

  const STORAGE_KEY = "drift-goal-v1";

  function readGoal(defaults) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults;
      return { ...defaults, ...JSON.parse(raw) };
    } catch (_) {
      return defaults;
    }
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function formatLb(n, digits = 1) {
    if (!Number.isFinite(n)) return "—";
    return n.toFixed(digits);
  }

  const GoalsScreen = () => {
    const D = window.DriftData;
    const entries = D.entries || [];
    const first = entries[0];
    const latest = D.latest || entries[entries.length - 1];

    const defaults = {
      startWeight: first?.weight ?? latest?.weight ?? 0,
      targetWeight: latest?.weight ? +(latest.weight - 10).toFixed(1) : 0,
      goalName: "Reach my next milestone",
      deadline: "",
    };

    const [goal, setGoal] = useState(() => readGoal(defaults));
    const [draft, setDraft] = useState(() => readGoal(defaults));
    const [saved, setSaved] = useState(false);

    const stats = useMemo(() => {
      const current = latest?.avg7 ?? latest?.weight ?? 0;
      const start = Number(goal.startWeight) || current;
      const target = Number(goal.targetWeight) || current;
      const totalNeeded = Math.abs(start - target);
      const moved = Math.abs(start - current);
      const remaining = Math.abs(current - target);
      const direction = target < start ? "loss" : "gain";
      const rawProgress = totalNeeded === 0 ? 100 : moved / totalNeeded * 100;
      const progress = clamp(rawProgress, 0, 100);
      const isReached = progress >= 100 || (direction === "loss" ? current <= target : current >= target);
      const totalChange = current - start;
      const avgRate = D.stats?.avgRate ?? 0;
      const weeklyRateTowardGoal = direction === "loss" ? -avgRate : avgRate;
      const weeksLeft = weeklyRateTowardGoal > 0.05 ? remaining / weeklyRateTowardGoal : null;
      const projectedDate = weeksLeft != null ? new Date(D.today.getTime() + weeksLeft * 7 * 24 * 60 * 60 * 1000) : null;

      return { current, start, target, totalNeeded, moved, remaining, direction, progress, isReached, totalChange, avgRate, weeksLeft, projectedDate };
    }, [goal, latest, D.stats, D.today]);

    const milestones = useMemo(() => {
      const steps = [25, 50, 75, 100];
      return steps.map((pct) => {
        const targetAtPct = stats.direction === "loss"
          ? stats.start - stats.totalNeeded * (pct / 100)
          : stats.start + stats.totalNeeded * (pct / 100);
        return {
          pct,
          weight: targetAtPct,
          done: stats.progress >= pct,
        };
      });
    }, [stats]);

    const saveGoal = () => {
      const next = {
        goalName: draft.goalName || "Reach my next milestone",
        startWeight: Number(draft.startWeight),
        targetWeight: Number(draft.targetWeight),
        deadline: draft.deadline || "",
      };
      setGoal(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaved(true);
      setTimeout(() => setSaved(false), 1000);
    };

    const resetStart = () => {
      const next = { ...draft, startWeight: +(latest?.avg7 ?? latest?.weight ?? draft.startWeight).toFixed(1) };
      setDraft(next);
    };

    return (
      <div className="page-enter container goals-shell">
        <section className="goals-hero">
          <div>
            <span className="t-eyebrow">Goals</span>
            <h1 className="goals-title">Progress you can <span className="ital">feel</span>.</h1>
            <p className="goals-copy">Set a target weight and Drift will turn your weigh-ins into a simple progress map. No panic. No guessing. Just a clear line toward where you want to go.</p>
          </div>

          <div className="goals-summary-card">
            <span className="t-label">Current progress</span>
            <div className="goals-summary-number">{Math.round(stats.progress)}<span className="serif-i">%</span></div>
            <div className="goals-progress-track"><div className="goals-progress-fill" style={{ width: `${stats.progress}%` }} /></div>
            <div className="stat-meta" style={{ marginTop: 14 }}>
              <span>{formatLb(stats.remaining)} lb left</span>
              <span>{stats.isReached ? "Goal reached" : "In progress"}</span>
            </div>
          </div>
        </section>

        <section className="goals-grid">
          <div className="goals-panel">
            <span className="t-eyebrow">Main target</span>
            <h2 className="goals-panel-title" style={{ marginTop: 10 }}>{goal.goalName}</h2>

            <div className="goals-meter-wrap">
              <div className="goals-ring" style={{ "--goal-progress": stats.progress }}>
                <div className="goals-ring-inner">
                  <div className="goals-ring-percent">{Math.round(stats.progress)}%</div>
                  <div className="goals-ring-label">complete</div>
                </div>
              </div>

              <div className="goals-stats">
                <div className="goals-stat">
                  <span className="t-label">Start</span>
                  <div className="goals-stat-value">{formatLb(stats.start)} <span className="serif-i" style={{ fontSize: 15, color: "var(--ink-3)" }}>lb</span></div>
                </div>
                <div className="goals-stat">
                  <span className="t-label">Now</span>
                  <div className="goals-stat-value">{formatLb(stats.current)} <span className="serif-i" style={{ fontSize: 15, color: "var(--ink-3)" }}>lb</span></div>
                </div>
                <div className="goals-stat">
                  <span className="t-label">Target</span>
                  <div className="goals-stat-value">{formatLb(stats.target)} <span className="serif-i" style={{ fontSize: 15, color: "var(--ink-3)" }}>lb</span></div>
                </div>
              </div>
            </div>

            <div className="goals-timeline">
              {milestones.map((m) => (
                <div className={`goals-milestone ${m.done ? "done" : ""}`} key={m.pct}>
                  <div className="goals-milestone-dot">{m.done ? "✓" : m.pct}</div>
                  <div>
                    <div className="goals-milestone-title">{m.pct}% milestone</div>
                    <div className="goals-milestone-sub">Around {formatLb(m.weight)} lb</div>
                  </div>
                  <div className="t-label">{m.done ? "Done" : "Ahead"}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="goals-panel">
            <span className="t-eyebrow">Edit goal</span>
            <h2 className="goals-panel-title" style={{ marginTop: 10 }}>Set your target.</h2>

            <div className="goals-form">
              <div className="goals-field">
                <label className="t-label">Goal name</label>
                <input className="input" value={draft.goalName} onChange={(e) => setDraft({ ...draft, goalName: e.target.value })} />
              </div>

              <div className="goals-field">
                <label className="t-label">Starting weight</label>
                <input className="input" type="number" step="0.1" value={draft.startWeight} onChange={(e) => setDraft({ ...draft, startWeight: e.target.value })} />
              </div>

              <div className="goals-field">
                <label className="t-label">Target weight</label>
                <input className="input" type="number" step="0.1" value={draft.targetWeight} onChange={(e) => setDraft({ ...draft, targetWeight: e.target.value })} />
              </div>

              <div className="goals-field">
                <label className="t-label">Deadline <span style={{ color: "var(--ink-4)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· optional</span></label>
                <input className="input" type="date" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
              </div>

              <div className="goals-actions">
                <button className="btn btn-primary" onClick={saveGoal}>{saved ? "Saved" : "Save goal"}</button>
                <button className="btn btn-secondary" onClick={resetStart}>Use current</button>
              </div>
            </div>

            <div className="goals-note">
              {stats.projectedDate && !stats.isReached
                ? <>At your recent pace, this goal could land around <strong>{window.fmtDateLong(stats.projectedDate)}</strong>. Treat that as a rough estimate, not a deadline.</>
                : stats.isReached
                  ? <>You reached this goal. That is the signal to set a new milestone, not to chase the scale harder.</>
                  : <>Once Drift has a stronger weekly pace, it will estimate when this goal may land.</>}
            </div>
          </aside>
        </section>
      </div>
    );
  };

  window.Drift = window.Drift || {};
  window.Drift.GoalsScreen = GoalsScreen;
})();
