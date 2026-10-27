/* =========================================================
   Home page: open/closed badge, hours table, upcoming events
   (with Add to calendar), food trucks this week, featured makers.
   ========================================================= */
(function () {
  "use strict";
  var TM = window.TM, cfg = window.SITE_CONFIG || {};
  var e = TM.escapeHTML;
  var LOCATION = (cfg.businessName || "") + ", " + (cfg.address || "");

  /* ---------- Hours + Open now ---------- */
  TM.getHours().then(function (hours) {
    var badge = document.getElementById("open-badge");
    var line = document.getElementById("today-hours");
    if (!hours) return; // keep the fallback text in the HTML

    var st = TM.status(hours);
    if (badge) {
      badge.textContent = st.open ? "Open now" : "Closed now";
      badge.className = "badge " + (st.open ? "badge-open" : "badge-closed");
    }
    if (line) line.textContent = st.text;

    // Weekly table, Monday first; today's row highlighted with today's real hours
    var body = document.getElementById("hours-body");
    if (body) {
      var n = TM.now();
      body.innerHTML = TM.WEEK_ORDER.map(function (d) {
        var isToday = d === n.dayIndex;
        var h = isToday ? hours.forDate(n.dateKey) : hours.regular[d] || { closed: true };
        var txt = h.closed ? "Closed" : TM.rangeText(h);
        if (isToday && h.note) txt += " (" + h.note + ")";
        return '<tr' + (isToday ? ' class="today"' : "") + '><th scope="row">' + TM.DAY_LONG[d] +
          (isToday ? ' <span class="visually-hidden">(today)</span>' : "") + "</th><td>" + e(txt) + "</td></tr>";
      }).join("");
    }

    // Upcoming special hours in the next 60 days
    var list = document.getElementById("special-hours");
    if (list) {
      var today = TM.now().dateKey, end = TM.addDays(today, 60);
      var items = Object.keys(hours.special).filter(function (k) { return k >= today && k <= end; }).sort()
        .map(function (k) {
          var s = hours.special[k];
          var label = TM.fmtDate(k, { weekday: "short", month: "short", day: "numeric" });
          var txt = s.closed ? "Closed" : TM.rangeText(s);
          return "<li>" + e(label) + ": " + e(txt) + (s.note ? " (" + e(s.note) + ")" : "") + "</li>";
        });
      if (items.length) {
        list.innerHTML = items.join("");
        var head = document.getElementById("special-hours-heading");
        if (head) head.hidden = false;
      }
    }
  });

  /* ---------- Events ---------- */
  function pad(n) { return String(n).padStart(2, "0"); }
  function hhmm(mins) { return pad(Math.floor(mins / 60)) + pad(mins % 60); }
  function eventTimes(ev) {
    var start = TM.toMinutes(ev.start), end = TM.toMinutes(ev.end);
    if (start == null) return null; // all-day
    if (end == null || end <= start) end = Math.min(start + 120, 23 * 60 + 59);
    return { start: start, end: end };
  }
  function googleCalUrl(ev) {
    var d = ev.date.replace(/-/g, ""), t = eventTimes(ev), dates;
    if (t) dates = d + "T" + hhmm(t.start) + "00/" + d + "T" + hhmm(t.end) + "00";
    else dates = d + "/" + TM.addDays(ev.date, 1).replace(/-/g, "");
    var p = new URLSearchParams({
      action: "TEMPLATE", text: ev.title, dates: dates, ctz: cfg.timeZone || "America/Los_Angeles",
      details: ev.description || "", location: LOCATION
    });
    return "https://calendar.google.com/calendar/render?" + p.toString();
  }
  function icsEscape(s) { return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
  function icsUrl(ev) {
    var d = ev.date.replace(/-/g, ""), t = eventTimes(ev), tz = cfg.timeZone || "America/Los_Angeles";
    var stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    var uid = d + "-" + ev.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "@tiffanysmarketplace";
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Tiffanys Marketplace//Events//EN", "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT", "UID:" + uid, "DTSTAMP:" + stamp];
    if (t) {
      lines.push("DTSTART;TZID=" + tz + ":" + d + "T" + hhmm(t.start) + "00");
      lines.push("DTEND;TZID=" + tz + ":" + d + "T" + hhmm(t.end) + "00");
    } else {
      lines.push("DTSTART;VALUE=DATE:" + d, "DTEND;VALUE=DATE:" + TM.addDays(ev.date, 1).replace(/-/g, ""));
    }
    lines.push("SUMMARY:" + icsEscape(ev.title), "DESCRIPTION:" + icsEscape(ev.description), "LOCATION:" + icsEscape(LOCATION),
      "END:VEVENT", "END:VCALENDAR");
    return "data:text/calendar;charset=utf-8," + encodeURIComponent(lines.join("\r\n"));
  }

  TM.load("events").then(function (rows) {
    var list = document.getElementById("events-list"), empty = document.getElementById("events-empty");
    if (!rows || !list) return;
    var today = TM.now().dateKey;
    var upcoming = rows
      .filter(function (r) { return TM.isDateKey(r.date) && r.title && r.date >= today; })
      .sort(function (a, b) {
        var ta = TM.toMinutes(a.start), tb = TM.toMinutes(b.start);
        return a.date === b.date ? (ta == null ? -1 : ta) - (tb == null ? -1 : tb) : a.date < b.date ? -1 : 1;
      })
      .slice(0, 8);
    if (!upcoming.length) return; // empty message stays visible

    list.innerHTML = upcoming.map(function (ev) {
      var t = eventTimes(ev);
      var when = TM.fmtDate(ev.date, { weekday: "long", month: "long", day: "numeric" }) +
        (t ? " \u00b7 " + TM.fmtTime(t.start) + (TM.toMinutes(ev.end) != null ? " to " + TM.fmtTime(t.end) : "") : "");
      var link = TM.safeUrl(ev.link);
      var file = ev.date + "-" + ev.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".ics";
      return '<li class="event">' +
        '<div class="event-date" aria-hidden="true"><span class="m">' + TM.fmtDate(ev.date, { month: "short" }) +
        '</span><span class="d">' + TM.fmtDate(ev.date, { day: "numeric" }) + "</span></div>" +
        "<div><h3>" + e(ev.title) + "</h3>" +
        '<p class="event-meta">' + e(when) + "</p>" +
        (ev.description ? "<p>" + e(ev.description) + "</p>" : "") +
        (link ? '<p><a href="' + e(link) + '">More details<span class="visually-hidden"> about ' + e(ev.title) + "</span></a></p>" : "") +
        '<p class="cal-label">Add to your calendar:</p>' +
        '<div class="cal-links">' +
        '<a class="btn btn-outline btn-small" href="' + e(googleCalUrl(ev)) + '">Google<span class="visually-hidden"> Calendar: ' + e(ev.title) + "</span></a>" +
        '<a class="btn btn-outline btn-small" href="' + e(icsUrl(ev)) + '" download="' + e(file) + '">Apple / Outlook<span class="visually-hidden"> calendar: ' + e(ev.title) + "</span></a>" +
        "</div></div></li>";
    }).join("");
    list.hidden = false;
    if (empty) empty.hidden = true;
  });

  /* ---------- Food trucks this week ---------- */
  TM.getSettings().then(function (s) {
    var el = document.getElementById("food-trucks-line");
    if (el && s.food_trucks_this_week) { el.textContent = "Also this week: " + s.food_trucks_this_week; el.hidden = false; }
  });

  /* ---------- Featured makers ---------- */
  TM.load("vendors").then(function (rows) {
    var grid = document.getElementById("featured-vendors"), empty = document.getElementById("featured-empty");
    if (!rows || !grid) return;
    var vendors = TM.cleanVendors(rows);
    var featured = vendors.filter(function (v) { return TM.isYes(v.featured); });
    var show = (featured.length ? featured : vendors).slice(0, 8);
    if (!show.length) return;
    grid.innerHTML = show.map(TM.vendorCard).join("");
    grid.hidden = false;
    if (empty) empty.hidden = true;
  });
})();
