// Drift reminder schedule diagnostics patch.
(function () {
  function saveStatus(next) {
    try {
      const key = "drift-reminder-settings-v1";
      const current = JSON.parse(localStorage.getItem(key) || "{}");
      const merged = { ...current, ...next };
      localStorage.setItem(key, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent("drift:reminder-updated", { detail: merged }));
    } catch (_) {}
  }

  async function waitForReminderApi() {
    for (let i = 0; i < 50; i++) {
      if (window.DriftReminder && typeof window.DriftReminder.syncBackendReminder === "function") return window.DriftReminder;
      await new Promise(r => setTimeout(r, 100));
    }
    return null;
  }

  waitForReminderApi().then(api => {
    if (!api || api.__scheduleDiagnosticsPatched) return;
    api.__scheduleDiagnosticsPatched = true;

    const originalSync = api.syncBackendReminder.bind(api);
    api.syncBackendReminder = async function patchedSync(settings) {
      const result = await originalSync(settings);

      try {
        const current = api.load ? api.load() : {};
        const deviceId = localStorage.getItem("drift-device-id-v1");
        if (!result.ok || !deviceId) return result;

        const res = await fetch("/api/reminders/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.ok) {
          const error = data.error || `Schedule status check failed (${res.status}).`;
          saveStatus({ backendSynced: false, lastSyncError: error, lastScheduleMessage: "" });
          return { ok: false, error };
        }

        if (data.scheduleError) {
          saveStatus({ backendSynced: false, lastSyncError: data.scheduleError, lastScheduleMessage: "" });
          return { ok: false, error: data.scheduleError };
        }

        const msg = data.nextDelaySeconds
          ? `Next automatic reminder scheduled in about ${Math.round(data.nextDelaySeconds / 60)} min.`
          : "Automatic reminder scheduled.";
        saveStatus({ ...current, backendSynced: true, lastSyncError: "", lastScheduleMessage: msg });
        return { ok: true, message: msg };
      } catch (err) {
        const error = err && err.message ? err.message : "Schedule status check failed.";
        saveStatus({ backendSynced: false, lastSyncError: error, lastScheduleMessage: "" });
        return { ok: false, error };
      }
    };
  });
})();
