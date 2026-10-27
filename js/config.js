/* =========================================================
   SITE SETTINGS - the only JavaScript file you normally edit.

   Where does the editable info (hours, events, vendors, food trucks,
   announcement) come from? Pick ONE option with dataSource:

   "local"  = Option A. Edit the CSV files in the /data folder, then
              commit and push to GitHub. Render redeploys in about a minute.
              Simple, but only Terry can make changes.

   "sheet"  = Option B. Tiffany edits a Google Sheet herself. Publish each
              tab to the web as CSV (File > Share > Publish to web) and
              paste each link below. Changes show up within a few minutes.
              If a sheet link is blank or fails, the site falls back to
              the local CSV file for that table.
   ========================================================= */

window.SITE_CONFIG = {
  dataSource: "local", // "local" or "sheet"

  local: {
    hours: "data/hours.csv",
    specialHours: "data/special-hours.csv",
    events: "data/events.csv",
    vendors: "data/vendors.csv",
    settings: "data/settings.csv"
  },

  // Option B: paste the "Publish to web" CSV link for each tab here.
  // They look like: https://docs.google.com/spreadsheets/d/e/LONG-ID/pub?gid=123&single=true&output=csv
  sheet: {
    hours: "",
    specialHours: "",
    events: "",
    vendors: "",
    settings: ""
  },

  timeZone: "America/Los_Angeles",
  businessName: "Tiffany's Marketplace",
  address: "211 N. Front St., Central Point, OR 97502",
  facebookUrl: "https://www.facebook.com/TiffanysMarketplace2026",

  // Vendor directory filter buttons (in this order). A vendor whose
  // category isn't in this list shows up under "Other".
  categories: [
    "Wood", "Candles", "Beauty & Soap", "Rocks & Gems", "Honey", "Jewelry",
    "Home Decor", "Metal", "Clothing", "Art", "Up-cycled & Vintage", "Other"
  ]
};
