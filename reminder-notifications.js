// Drift reminder notifications.
// This enables permission requests, test notifications, and reliable in-session reminders.
(function () {
  const KEY = "drift-reminder-settings-v1";
  let reminderTimer = null;

  const defaults = {
    enabled: false,
    time: "08:00",
    lastFiredDate: "",
  };

  function load() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch (_) {
      return { ...defaults };
    }
  }

  function save(next) {
    const merged = { ...load(), ...next };
    localStorage.setItem(KEY, JSON.stringify(merged));
    schedule();
    window.dispatchEvent(new CustomEvent("drift:reminder-updated", { detail: merged }));
    return merged;
  }

  function isSupported() {
    return "Notification" in window;
  }

  function permission() {
    if (!isSupported()) return "unsupported";
    return Notification.permission;
  }

  function isStandalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return null;
    try {
      return await navigator.serviceWorker.register("drift-notification-sw.js");
    } catch (err) {
      console.warn("Drift notification service worker failed", err);
      return null;
    }
  }

  async function requestPermission() {
    if (!isSupported()) return "unsupported";
    const result = await Notification.requestPermission();
    if (result === "granted") await registerServiceWorker();
    schedule();
    window.dispatchEvent(new CustomEvent("drift:reminder-updated", { detail: load() }));
    return result;
  }

  async function showNotification(title, options) {
    if (!isSupported() || Notification.permission !== "granted") return false;
    const reg = await registerServiceWorker();
    const payload = {
      body: "A calm 20-second weigh-in keeps the trend honest.",
      tag: "drift-daily-weigh-in",
      renotify: true,
      badge: "/",
      icon: "/",
      data: { url: "/" },
      ...options,
    };
    if (reg && typeof reg.showNotification === "function") {
      await reg.showNotification(title, payload);
    } else {
      new Notification(title, payload);
    }
    return true;
  }

  async function test() {
    const currentPermission = permission();
    if (currentPermission !== "granted") {
      const result = await requestPermission();
      if (result !== "granted") return false;
    }
    return showNotification("Time to log your weigh-in", {
      body: "This is your Drift reminder test. If you see this, notifications are allowed.",
      tag: "drift-test-notification",
    });
  }

  function msUntilNext(time) {
    const [h, m] = String(time || "08:00").split(":").map(Number);
    const now = new Date();
    const next = new Date();
    next.setHours(Number.isFinite(h) ? h : 8, Number.isFinite(m) ? m : 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.getTime() - now.getTime();
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function schedule() {
    if (reminderTimer) clearTimeout(reminderTimer);
    reminderTimer = null;

    const settings = load();
    if (!settings.enabled || permission() !== "granted") return;

    reminderTimer = setTimeout(async () => {
      const fresh = load();
      const today = todayKey();
      if (fresh.enabled && fresh.lastFiredDate !== today && permission() === "granted") {
        await showNotification("Time to log your weigh-in");
        save({ lastFiredDate: today });
      } else {
        schedule();
      }
    }, msUntilNext(settings.time));
  }

  window.DriftReminder = {
    load,
    save,
    permission,
    isSupported,
    isStandalone,
    requestPermission,
    test,
    schedule,
  };

  window.addEventListener("load", schedule);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) schedule();
  });
})();
