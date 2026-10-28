/* =========================================================
   Scroll reveal: as each section comes into view, its pieces fade
   and slide in (from the left, right or bottom), one after another.

   - Uses IntersectionObserver, so nothing runs while you scroll.
   - Only animates opacity and transform (smooth on phones).
   - Visitors with "reduce motion" turned on see everything right
     away with no animation. So do browsers without JavaScript.
   - Content added later (events, vendors) calls TM.reveal() again.

   To animate something new, add a line to GROUPS below:
   [ "CSS selector", "up" | "left" | "right", stagger in seconds ]
   ========================================================= */
(function () {
  "use strict";
  var TM = (window.TM = window.TM || {});

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    TM.reveal = function () {};
    return;
  }

  // Turns on the hidden "before" state in styles.css. Without this class,
  // nothing is ever hidden.
  document.documentElement.classList.add("motion");

  var GROUPS = [
    // Section headings and intros
    [".section h2, .page-hero h1", "up", 0],
    [".section-intro, .page-hero .lead", "up", 0],
    [".section-cta", "up", 0],
    // What you'll find
    ["#find .tiles > li", "up", 0.08],
    ["#find .gallery", "up", 0],
    // Events and makers (filled in by script, so revealed again later)
    ["#events-list > li", "up", 0.08],
    ["#events-empty, #featured-empty", "up", 0],
    ["#featured-vendors > li", "up", 0.07],
    ["#vendor-grid > li", "up", 0.06],
    ["#vendors-empty, .directory-controls", "up", 0],
    // Reviews carousel
    ["#reviews .carousel-wrap", "up", 0],
    // Sell here
    ["#become-a-vendor .form-grid", "up", 0],
    // About: story from the left, quote from the right
    ["#about .about > div", "left", 0],
    ["#about .quote", "right", 0.15],
    // Visit: details from the left, map from the right
    ["#visit .visit-grid > div", "left", 0],
    ["#visit .map-frame", "right", 0.15],
    // FAQ
    [".faq details", "up", 0.06],
    // Footer columns
    [".footer-grid > div", "up", 0.08]
  ];

  var MAX_STAGGER_ITEMS = 6; // long lists don't make people wait
  var DURATION_MS = 700;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      io.unobserve(el);
      el.classList.add("is-in");
      // Once it has arrived, hand the element back to its normal styles
      // (so hover effects aren't delayed by the reveal's stagger).
      var delay = parseFloat(el.style.getPropertyValue("--rd")) || 0;
      setTimeout(function () {
        el.removeAttribute("data-reveal");
        el.classList.remove("is-in");
        el.style.removeProperty("--rd");
      }, delay * 1000 + DURATION_MS + 100);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });

  TM.reveal = function () {
    GROUPS.forEach(function (g) {
      var els = document.querySelectorAll(g[0]);
      var counters = new Map(); // stagger counts per parent
      Array.prototype.forEach.call(els, function (el) {
        if (el.hidden || el.hasAttribute("data-reveal") || el.hasAttribute("data-revealed")) return;
        var n = counters.get(el.parentNode) || 0;
        counters.set(el.parentNode, n + 1);
        el.setAttribute("data-reveal", g[1]);
        el.setAttribute("data-revealed", "");
        if (g[2]) el.style.setProperty("--rd", (Math.min(n, MAX_STAGGER_ITEMS) * g[2]).toFixed(2) + "s");
        io.observe(el);
      });
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", TM.reveal);
  else TM.reveal();
})();
