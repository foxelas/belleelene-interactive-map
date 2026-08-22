/* ============================================================================
   belleelene · travel map — app logic
   Uses Leaflet (bundled locally) with NO tiles: flat, minimal, instant.
   ============================================================================ */
(function () {
  "use strict";

  // ---- helpers -------------------------------------------------------------
  const $ = (s, r = document) => r.querySelector(s);
  const norm = (s) => String(s).trim().toLowerCase();

  // Resolve a user-typed country name to the map's canonical name.
  function canonicalCountry(name) {
    const n = norm(name);
    if (COUNTRY_ALIASES[n]) return COUNTRY_ALIASES[n];
    return name; // matched case-insensitively later
  }

  // Build a lookup: canonicalName(lower) -> {years[], url}
  const countryIndex = {};
  TRAVELS.countries.forEach((c) => {
    const key = norm(canonicalCountry(c.name));
    countryIndex[key] = { years: c.years || [], url: c.url || "", label: c.name };
  });

  // ---- year range ----------------------------------------------------------
  const allYears = new Set();
  const collect = (arr) => arr.forEach((x) => (x.years || []).forEach((y) => allYears.add(y)));
  collect(TRAVELS.countries); collect(TRAVELS.mountains); collect(TRAVELS.islands);
  const years = [...allYears].sort((a, b) => a - b);
  const minYear = years[0], maxYear = years[years.length - 1];
  const ALL = maxYear + 1; // slider's right-most stop = "all years"

  // state
  let tab = "countries";
  let year = ALL; // start showing everything

  const visibleInYear = (item) =>
    year === ALL ? (item.years && item.years.length > 0)
                 : (item.years || []).includes(year);

  // ---- map -----------------------------------------------------------------
  const map = L.map("map", {
    zoomControl: true,
    attributionControl: true,
    minZoom: 1, maxZoom: 8,
    worldCopyJump: true,
    scrollWheelZoom: true,
  });
  map.attributionControl.setPrefix(
    '<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a> · Natural Earth'
  );
  const WORLD = L.latLngBounds([[-58, -172], [80, 192]]);
  map.fitBounds(WORLD);

  let countriesLayer = null;
  const markerLayer = L.layerGroup();
  let currentMarkers = [];

  // tooltip HTML
  function tip(name, meta, hasUrl) {
    return `<div class="tt-name">${name}</div>` +
           (meta ? `<div class="tt-meta">${meta}</div>` : "") +
           (hasUrl ? `<div class="tt-go">read the post →</div>` : "");
  }

  function openOrToast(url, name) {
    if (url) window.open(url, "_blank", "noopener");
    else toast(`“${name}” — blog post coming soon`);
  }

  // ---- countries layer -----------------------------------------------------
  fetch("world.geojson")
    .then((r) => r.json())
    .then((geo) => {
      countriesLayer = L.geoJSON(geo, {
        style: () => ({
          className: "country",
          color: getVar("--land-line"),
          weight: 0.7,
          fillColor: getVar("--land"),
          fillOpacity: 1,
        }),
        onEachFeature: (feature, layer) => {
          const cname = feature.properties.name;
          const rec = countryIndex[norm(cname)];
          layer.feature.__rec = rec;
          if (rec) {
            layer.on("mouseover", () => layer.bringToFront());
            layer.on("click", () => openOrToast(rec.url, rec.label || cname));
          }
        },
      }).addTo(map);
      paint();
    })
    .catch((err) => {
      console.error("Could not load world.geojson", err);
      toast("Map data failed to load — are you running from a server?");
    });

  // ---- markers (mountains / islands) --------------------------------------
  function mountainIcon() {
    return L.divIcon({
      className: "pin",
      html: `<svg width="30" height="30" viewBox="0 0 30 30"><path d="M15 5 L26 25 H4 Z"
        fill="url(#foxGrad)" stroke="#2f74b5" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M11.5 13 L15 9 L18.5 13 L16.5 15 L15 13.6 L13.5 15 Z" fill="#fff" opacity=".85"/></svg>`,
      iconSize: [30, 30], iconAnchor: [15, 26], tooltipAnchor: [0, -22],
    });
  }
  function islandIcon() {
    return L.divIcon({
      className: "pin",
      html: `<svg width="26" height="26" viewBox="0 0 26 26">
        <circle cx="13" cy="13" r="8" fill="url(#foxGrad)" stroke="#2f74b5" stroke-width="1.4"/>
        <circle cx="13" cy="13" r="3" fill="#fff" opacity=".9"/></svg>`,
      iconSize: [26, 26], iconAnchor: [13, 13], tooltipAnchor: [0, -12],
    });
  }

  function buildMarkers(kind) {
    markerLayer.clearLayers();
    currentMarkers = [];
    const src = kind === "mountains" ? TRAVELS.mountains : TRAVELS.islands;
    src.forEach((item) => {
      const m = L.marker(item.coords, {
        icon: kind === "mountains" ? mountainIcon() : islandIcon(),
        riseOnHover: true,
        keyboard: false,
      });
      const meta = kind === "mountains"
        ? [item.elevation ? item.elevation + " m" : null, item.country].filter(Boolean).join(" · ")
        : [item.country].filter(Boolean).join(" · ");
      m.bindTooltip(tip(item.name, meta, !!item.url),
        { className: "tt", direction: "top", opacity: 1, sticky: false });
      m.on("click", () => openOrToast(item.url, item.name));
      m.__item = item;
      currentMarkers.push(m);
    });
  }

  // ---- paint / filter by year ---------------------------------------------
  function paint() {
    // countries
    if (countriesLayer) {
      countriesLayer.eachLayer((layer) => {
        const rec = layer.feature.__rec;
        const el = layer.getElement && layer.getElement();
        const visited = rec && visibleInYear(rec);
        if (tab === "countries" && visited) {
          layer.setStyle({ color: getVar("--deep"), weight: 1 });
          if (el) el.classList.add("country-visited");
          const yrs = rec.years.join(", ");
          layer.bindTooltip(tip(rec.label, "visited " + yrs, !!rec.url),
            { className: "tt", direction: "top", sticky: true, opacity: 1 });
        } else {
          if (el) el.classList.remove("country-visited");
          layer.setStyle({ color: getVar("--land-line"), weight: 0.7,
            fillColor: getVar("--land"), fillOpacity: 1 });
          layer.unbindTooltip();
        }
      });
    }

    // markers
    if (tab === "mountains" || tab === "islands") {
      map.addLayer(markerLayer);
      markerLayer.clearLayers();
      currentMarkers.forEach((m) => { if (visibleInYear(m.__item)) markerLayer.addLayer(m); });
    } else {
      map.removeLayer(markerLayer);
    }

    updateStats();
    updateSlider();
    updateLegend();
  }

  // ---- stats ---------------------------------------------------------------
  function updateStats() {
    const big = $("#statBig"), sub = $("#statSub");
    if (tab === "countries") {
      const list = TRAVELS.countries.filter(visibleInYear);
      big.innerHTML = `<em>${list.length}</em> ${list.length === 1 ? "country" : "countries"}`;
      sub.textContent = year === ALL ? "everywhere I've set foot" : `visited in ${year}`;
    } else if (tab === "mountains") {
      const list = TRAVELS.mountains.filter(visibleInYear);
      const hi = list.reduce((a, b) => Math.max(a, b.elevation || 0), 0);
      big.innerHTML = `<em>${list.length}</em> ${list.length === 1 ? "summit" : "summits"}`;
      sub.textContent = hi ? `highest · ${hi.toLocaleString()} m` : "peaks climbed";
    } else {
      const list = TRAVELS.islands.filter(visibleInYear);
      big.innerHTML = `<em>${list.length}</em> ${list.length === 1 ? "island" : "islands"}`;
      sub.textContent = year === ALL ? "islands wandered" : `wandered in ${year}`;
    }
  }

  // ---- legend --------------------------------------------------------------
  function updateLegend() {
    const l = $("#legend");
    if (tab === "countries") { l.innerHTML = `<span class="dot"></span> countries visited`; }
    else if (tab === "mountains") { l.innerHTML = `<span class="dot pin-dot"></span> summits`; }
    else { l.innerHTML = `<span class="dot pin-dot"></span> islands`; }
  }

  // ---- slider --------------------------------------------------------------
  function updateSlider() {
    const label = $("#yearNow");
    if (year === ALL) { label.className = "year-now all"; label.innerHTML = `<em>All years</em>`; }
    else { label.className = "year-now"; label.textContent = year; }
    // tick highlight
    document.querySelectorAll(".ticks button").forEach((b) => {
      b.classList.toggle("on", Number(b.dataset.v) === year);
    });
    $("#range").value = year;
  }

  // ---- tabs ----------------------------------------------------------------
  function setTab(next) {
    tab = next;
    document.querySelectorAll(".tab").forEach((t) =>
      t.setAttribute("aria-selected", String(t.dataset.tab === next)));
    if (next === "mountains") buildMarkers("mountains");
    if (next === "islands") buildMarkers("islands");
    paint();
    // gently frame the relevant content
    if (next === "countries") {
      map.flyToBounds(WORLD, { duration: .5, padding: [10, 10] });
    } else {
      const src = next === "mountains" ? TRAVELS.mountains : TRAVELS.islands;
      const pts = src.filter(visibleInYear).map((x) => x.coords);
      if (pts.length) map.flyToBounds(L.latLngBounds(pts).pad(0.4), { duration: .6, maxZoom: 6 });
    }
  }

  // ---- build slider ticks --------------------------------------------------
  function buildTicks() {
    const ticks = $("#ticks");
    ticks.innerHTML = "";
    years.forEach((y) => {
      const b = document.createElement("button");
      b.textContent = "’" + String(y).slice(2);
      b.title = y; b.dataset.v = y;
      b.addEventListener("click", () => { year = y; paint(); });
      ticks.appendChild(b);
    });
    const all = document.createElement("button");
    all.textContent = "All"; all.className = "all"; all.dataset.v = ALL;
    all.addEventListener("click", () => { year = ALL; paint(); });
    ticks.appendChild(all);
  }

  // ---- toast ---------------------------------------------------------------
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  // ---- css var reader ------------------------------------------------------
  const cssVars = getComputedStyle(document.documentElement);
  function getVar(name) { return cssVars.getPropertyValue(name).trim(); }

  // ---- wire up -------------------------------------------------------------
  function init() {
    // tabs
    document.querySelectorAll(".tab").forEach((t) =>
      t.addEventListener("click", () => setTab(t.dataset.tab)));

    // range slider
    const range = $("#range");
    range.min = minYear; range.max = ALL; range.step = 1; range.value = ALL;
    range.addEventListener("input", () => { year = Number(range.value); paint(); });

    buildTicks();
    updateSlider();

    // keep the map sized correctly
    window.addEventListener("resize", () => map.invalidateSize());
    setTimeout(() => map.invalidateSize(), 200);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
