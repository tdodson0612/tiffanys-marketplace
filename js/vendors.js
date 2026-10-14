/* =========================================================
   Vendor directory: category filter buttons + search box.
   Link straight to a category with vendors.html?category=Candles
   ========================================================= */
(function () {
  "use strict";
  var TM = window.TM, cfg = window.SITE_CONFIG || {};
  var categories = cfg.categories || [];
  var lower = categories.map(function (c) { return c.toLowerCase(); });

  var filtersEl = document.getElementById("filters");
  var searchEl = document.getElementById("vendor-search");
  var grid = document.getElementById("vendor-grid");
  var countEl = document.getElementById("results-count");
  var emptyEl = document.getElementById("vendors-empty");

  var params = new URLSearchParams(location.search);
  var current = "All";
  var wanted = (params.get("category") || "").toLowerCase();
  if (lower.indexOf(wanted) > -1) current = categories[lower.indexOf(wanted)];

  // Vendors whose category isn't in the list count as "Other"
  function bucket(v) {
    var i = lower.indexOf(String(v.category || "").toLowerCase());
    return i > -1 ? categories[i] : "Other";
  }

  function buildFilters() {
    filtersEl.innerHTML = ["All"].concat(categories).map(function (c) {
      return '<button type="button" class="btn btn-small filter-btn" aria-pressed="' + (c === current) + '" data-cat="' +
        TM.escapeHTML(c) + '">' + TM.escapeHTML(c) + "</button>";
    }).join("");
    filtersEl.addEventListener("click", function (ev) {
      var btn = ev.target.closest("button[data-cat]");
      if (!btn) return;
      current = btn.getAttribute("data-cat");
      filtersEl.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      render();
    });
  }

  var vendors = [];
  function render() {
    var q = searchEl.value.trim().toLowerCase();
    var shown = vendors.filter(function (v) {
      if (current !== "All" && bucket(v) !== current) return false;
      if (!q) return true;
      return [v.name, v.category, v.description].join(" ").toLowerCase().indexOf(q) > -1;
    });
    grid.innerHTML = shown.map(TM.vendorCard).join("");
    var word = shown.length === 1 ? "maker" : "makers";
    countEl.textContent = shown.length
      ? "Showing " + shown.length + " " + word + (current !== "All" ? " in " + current : "") + (q ? ' matching "' + searchEl.value.trim() + '"' : "") + "."
      : "No makers match that. Try another category or a different word.";
  }

  buildFilters();
  searchEl.addEventListener("input", render);

  TM.load("vendors").then(function (rows) {
    vendors = TM.cleanVendors(rows).sort(function (a, b) { return a.name.localeCompare(b.name); });
    if (!vendors.length) {
      countEl.textContent = "";
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    render();
  });
})();
