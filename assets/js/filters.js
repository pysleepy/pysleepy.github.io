(function () {
  const PAGE_SIZE = 20;

  // Tag panel scaling
  const MAX_TAGS_COLLAPSED = 20; // show top N tags, then "More tags…"
  const SHOW_TAG_COUNTS = true;  // label tags like "foo (12)"

  const selected = new Set();   // multi-select tags (OR)
  const shownCount = new Map(); // sec -> number of visible items (after filter)

  function parseTags(li) {
    return (li.getAttribute("data-tags") || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }

  // Returns { counts: Map<tag, count>, ordered: Array<tag> } ordered by count desc then alpha
  function collectTagCounts() {
    const counts = new Map();

    document.querySelectorAll(".doc-item").forEach(li => {
      parseTags(li).forEach(t => {
        counts.set(t, (counts.get(t) || 0) + 1);
      });
    });

    const ordered = Array.from(counts.entries())
      .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);

    return { counts, ordered };
  }

  function matchesSelected(li) {
    if (selected.size === 0) return true; // no filter => show all
    const tags = parseTags(li);
    for (const t of tags) if (selected.has(t)) return true; // OR
    return false;
  }

  function getSec(sectionEl) {
    return sectionEl.getAttribute("data-sec") || "__unknown__";
  }

  function ensureSectionState() {
    document.querySelectorAll(".sec").forEach(secEl => {
      const sec = getSec(secEl);
      if (!shownCount.has(sec)) shownCount.set(sec, PAGE_SIZE);
    });
  }

  function applyAll() {
    ensureSectionState();

    document.querySelectorAll(".sec").forEach(secEl => {
      const sec = getSec(secEl);
      const limit = shownCount.get(sec) || PAGE_SIZE;

      const listEl = secEl.querySelector(".doc-list");
      const btn = secEl.querySelector(".more-btn");
      if (!listEl) return;

      const allItems = Array.from(listEl.querySelectorAll(".doc-item"));
      const filtered = allItems.filter(matchesSelected);

      // Hide entire section if empty after filtering
      if (filtered.length === 0) {
        secEl.style.display = "none";
        return;
      }
      secEl.style.display = "";

      // Show first `limit` of filtered
      let shown = 0;
      allItems.forEach(li => {
        if (!matchesSelected(li)) {
          li.style.display = "none";
          return;
        }
        shown += 1;
        li.style.display = (shown <= limit) ? "" : "none";
      });

      // Button state (CSS hides disabled buttons)
      if (btn) {
        if (filtered.length <= limit) {
          btn.disabled = true;
          btn.textContent = "Show more";
        } else {
          btn.disabled = false;
          btn.textContent = `Show more (${Math.min(PAGE_SIZE, filtered.length - limit)} of ${filtered.length - limit})`;
        }
      }
    });
  }

  function renderTagButtons() {
    const container = document.getElementById("tagButtons");
    if (!container) return;

    const search = document.getElementById("tagSearch");

    const { counts, ordered } = collectTagCounts();
    container.innerHTML = "";

    function makeBtn(tag, label) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tag-btn";
      btn.dataset.tag = tag;
      btn.dataset.raw = tag.toLowerCase(); // for search filtering
      btn.textContent = label;
      return btn;
    }

    // All button
    container.appendChild(makeBtn("__all__", "All"));

    // Tag buttons (by frequency)
    ordered.forEach(tag => {
      const count = counts.get(tag) || 0;
      const label = SHOW_TAG_COUNTS ? `${tag} (${count})` : tag;
      container.appendChild(makeBtn(tag, label));
    });

    // Collapse long lists: show top N (after All), then "More tags…"
    function applyCollapse() {
      const btns = Array.from(container.querySelectorAll(".tag-btn"));
      const tagBtns = btns.filter(b => b.dataset.tag !== "__all__" && b.dataset.tag !== "__more__");

      // Remove existing "more" button if any
      const existingMore = container.querySelector('.tag-btn[data-tag="__more__"]');
      if (existingMore) existingMore.remove();

      // If search is active, don't collapse; show all matching
      const q = (search && search.value || "").trim().toLowerCase();
      if (q) return;

      if (tagBtns.length <= MAX_TAGS_COLLAPSED) return;

      tagBtns.forEach((b, i) => {
        b.style.display = (i < MAX_TAGS_COLLAPSED) ? "" : "none";
      });

      const more = makeBtn("__more__", "More tags…");
      more.classList.add("tag-more");
      more.addEventListener("click", () => {
        tagBtns.forEach(b => (b.style.display = ""));
        more.remove();
      });

      container.appendChild(more);
    }

    function syncActive() {
      container.querySelectorAll(".tag-btn").forEach(b => {
        const t = b.dataset.tag;
        if (t === "__more__") return;
        const active = (t === "__all__") ? (selected.size === 0) : selected.has(t);
        b.classList.toggle("is-active", active);
      });
    }

    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".tag-btn");
      if (!btn) return;

      const tag = btn.dataset.tag;
      if (tag === "__more__") return;

      if (tag === "__all__") selected.clear();
      else selected.has(tag) ? selected.delete(tag) : selected.add(tag);

      // Reset paging on filter change
      shownCount.clear();
      ensureSectionState();

      syncActive();
      applyAll();
    });

    // Tag search
    if (search) {
      function applySearchFilter() {
        const q = search.value.trim().toLowerCase();

        container.querySelectorAll(".tag-btn").forEach(b => {
          const tag = b.dataset.tag;

          // keep "All" always visible
          if (tag === "__all__") {
            b.style.display = "";
            return;
          }

          // hide the More button while searching
          if (tag === "__more__") {
            b.style.display = q ? "none" : "";
            return;
          }

          const raw = b.dataset.raw || "";
          b.style.display = raw.includes(q) ? "" : "none";
        });

        // when search is cleared, re-apply collapse
        applyCollapse();
      }

      search.addEventListener("input", applySearchFilter);

      search.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          search.value = "";
          applySearchFilter();
          return;
        }

        if (e.key !== "Enter") return;

        e.preventDefault();

        // pick first visible tag button (excluding All / More)
        const btns = Array.from(container.querySelectorAll(".tag-btn"));
        const first = btns.find(b => {
          const tag = b.dataset.tag;
          if (tag === "__all__" || tag === "__more__") return false;
          return b.style.display !== "none";
        });

        if (!first) return;

        const tag = first.dataset.tag;

        // toggle selection (same OR logic)
        if (selected.has(tag)) selected.delete(tag);
        else selected.add(tag);

        // Reset paging on filter change
        shownCount.clear();
        ensureSectionState();

        // clear search after selection (nice UX)
        search.value = "";
        applySearchFilter();

        syncActive();
        applyAll();
      });
    }

    // initial state
    syncActive();
    applyCollapse();
  }

  function wireShowMoreButtons() {
    document.querySelectorAll(".sec").forEach(secEl => {
      const sec = getSec(secEl);
      const btn = secEl.querySelector(".more-btn");
      if (!btn) return;

      btn.addEventListener("click", () => {
        const current = shownCount.get(sec) || PAGE_SIZE;
        shownCount.set(sec, current + PAGE_SIZE);
        applyAll();
      });
    });
  }

  function init() {
    ensureSectionState();
    renderTagButtons();
    wireShowMoreButtons();
    applyAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();