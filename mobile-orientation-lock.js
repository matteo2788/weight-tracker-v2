// JS orientation guard for mobile browsers that ignore CSS orientation rules.
(function () {
  function isTouchDevice() {
    return ("ontouchstart" in window) || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  }

  function isLandscape() {
    var screenOrientation = window.screen && window.screen.orientation && window.screen.orientation.type;
    var orientationTypeSaysLandscape = typeof screenOrientation === "string" && screenOrientation.indexOf("landscape") !== -1;
    var windowSaysLandscape = window.innerWidth > window.innerHeight;
    return orientationTypeSaysLandscape || windowSaysLandscape;
  }

  function updateOrientationLock() {
    var shouldLock = isTouchDevice() && isLandscape();
    document.body.classList.toggle("orientation-locked", shouldLock);
  }

  window.addEventListener("orientationchange", function () {
    setTimeout(updateOrientationLock, 80);
    setTimeout(updateOrientationLock, 350);
  });
  window.addEventListener("resize", updateOrientationLock);
  window.addEventListener("load", updateOrientationLock);
  document.addEventListener("DOMContentLoaded", updateOrientationLock);
  updateOrientationLock();
})();
