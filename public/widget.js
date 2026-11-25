(function () {
  var script = document.currentScript || document.querySelector("script[src*='widget.js']");
  if (!script) return;
  var origin = new URL(script.src, window.location.href).origin;
  var root = document.createElement("div");
  root.style.position = "fixed";
  root.style.right = "16px";
  root.style.bottom = "16px";
  root.style.zIndex = "2147483000";
  root.style.fontFamily = "Georgia, serif";

  var frame = document.createElement("iframe");
  frame.src = origin + "/embed";
  frame.title = "Harlow and Pierce intake chat";
  frame.setAttribute("aria-label", "Harlow and Pierce intake chat");
  frame.style.display = "none";
  frame.style.width = "min(380px, calc(100vw - 32px))";
  frame.style.height = "min(640px, calc(100vh - 96px))";
  frame.style.border = "1px solid #d9d0c2";
  frame.style.background = "#f7f1e6";
  frame.style.marginBottom = "12px";
  frame.style.boxShadow = "0 12px 40px rgba(28,25,21,0.18)";

  var button = document.createElement("button");
  button.type = "button";
  button.textContent = "Intake";
  button.setAttribute("aria-label", "Open Harlow and Pierce intake chat");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "hp-intake-frame");
  frame.id = "hp-intake-frame";
  button.style.width = "64px";
  button.style.height = "64px";
  button.style.borderRadius = "999px";
  button.style.border = "0";
  button.style.background = "#1c1915";
  button.style.color = "#f7f1e6";
  button.style.cursor = "pointer";
  button.style.float = "right";

  function setOpen(open) {
    frame.style.display = open ? "block" : "none";
    button.setAttribute("aria-expanded", open ? "true" : "false");
    button.setAttribute("aria-label", open ? "Close Harlow and Pierce intake chat" : "Open Harlow and Pierce intake chat");
    button.textContent = open ? "Close" : "Intake";
  }

  button.addEventListener("click", function () {
    setOpen(frame.style.display === "none");
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setOpen(false);
  });

  root.appendChild(frame);
  root.appendChild(button);
  document.body.appendChild(root);
})();
