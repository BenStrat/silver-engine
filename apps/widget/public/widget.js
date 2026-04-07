(function () {
  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
      return;
    }

    fn();
  };

  const ensureDialog = () => {
    let dialog = document.getElementById("silver-widget-dialog");

    if (dialog) {
      return dialog;
    }

    dialog = document.createElement("dialog");
    dialog.id = "silver-widget-dialog";
    dialog.style.cssText = [
      "padding:0",
      "border:1px solid rgba(16,33,47,0.16)",
      "border-radius:24px",
      "box-shadow:0 24px 80px rgba(16,33,47,0.22)",
      "width:min(28rem, calc(100vw - 2rem))",
      "font-family:Inter,Segoe UI,system-ui,sans-serif",
      "color:#10212f",
      "overflow:hidden",
    ].join(";");

    dialog.innerHTML = `
      <form method="dialog" style="margin:0;padding:0;">
        <div style="padding:1.25rem 1.25rem 1rem;background:linear-gradient(135deg,#f8fafc,#e0f2f1);">
          <p style="margin:0 0 .5rem;font-size:.8rem;letter-spacing:.12em;text-transform:uppercase;color:#0f766e;">Silver Widget</p>
          <h2 style="margin:0 0 .5rem;font-size:1.35rem;line-height:1.1;">Placeholder capture shell</h2>
          <p style="margin:0;color:#51606f;line-height:1.5;">
            This will eventually host the report flow, but for now it proves the widget can load, open, and close cleanly.
          </p>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:.75rem;padding:1rem 1.25rem 1.25rem;background:white;">
          <button value="close" style="appearance:none;border:1px solid rgba(16,33,47,0.12);background:white;color:#10212f;border-radius:999px;padding:.75rem 1rem;font:inherit;cursor:pointer;">
            Close
          </button>
        </div>
      </form>
    `;

    document.body.appendChild(dialog);
    return dialog;
  };

  const openWidget = () => {
    const dialog = ensureDialog();

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
      return;
    }

    dialog.setAttribute("open", "");
  };

  ready(() => {
    document.querySelectorAll("[data-silver-widget-open]").forEach((trigger) => {
      trigger.addEventListener("click", openWidget);
    });
  });
})();
