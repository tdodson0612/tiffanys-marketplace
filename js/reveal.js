/* =========================================================
   Scroll reveal (Terry's portfolio version).
   Each block starts fully off-screen on the side it lands on,
   then slides all the way in while fading in.

   Changes from the portfolio code (marked "SITE ADDITION"):
   1. Blocks that appear later (events, featured makers, vendor cards,
      the photo gallery, the vendor filters) are picked up by calling
      TM.reveal() again.
   2. Once a block has slid in, its reveal classes are removed so the
      cards' hover lift works normally.
   ========================================================= */
(function () {
  var TM = (window.TM = window.TM || {});
  TM.reveal = function () {}; // stays a no-op if motion is off
  if (!('getBoundingClientRect' in document.documentElement)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // This site's own blocks to animate (not the header or hero).
  // Home page: tiles, gallery, events, featured makers, reviews, sell-here form,
  // about, visit, FAQ. Vendors page: search/filters, vendor cards, info boxes.
  // Grey loading placeholders (.skeleton) are left out; the real cards slide in.
  var sel = [
    '#find .tiles > li', '#gallery .carousel-wrap',
    '#events-list > li:not(.skeleton)',
    '#featured-vendors > li:not(.skeleton)',
    '#reviews .carousel-wrap',
    '#become-a-vendor .form-grid',
    '#about .about > div', '#about .quote',
    '#visit .visit-grid > div', '#visit .map-frame',
    '.faq details',
    '.directory-controls', '#vendor-grid > li:not(.skeleton)',
    '.container > .empty' // the "coming soon" and "Apply for a booth" boxes
  ].join(', ');

  var els = [];
  function side(el, i) {
    el.classList.remove('from-left', 'from-right');
    var r = el.getBoundingClientRect(), w = window.innerWidth;
    var right = r.width > w * 0.6 ? (i % 2 === 1) : (r.left + r.width / 2 >= w / 2);
    el.classList.add(right ? 'from-right' : 'from-left');
  }
  var full = 0;

  // SITE ADDITION: when a block has finished sliding in, hand it back to its normal styles
  function finish(el) {
    if (el._done) return;
    el._done = true;
    el.classList.remove('reveal', 'in', 'from-left', 'from-right');
    el.style.removeProperty('--d');
  }

  // SITE ADDITION: collect blocks (again) so content added later is included
  function collect() {
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
      if (el._seen || el.closest('[hidden]')) return; // hidden blocks are picked up once shown
      el._seen = true;
      var r = el.getBoundingClientRect();
      el._alt = r.width > window.innerWidth * 0.6 ? full++ : 0;
      side(el, el._alt);
      el.classList.add('reveal');
      els.push(el);
    });
  }

  function check() {
    var k = 0, h = window.innerHeight;
    els.forEach(function (el) {
      if (el._done || el.classList.contains('in')) return;
      var r = el.getBoundingClientRect();
      if (r.top < h * 0.9 && r.bottom > 0) {
        var delay = k++ * 0.12;
        el.style.setProperty('--d', delay + 's');
        el.classList.add('in');
        setTimeout(function () { finish(el); }, delay * 1000 + 1000); // SITE ADDITION
      }
    });
  }
  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; check(); }); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    els.forEach(function (el) {
      if (el._done || el.classList.contains('in')) return;
      el.classList.remove('reveal');
      side(el, el._alt);
      el.classList.add('reveal');
    });
    onScroll();
  });

  // SITE ADDITION: other scripts call TM.reveal() after they add blocks
  TM.reveal = function () { collect(); check(); };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', TM.reveal);
  else TM.reveal();
})();
