# belleelene · travel map

A bright, single-page interactive map of my travels — **countries**, **mountains** and
**islands**, with a **year slider**. No build step, no server, fully self-hosted.

## Edit the travels

Everything lives in **`data.js`**:

- **`countries`** — matched by name (friendly aliases like `USA`, `UK`, `Korea` work;
  add more in `COUNTRY_ALIASES` at the bottom of the file).
- **`mountains`** / **`islands`** — each needs `coords: [latitude, longitude]`.
- **`years`** — list every year you visited (repeat visits welcome).
- **`url`** — your blog post link. Leave `""` and clicking shows a “coming soon” note;
  fill it in and clicking opens the post in a new tab.

## Run locally

Because the page loads `world.geojson`, open it through a tiny web server (not `file://`):

```bash
python3 -m http.server 8777
```

Then visit http://localhost:8777 .


## What's in here

| file | what it is                                       |
|------|--------------------------------------------------|
| `index.html` | page structure                                   |
| `styles.css` | all styling (fox-logo palette lives in `:root`)  |
| `app.js`     | map + slider logic (Leaflet, no tiles)           |
| `data.js`    | travel data — editable                           |
| `world.geojson` | country shapes (Natural Earth 110m, self-hosted) |
| `vendor/leaflet.*` | bundled Leaflet (no CDN needed)                  |
| `logo.png`   | the fox                                          |
