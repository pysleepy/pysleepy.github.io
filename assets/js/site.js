(function () {
  const nav = document.getElementById("floatNav");
  const topBtn = document.getElementById("backToTop");
  const backBtn = document.getElementById("backBtn");

  if (!nav || !topBtn) return;

  const SHOW_AFTER = 250;

  function isShortPage() {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    return scrollable < SHOW_AFTER;
  }

  function updateVisibility() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    nav.classList.toggle("is-visible", isShortPage() || y > SHOW_AFTER);
  }

  function isVisibleEl(el) {
    if (!el) return false;
    // offsetParent is null if display:none (except fixed), good enough here
    return el.offsetParent !== null;
  }

  function alignToWrapper() {
    const wrapper = document.querySelector(".wrapper");
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const gap = -110; // spacing from wrapper edge

    const right = Math.max(12, Math.round(window.innerWidth - rect.right + gap));
    document.documentElement.style.setProperty("--float-nav-right", right + "px");
  }

  window.addEventListener("scroll", updateVisibility, { passive: true });

  window.addEventListener("resize", () => {
    alignToWrapper();
    updateVisibility();
  });

  window.addEventListener("load", () => {
    alignToWrapper();
    updateVisibility();
  });

  alignToWrapper;
  updateVisibility();

  topBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  if (backBtn) {
    // Hide if no referrer (optional but nice)
    if (!document.referrer) {
      backBtn.style.display = "none";
    } else {
      backBtn.addEventListener("click", () => history.back());
    }
  }
})();