// Drift reminder notifications.
// Supports local test notifications and real backend Web Push reminders.
(function () {
  const KEY = "drift-reminder-settings-v1";
  const DEVICE_KEY = "drift-device-id-v1";
  let reminderTimer = null;

  const defaults = {
    enabled: false,
    time: "08:00",
    lastFiredDate: "",
    backendSynced: false,
    lastSyncError: "",
  };

  function load() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch (_) {
      return { ...defaults };
    }
  }

  function getDeviceId() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : `drift-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
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
      const reg = await navigator.serviceWorker.register("drift-notification-sw.js");
      await navigator.serviceWorker.ready;
      return reg;
    } catch (err) {
      console.warn("Drift notification service worker failed", err);
      return null;
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  async function getPushPublicKey() {
    const res = await fetch("/api/reminders/vapid-public-key", { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not load push public key (${res.status})`);
    const data = await res.json();
    if (!data.publicKey) throw new Error("Missing VAPID_PUBLIC_KEY on Vercel.");
    return data.publicKey;
  }

  async function getOrCreateSubscription(reg, publicKey) {
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;

    return reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  async function syncBackendReminder(settings = load()) {
    try {
      if (!("PushManager" in window) || !("serviceWorker" in navigator)) {
        save({ backendSynced: false, lastSyncError: "Push is not supported on this device." });
        return { ok: false, error: "Push is not supported on this device." };
      }

      if (permission() !== "granted") {
        save({ backendSynced: false, lastSyncError: "Notification permission is not granted." });
        return { ok: false, error: "Notification permission is not granted." };
      }

      const reg = await registerServiceWorker();
      if (!reg) {
        save({ backendSynced: false, lastSyncError: "Service worker could not register." });
        return { ok: false, error: "Service worker could not register." };
      }

      const publicKey = await getPushPublicKey();
      const subscription = await getOrCreateSubscription(reg, publicKey);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Toronto";

      const res = await fetch("/api/reminders/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: getDeviceId(),
          subscription: subscription.toJSON ? subscription.toJSON() : subscription,
          time: settings.time || "08:00",
          timezone,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        const error = data.error || `Could not save reminder on server (${res.status}).`;
        save({ backendSynced: false, lastSyncError: error });
        return { ok: false, error };
      }

      save({ backendSynced: true, lastSyncError: "" });
      return { ok: true };
    } catch (err) {
      const error = err && err.message ? err.message : "Unknown sync error.";
      console.warn("Drift backend reminder sync failed:", err);
      save({ backendSynced: false, lastSyncError: error });
      return { ok: false, error };
    }
  }

  async function disableBackendReminder() {
    try {
      await fetch("/api/reminders/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: getDeviceId() }),
      });
    } catch (_) {}
    save({ backendSynced: false, lastSyncError: "" });
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
      body: "",
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
    return showNotification("Drift", {
      body: "Log your weight",
      tag: "drift-test-notification",
    });
  }

  async function testBackendNow() {
    const sync = await syncBackendReminder(load());
    if (!sync.ok) return sync;

    const res = await fetch("/api/reminders/test-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: getDeviceId() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) return { ok: false, error: data.error || `Backend test failed (${res.status}).` };
    return { ok: true };
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
        await showNotification("Drift", { body: "Log your weight" });
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
    testBackendNow,
    schedule,
    syncBackendReminder,
    disableBackendReminder,
  };

  window.addEventListener("load", schedule);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) schedule();
  });
})();
