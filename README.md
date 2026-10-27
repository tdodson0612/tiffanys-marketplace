# Tiffany's Marketplace website

Phase 1 site for Tiffany's Marketplace, 211 N. Front St., Central Point, OR.
Plain HTML, CSS and JavaScript. No build step. Hosted free on Render.

## What's in here

```
index.html          Home page (hero, what you'll find, events, makers,
                    vendor application, about, visit, FAQ)
vendors.html        Vendor directory with category filters and search
404.html            Friendly "page not found"
css/styles.css      All styling (light + dark mode, mobile-first)
js/config.js        SETTINGS: choose CSV files or Google Sheet here
js/site.js          Shared code (data loading, open/closed, vendor cards)
js/home.js          Home page features
js/vendors.js       Directory filters and search
data/*.csv          Editable info: hours, special hours, events,
                    vendors, settings (announcement + food trucks)
images/             logo.png, logo-mark.png, favicon.png, apple-touch-icon.png, og-image.png
robots.txt, sitemap.xml
notes/              PRIVATE (git-ignored): master prompt, questions email,
                    agreement draft, Tiffany's how-to guide
```

## Preview it on your Mac

The pages load data files, so open them through a tiny local server
(double-clicking index.html won't load hours, events or vendors):

```
cd ~/Projects/tiffanys-marketplace
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser. Press Ctrl + C in Terminal
to stop. (Or install the free "Live Server" extension in VS Code and click
"Go Live.")

## Choose how Tiffany's info gets updated

Set `dataSource` in `js/config.js`.

**Option A: CSV files (`"local"`, the default)**
Edit the files in `data/`, then commit and push. Render redeploys in about
a minute. Simplest, but every change goes through you.

**Option B: Google Sheet (`"sheet"`)**
Tiffany edits a sheet herself; the site picks up changes in a few minutes.
1. Make a Google Sheet (in Tiffany's Google account, or yours and share it
   with her) with 5 tabs named `hours`, `special-hours`, `events`,
   `vendors`, `settings`.
2. Paste each CSV file's contents into its tab (File > Import > Upload >
   "Replace current sheet" works too).
3. File > Share > Publish to web. Pick one tab, choose "Comma-separated
   values (.csv)", click Publish, copy the link. Repeat for each tab.
4. Paste each link into the `sheet:` section of `js/config.js` and set
   `dataSource: "sheet"`.
5. Give Tiffany `notes/03-how-to-update-your-website.md`.

If a sheet link fails, the site falls back to the CSV file automatically.

## Before the first draft goes to Tiffany

- [ ] **Vendor form:** make a free Formspree form (formspree.io, 50
      submissions/month free), then replace `YOUR-FORM-ID` in index.html.
      Set it to email Tiffany (or you, until she approves).
- [ ] **Map pin:** open Google Maps, right-click 211 N Front St, Central
      Point, and copy the numbers. Replace `42.3757` and `-122.9199` in the
      JSON-LD in index.html and vendors.html. (Current numbers are an
      estimate.)
- [ ] **Theme:** it follows the visitor's phone setting (light or dark).
      Decide if you'd rather have one high-contrast theme.
- [ ] Add her logo, hero photo and real vendors as they arrive.

## Photos

- Hero: about 1600px wide, WebP, under 200 KB. Save as `images/hero.webp`,
  then follow the comment above the hero in index.html.
- Vendors: about 800px wide, under 150 KB, in `images/vendors/`. Put the
  path (like `images/vendors/honey-co.webp`) or a full https link in the
  vendor's `photo` column, plus a short `photo_alt` description.
- Free compressor: squoosh.app (drag in, choose WebP, download).

## Free analytics (optional)

Make a free GoatCounter account (goatcounter.com, free for non-commercial
use; check their terms for a small business) or use Cloudflare Web
Analytics (free). Paste their one-line script where the comment says so in
the `<head>` of index.html and vendors.html.

## Put it on Render (free)

1. Push this folder to a new GitHub repo.
2. Render > New > Static Site > pick the repo.
3. Build command: leave blank. Publish directory: `.`
4. Create. You get a free `something.onrender.com` link to send Tiffany.

`notes/` is in `.gitignore`, so your private notes never reach GitHub or the
live site.

## Before launch: no placeholders left

Run this from the project folder. It should print nothing (except harmless
matches in README or config comments):

```
grep -rn --exclude-dir=notes --exclude-dir=.git --exclude=README.md \
  -e "ASK TIFFANY" -e "TERRY:" -e "YOUR-FORM-ID" -e "example" -e "555" -e "lorem" -e "cyclex" .
```

When the real domain is connected, the canonical links, og:image, sitemap
and robots.txt already point at https://tiffanysmarketplace.com. If she ends
up with a different domain, search and replace `tiffanysmarketplace.com`.
