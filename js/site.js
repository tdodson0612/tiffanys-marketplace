/* =========================================================
   Shared code for every page: loads the editable data, works out
   open/closed in Pacific time, shows the announcement bar, fills the
   footer hours and year, and draws vendor cards.
   You shouldn't need to edit this file.
   ========================================================= */
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var TM = (window.TM = {});
  var TZ = cfg.timeZone || "America/Los_Angeles";
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
  TM.DAYS = DAYS;
  TM.DAY_LONG = DAY_LONG;
  TM.WEEK_ORDER = WEEK_ORDER;

  /* ---------- Safety helpers ---------- */
  TM.escapeHTML = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  // Only allow web links (and, if allowRelative, simple paths like images/x.webp)
  TM.safeUrl = function (u, allowRelative) {
    u = String(u || "").trim();
    if (/^https?:\/\/[^\s"'<>]+$/i.test(u)) return u;
    if (allowRelative && /^[\w\-./]+$/.test(u) && u.indexOf("..") === -1) return u;
    return "";
  };
  TM.isYes = function (v) { return /^(y|yes|true|1|x)$/i.test(String(v || "").trim()); };

  /* ---------- CSV ---------- */
  // Turns CSV text into a list of objects keyed by the header row.
  // Blank rows and rows whose first cell starts with "#" are skipped.
  TM.parseCSV = function (text) {
    var rows = [], row = [], field = "", inQuotes = false;
    text = String(text || "").replace(/^﻿/, "");
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
        } else { field += c; }
      } else if (c === '"') { inQuotes = true; }
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else { field += c; }
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return [];
    var head = rows[0].map(function (h) { return h.trim().toLowerCase().replace(/\s+/g, "_"); });
    return rows.slice(1)
      .filter(function (r) {
        var first = String(r[0] || "").trim();
        return first.charAt(0) !== "#" && r.some(function (v) { return String(v).trim() !== ""; });
      })
      .map(function (r) {
        var o = {};
        head.forEach(function (h, j) { o[h] = String(r[j] == null ? "" : r[j]).trim(); });
        return o;
      });
  };

  /* ---------- Data loading (cached) ---------- */
  var cache = {};
  function fetchCSV(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    }).then(TM.parseCSV);
  }
  // Resolves to a list of rows, or null if the data couldn't be loaded
  // (then the page keeps its built-in fallback text).
  TM.load = function (name) {
    if (cache[name]) return cache[name];
    var local = (cfg.local || {})[name];
    var sheet = cfg.dataSource === "sheet" ? (cfg.sheet || {})[name] : "";
    var p = sheet
      ? fetchCSV(sheet).catch(function (e) {
          console.warn("Sheet failed for " + name + ", using local file.", e);
          return local ? fetchCSV(local) : null;
        })
      : local ? fetchCSV(local) : Promise.resolve(null);
    cache[name] = p.catch(function (e) {
      console.warn("Could not load " + name + ". If you opened the file directly, run a local server (see README).", e);
      return null;
    });
    return cache[name];
  };
  TM.getSettings = function () {
    return TM.load("settings").then(function (rows) {
      var s = {};
      (rows || []).forEach(function (r) { if (r.key) s[r.key.toLowerCase()] = r.value || ""; });
      return s;
    });
  };

  /* ---------- Time (always Pacific, whatever the visitor's clock says) ---------- */
  TM.now = function () {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
      weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    var p = {};
    parts.forEach(function (x) { p[x.type] = x.value; });
    return {
      dateKey: p.year + "-" + p.month + "-" + p.day,
      dayIndex: DAYS.indexOf(p.weekday),
      minutes: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10)
    };
  };
  function keyToUTC(key) {
    var a = key.split("-").map(Number);
    return new Date(Date.UTC(a[0], a[1] - 1, a[2]));
  }
  TM.isDateKey = function (k) { return /^\d{4}-\d{2}-\d{2}$/.test(String(k || "")); };
  TM.addDays = function (key, n) {
    var d = keyToUTC(key);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  TM.dayIndexOf = function (key) { return keyToUTC(key).getUTCDay(); };
  TM.fmtDate = function (key, opts) {
    return keyToUTC(key).toLocaleDateString("en-US", Object.assign({ timeZone: "UTC" }, opts));
  };

  // "11:00", "8:00 PM", "8pm", "20:00" -> minutes after midnight (or null)
  TM.toMinutes = function (t) {
    var m = String(t || "").trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/);
    if (!m) return null;
    var h = parseInt(m[1], 10), min = parseInt(m[2] || "0", 10), ap = m[3];
    if (ap) { ap = ap.charAt(0); if (h === 12) h = 0; if (ap === "p") h += 12; }
    if (h > 24 || min > 59) return null;
    return h * 60 + min;
  };
  // 660 -> "11 am", 1230 -> "8:30 pm", 720 -> "12 pm"
  TM.fmtTime = function (mins) {
    var h = Math.floor(mins / 60) % 24, m = mins % 60;
    var ap = h >= 12 ? "pm" : "am", h12 = h % 12 || 12;
    return h12 + (m ? ":" + String(m).padStart(2, "0") : "") + " " + ap;
  };

  /* ---------- Hours ---------- */
  function dayFromName(name) {
    var s = String(name || "").trim().slice(0, 3).toLowerCase();
    for (var i = 0; i < 7; i++) if (DAYS[i].toLowerCase() === s) return i;
    return -1;
  }
  // Combines weekly hours with dated exceptions (holidays, special events).
  TM.buildHours = function (regularRows, specialRows) {
    var regular = {}, special = {};
    (regularRows || []).forEach(function (r) {
      var d = dayFromName(r.day);
      if (d < 0) return;
      var o = TM.toMinutes(r.open), c = TM.toMinutes(r.close);
      regular[d] = o != null && c != null && c > o ? { open: o, close: c } : null;
    });
    (specialRows || []).forEach(function (r) {
      if (!TM.isDateKey(r.date)) return;
      var o = TM.toMinutes(r.open), c = TM.toMinutes(r.close);
      special[r.date] = o != null && c != null && c > o
        ? { open: o, close: c, note: r.note || "" }
        : { closed: true, note: r.note || "" };
    });
    return {
      regular: regular,
      special: special,
      forDate: function (key) {
        if (special[key]) return special[key];
        var r = regular[TM.dayIndexOf(key)];
        return r ? { open: r.open, close: r.close } : { closed: true };
      }
    };
  };
  TM.rangeText = function (h) { return TM.fmtTime(h.open) + " to " + TM.fmtTime(h.close); };

  // Open-now status, e.g. { open: true, text: "Open until 8 pm" }
  TM.status = function (hours) {
    var n = TM.now(), today = hours.forDate(n.dateKey);
    var note = today.note ? " (" + today.note + ")" : "";
    if (!today.closed && n.minutes >= today.open && n.minutes < today.close) {
      return { open: true, text: "Open until " + TM.fmtTime(today.close) + note };
    }
    if (!today.closed && n.minutes < today.open) {
      return { open: false, text: "Opens today at " + TM.fmtTime(today.open) + note };
    }
    for (var i = 1; i <= 14; i++) {
      var k = TM.addDays(n.dateKey, i), h = hours.forDate(k);
      if (!h.closed) {
        var when = i === 1 ? "tomorrow" : i < 7 ? DAY_LONG[TM.dayIndexOf(k)] : TM.fmtDate(k, { weekday: "long", month: "short", day: "numeric" });
        return { open: false, text: "Opens " + when + " at " + TM.fmtTime(h.open) };
      }
    }
    return { open: false, text: "Check Facebook for our next open day" };
  };

  // Weekly hours in one line, e.g. "Wed-Sun, 11 am to 8 pm"
  TM.summarize = function (hours) {
    var groups = [];
    WEEK_ORDER.forEach(function (d) {
      var h = hours.regular[d];
      var last = groups[groups.length - 1];
      if (h && last && last.open === h.open && last.close === h.close && last.endIdx === WEEK_ORDER.indexOf(d) - 1) {
        last.end = d; last.endIdx = WEEK_ORDER.indexOf(d);
      } else if (h) {
        groups.push({ start: d, end: d, endIdx: WEEK_ORDER.indexOf(d), open: h.open, close: h.close });
      }
    });
    if (!groups.length) return "";
    return groups.map(function (g) {
      var days = g.start === g.end ? DAYS[g.start] : DAYS[g.start] + "–" + DAYS[g.end];
      return days + ", " + TM.fmtTime(g.open) + "–" + TM.fmtTime(g.close);
    }).join("; ");
  };

  TM.getHours = function () {
    return Promise.all([TM.load("hours"), TM.load("specialHours")]).then(function (r) {
      return r[0] ? TM.buildHours(r[0], r[1]) : null;
    });
  };

  /* ---------- Vendor card (used on both pages) ---------- */
  TM.vendorCard = function (v) {
    var e = TM.escapeHTML;
    var name = v.name || "";
    var photo = TM.safeUrl(v.photo, true);
    var initial = (name.replace(/[^A-Za-z0-9]/g, "").charAt(0) || "★").toUpperCase();
    var img = photo
      ? '<img class="vendor-photo" src="' + e(photo) + '" alt="' + e(v.photo_alt || "Handmade work by " + name) +
        '" loading="lazy" decoding="async" width="640" height="480">'
      : '<div class="vendor-photo-placeholder" aria-hidden="true">' + e(initial) + "</div>";
    var links = [["facebook", "Facebook"], ["instagram", "Instagram"], ["etsy", "Etsy"], ["website", "Website"]]
      .map(function (pair) {
        var url = TM.safeUrl(v[pair[0]]);
        if (!url) return "";
        var label = pair[0] === "website" ? name + " website" : name + " on " + pair[1];
        return '<a class="btn btn-outline btn-small" href="' + e(url) + '" aria-label="' + e(label) + '">' + pair[1] + "</a>";
      }).join("");
    return '<li class="vendor-card">' + img +
      '<div class="vendor-body">' +
      (v.category ? '<p class="vendor-cat">' + e(v.category) + "</p>" : "") +
      "<h3>" + e(name) + "</h3>" +
      (v.description ? '<p class="vendor-desc">' + e(v.description) + "</p>" : "") +
      (v.booth ? '<p class="vendor-booth">Booth ' + e(v.booth) + "</p>" : "") +
      (links ? '<div class="vendor-links">' + links + "</div>" : "") +
      "</div></li>";
  };
  TM.cleanVendors = function (rows) {
    return (rows || []).filter(function (v) { return v.name; });
  };

  /* ---------- Things every page does ---------- */
  function initShared() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });

    TM.getSettings().then(function (s) {
      var bar = document.getElementById("announcement");
      if (bar && s.announcement) { bar.textContent = s.announcement; bar.hidden = false; }
    });

    TM.getHours().then(function (hours) {
      if (!hours) return;
      var text = TM.summarize(hours);
      if (!text) return;
      document.querySelectorAll("[data-hours-summary]").forEach(function (el) { el.textContent = text; });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initShared);
  else initShared();
})();
