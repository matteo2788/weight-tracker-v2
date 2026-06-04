// Keep the original dashboard before any trend-page overrides run.
(function () {
  window.Drift = window.Drift || {};
  if (window.Drift.Dashboard && !window.Drift.OriginalDashboard) {
    window.Drift.OriginalDashboard = window.Drift.Dashboard;
  }
})();
