# Interactive map + builder

A bright, single-page interactive map and a no-code **builder** to make your own.
Pure HTML/CSS/JS with a locally-bundled Leaflet.
Point it at any subject: places you've travelled, animals you've spotted, a hiking
club's peaks, anything that lives on a map.

- **`index.html`** - the map. Reads one object, `window.MAP`, from `data.js`.
- **`builder.html`** - a visual editor that writes `data.js` for you.

The map has one or more **layers** (the tabs), a **year slider** (optional), an
auto-zoom to whatever a year highlights, a side panel that lists a year's places, and
link cards under the map.

## Make a map without touching code `builder.html`

Serve the folder (see below) and open `builder.html`. Fill in tables, pick emoji
icons, drop pins by clicking the map, then **Export → Download `data.js`** and drop it
back into the folder. The builder covers everything:

- **Brand** - title, tagline, website, accent colour, logo, footer, cards.
- **Layers** - add/rename/reorder tabs and choose each one's type.
- **Data** - a table per layer; **📍 Pick on map** grabs coordinates by clicking.
- **Preview** - a live view of your map.
- **Export & Publish** - download `data.js`, import an existing one, and step-by-step
  instructions for running locally, embedding, and publishing on GitHub Pages.

Your work autosaves to the browser; **Import data.js** loads an existing map back in.

## Edit by hand: `data.js`

`data.js` is the only file you edit. It sets `window.MAP = { config, layers }`.

```js
window.MAP = {
  config: {
    title: "My map", tagline: "places worth a pin",
    site: "https://example.com",   // base for auto /tag/ links; empty = no links/mentions
    siteLabel: "example.com", footerBy: "me",
    logo: "logo.png", accent: "#9db4f0",
    timeline: true,                // false = no year slider
    cardsTitle: "More", cards: [{ emoji: "📍", title: "…", text: "…", href: "…", cta: "…" }],
  },
  layers: [ /* … */ ],
};
```

### Layer types

```js
// regions - shades countries on the world map (matched via COUNTRY_ALIASES)
{ id: "countries", label: "Countries", icon: "🌍", type: "regions",
  noun: { one: "country", many: "countries" },
  items: [
    { name: "Greece", home: true, url: "https://…" },              // home - always shown, no years
    { name: "Spain",  years: [2016, 2024], links: { 2016: "https://…", 2024: "" } },
    { name: "Italy",  years: [2025], url: "https://…", note: "…" },
  ] }

// points - pins with an optional metric badge and optional per-item emoji
{ id: "mountains", label: "Mountains", icon: "⛰️", type: "points", pin: "mountain",
  metric: { key: "elevation", suffix: " m" },
  items: [ { name: "Olympus", coords: [40.09, 22.36], elevation: 2917,
             group: "Greece", years: [2023], url: "https://…", icon: "🏔️", note: "…" } ] }

// places - grouped markers (each a popup of links) + a themed side panel
{ id: "japan", label: "Japan blog", icon: "⛩️", type: "places",
  bounds: [[26, 127], [46, 146]],
  groups: [ { name: "Tokyo", coords: [35.69, 139.4], posts: [["47 ronin", "https://…"]] } ],
  themes: [ { name: "Festivals", posts: [["Hanami", "https://…"]] } ] }
```

- **`years`** - every year visited (repeats welcome). Omit for a `home` region.
- **Links:** `url: "…"` for one link, or `links: { 2024: "…" }` for one post per year
  (an empty link is simply not clickable). At the "All" view a place links to its
  `/tag/<name>/` page on your `site` (override with `tag: "custom-slug"`).
- **`pin`** - `"mountain"` (triangle) or `"dot"` (circle); a per-item `icon` emoji wins.
- **`metric`** - an optional badge on point pins (e.g. elevation).
- **`note`** - an optional line shown in the tooltip.
- The slider spans every year found across all layers; set `config.timeline: false` (or
  use no years at all) for a static map with no slider.

## Run locally

The map loads `world.geojson`, so serve over HTTP (not `file://`):

```bash
python3 -m http.server 8777
```

Then open `http://localhost:8777` (the map) or `http://localhost:8777/builder.html`.

## Publish (GitHub Pages)

Push the repo and enable **Settings → Pages → Deploy from a branch**. Everything is
self-contained, so the site works as-is at `https://USERNAME.github.io/REPO/`. Embed it
anywhere with an `<iframe>`, or point a subdomain at it with a DNS CNAME to
`USERNAME.github.io`.

## What's in here

| file | what it is |
|------|------------|
| `index.html` | the map page (tabs, slider, cards) |
| `builder.html` / `builder.js` / `builder.css` | the no-code map builder |
| `app.js` | the map engine - reads `window.MAP`, renders every layer type (Leaflet, no tiles) |
| `data.js` | **the map data - edit this** (`window.MAP`, `window.COUNTRY_ALIASES`) |
| `styles.css` | all map styling (palette in `:root`) |
| `world.geojson` | country shapes (Natural Earth 110m + split UK & micro-states, self-hosted) |
| `vendor/leaflet.*` | bundled Leaflet |
| `logo.png` / `icon.png` | header logo / favicon |
