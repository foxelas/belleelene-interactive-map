# belleelene · travel map

A bright, single-page interactive map of my travels. Pure HTML/CSS/JS with a
locally-bundled Leaflet (no tiles, no build step, no CDN) — just open it.

Four tabs share one map:

- **Countries** — a flat world choropleth. *Visited* countries glow blue→lavender;
  *home* countries (Greece, Japan) glow gold and are always shown.
- **Mountains** / **Islands** — pin markers for every summit / island.
- **Japan blog** — a native map of Japan with a marker per prefecture (each opens a
  popup of blog posts) plus a side panel of themed posts.

Extras: a per-tab **year slider** (empty years are shown but disabled), it
**auto-zooms** to whatever a year highlights, a left **overlay panel** lists that
year's places, and clicking a place opens the matching blog article — with a small
**year chooser** when a place has posts from several years.

## Edit the travels — `data.js`

`data.js` is the only file you edit. It defines three globals:

### `TRAVELS`

```js
countries: [
  { name: "Greece", home: true, url: "https://..." },          // home — always shown, no years
  { name: "Spain",  years: [2016, 2024], links: {              // visited once per year
      2016: "https://...", 2024: "" } },
  { name: "Italy",  years: [2025], url: "https://..." },        // single visit
],
mountains: [
  { name: "Olympus", coords: [40.09, 22.36], elevation: 2917,  // coords are [lat, lng]
    country: "Greece", years: [2023, 2024],
    links: { 2023: "https://...", 2024: "https://..." } },
],
islands: [
  { name: "Naxos", coords: [37.10, 25.44], country: "Greece",
    years: [2023], url: "https://..." },
],
```

- **`years`** — every year visited (repeat visits welcome). Omit for a **`home`** country.
- **Links:** `url: "…"` for a single link, or `links: { 2024: "…", 2026: "…" }` for one
  post per year (keys must match `years`; leave `""` until written). An empty link is
  simply **not clickable** — no placeholder.
- **`home: true`** marks a lived-in country (styled gold, excluded from the visited count).
- Country names are matched to the map via **`COUNTRY_ALIASES`** (e.g. `USA`, `Korea`,
  `Macau`). **England / Scotland / Wales are separate** entries.

### `JAPAN_BLOG` — the Japan blog tab

```js
prefectures: [
  { name: "Tokyo", coords: [35.68, 139.76], posts: [
    ["47 ronin", "https://..."], ["Izu Isles", "https://..."] ] },
],
themes: [ { name: "Festivals", posts: [ ["Hanami", "https://..."] ] } ],
```

Each `post` is `[title, url]`. `prefectures` are placed on the map; `themes` fill the
side panel.

## Run locally

The page fetches `world.geojson`, so serve it over HTTP (not `file://`):

```bash
python3 -m http.server 8777
```

Then open http://localhost:8777 .

## Deploy (GitHub Pages)

Push the repo and enable **Settings → Pages → Deploy from a branch**. Everything is
self-contained, so the site works as-is at the Pages URL.

## What's in here

| file | what it is |
|------|------------|
| `index.html` | page structure (4 tabs, slider, cards) |
| `styles.css` | all styling (palette + `--home` gold live in `:root`) |
| `app.js` | map, slider, year panel, Japan-blog logic (Leaflet, no tiles) |
| `data.js` | **the travel data — edit this** (`TRAVELS`, `COUNTRY_ALIASES`, `JAPAN_BLOG`) |
| `world.geojson` | country shapes (Natural Earth 110m + split UK & micro-states, self-hosted) |
| `vendor/leaflet.*` | bundled Leaflet |
| `logo.png` | the fox (header) |
| `icon.png` | favicon |
