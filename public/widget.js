(function () {
  var script = document.currentScript || document.querySelector("script[src*='widget.js']");
  if (!script || window.__hpIntake) return;
  window.__hpIntake = true;
  var origin = new URL(script.src, window.location.href).origin;
  var position = script.getAttribute("data-position") === "left" ? "left" : "right";
  var theme = script.getAttribute("data-theme") || "system";
  var frame = document.createElement("iframe");
  frame.id = "hp-intake-frame";
  frame.title = "Harlow and Pierce intake chat";
  frame.setAttribute("aria-label", "Harlow and Pierce intake chat");
  frame.src = origin + "/embed?position=" + position + "&theme=" + encodeURIComponent(theme);
  frame.style.position = "fixed";
  frame.style.zIndex = "2147483000";
  frame.style.border = "0";
  frame.style.background = "transparent";
  frame.style.colorScheme = "normal";
  frame.style.width = "280px";
  frame.style.height = "220px";
  frame.style.bottom = "16px";
  function place(open, mobile) {
    var pad = mobile ? "16px" : "24px";
    if (open && mobile) {
      frame.style.top = "0";
      frame.style.left = "0";
      frame.style.right = "0";
      frame.style.bottom = "0";
      frame.style.width = "100%";
      frame.style.height = "100%";
      return;
    }
    frame.style.top = "auto";
    frame.style.bottom = pad;
    frame.style.left = position === "left" ? pad : "auto";
    frame.style.right = position === "right" ? pad : "auto";
    if (open) {
      frame.style.width = window.innerWidth < 1024 ? "380px" : "400px";
      frame.style.height = "min(756px, calc(100dvh - 48px))";
    } else {
      frame.style.width = "300px";
      frame.style.height = "240px";
    }
  }
  place(false, window.innerWidth < 640);
  window.addEventListener("message", function (event) {
    if (event.origin !== origin || !event.data || event.data.type !== "hp-resize") return;
    place(Boolean(event.data.open), Boolean(event.data.mobile));
  });
  function syncHost() {
    if (!frame.contentWindow) return;
    frame.contentWindow.postMessage({ type: "hp-host", width: window.innerWidth, height: window.innerHeight }, origin);
    if (theme === "dark" || theme === "light") frame.contentWindow.postMessage({ type: "hp-theme", theme: theme }, origin);
  }
  frame.addEventListener("load", syncHost);
  var tries = 0;
  var timer = setInterval(function () {
    syncHost();
    if (++tries > 20) clearInterval(timer);
  }, 150);
  window.addEventListener("resize", function () {
    if (frame.contentWindow) frame.contentWindow.postMessage({ type: "hp-host", width: window.innerWidth, height: window.innerHeight }, origin);
  });
  document.body.appendChild(frame);
})();
