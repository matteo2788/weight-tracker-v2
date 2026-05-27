// Disable browser/page zoom gestures so the mobile app layout stays locked.
(function () {
  var lastTouchEnd = 0;

  // iOS Safari pinch zoom events
  document.addEventListener("gesturestart", function (event) {
    event.preventDefault();
  }, { passive: false });

  document.addEventListener("gesturechange", function (event) {
    event.preventDefault();
  }, { passive: false });

  document.addEventListener("gestureend", function (event) {
    event.preventDefault();
  }, { passive: false });

  // Prevent double-tap zoom on mobile Safari/Chrome.
  document.addEventListener("touchend", function (event) {
    var now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  // Prevent trackpad / keyboard zoom on desktop browsers.
  document.addEventListener("wheel", function (event) {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
    }
  }, { passive: false });

  document.addEventListener("keydown", function (event) {
    var key = event.key;
    var zoomKey = key === "+" || key === "=" || key === "-" || key === "_" || key === "0";
    if ((event.ctrlKey || event.metaKey) && zoomKey) {
      event.preventDefault();
    }
  });
})();
