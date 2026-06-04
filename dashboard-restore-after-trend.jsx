// Restore dashboard after the trend page override so only Trends changes.
(function () {
  window.Drift = window.Drift || {};
  if (window.Drift.OriginalDashboard) {
    window.Drift.Dashboard = window.Drift.OriginalDashboard;
  }
})();
