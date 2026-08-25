(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const norm = (s) => String(s).trim().toLowerCase();

  // builder.html previews by writing a draft here and loading index.html?preview=1
  if (new URLSearchParams(location.search).get("preview") === "1") {
    try {
      const draft = localStorage.getItem("MAP_PREVIEW");
      if (draft) window.MAP = JSON.parse(draft);
      const al = localStorage.getItem("MAP_PREVIEW_ALIASES");
      if (al) window.COUNTRY_ALIASES = JSON.parse(al);
    } catch (e) { /* fall back to the bundled data.js */ }
  }

  const MAP = window.MAP || { config: {}, layers: [] };
  const CFG = MAP.config || {};
  const LAYERS = (MAP.layers || []).filter((l) => l && l.id);
  const ALIASES = window.COUNTRY_ALIASES || {};
  const SITE = (CFG.site || "").replace(/\/+$/, "");
  const HAS_SITE = SITE.length > 0;
  const LINK_LABEL = CFG.linkLabel || "read the article →";

  function canonicalCountry(name) {
    return ALIASES[norm(name)] || name;
  }

  const allYears = new Set();
  LAYERS.forEach((l) => (l.items || []).forEach((x) => (x.years || []).forEach((y) => allYears.add(y))));
  const years = [...allYears].sort((a, b) => a - b);
  const minYear = years[0], maxYear = years[years.length - 1];
  const ALL = (maxYear || 0) + 1;
  const TIMELINE = CFG.timeline !== false && years.length > 0;

  let activeId = LAYERS.length ? LAYERS[0].id : null;
  let year = ALL;

  const layerById = (id) => LAYERS.find((l) => l.id === id);
  const activeLayer = () => layerById(activeId) || { type: "points", items: [] };

  const visibleInYear = (item) =>
    year === ALL ? (item.years && item.years.length > 0)
                 : (item.years || []).includes(year);

  function regionIndex(lyr) {
    if (lyr.__index) return lyr.__index;
    const idx = {};
    (lyr.items || []).forEach((it) => { idx[norm(canonicalCountry(it.name))] = it; });
    return (lyr.__index = idx);
  }

  const map = L.map("map", {
    zoomControl: true, attributionControl: true,
    minZoom: 1, maxZoom: 8, worldCopyJump: true, scrollWheelZoom: true,
  });
  map.attributionControl.setPrefix(
    '<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a> · Natural Earth'
  );
  map.zoomControl.setPosition("topright");
  map.createPane("terrain");
  map.getPane("terrain").style.zIndex = 250;
  const WORLD = L.latLngBounds([[-58, -172], [80, 192]]);
  map.fitBounds(WORLD);

  let countriesLayer = null;
  const markerLayer = L.layerGroup();
  let currentMarkers = [];
  let shownPlaces = null;

  const terrainLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}", {
    pane: "terrain", maxZoom: 13, opacity: 0.85, noWrap: true, className: "terrain-tiles",
    bounds: [[-85.05, -180], [85.05, 180]], attribution: "Shaded relief © Esri",
  });
  function setTerrain(on) {
    if (on && !map.hasLayer(terrainLayer)) terrainLayer.addTo(map);
    if (!on && map.hasLayer(terrainLayer)) map.removeLayer(terrainLayer);
  }

  function tip(name, meta, hasUrl, note) {
    return `<div class="tt-name">${name}</div>` +
           (meta ? `<div class="tt-meta">${meta}</div>` : "") +
           (note ? `<div class="tt-note">${note}</div>` : "") +
           (hasUrl ? `<div class="tt-go">${LINK_LABEL}</div>` : "");
  }

  function linkAtYear(item) {
    if (!item) return "";
    if (item.links) return item.links[year] || "";
    return item.url || "";
  }
  function anyLink(item) {
    return !!(item && (item.url || (item.links && Object.values(item.links).some(Boolean))));
  }
  function articleLinks(item) {
    return item && item.links ? Object.values(item.links).filter(Boolean) : (item && item.url ? [item.url] : []);
  }
  function slugify(n) {
    return String(n || "").toLowerCase().split("·")[0].trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function tagUrl(item) {
    const t = item.tag;
    if (t) return /^https?:/i.test(t) ? t : SITE + "/tag/" + t + "/";
    return SITE + "/tag/" + slugify(item.name) + "/";
  }
  function allLink(item) {
    if (item.home) return item.url || "";
    if (item.tag && /^https?:/i.test(item.tag)) return item.tag;
    if (HAS_SITE && anyLink(item)) return tagUrl(item);
    const a = articleLinks(item);
    return a.length ? a[a.length - 1] : "";
  }
  function clickable(item) {
    return year === ALL ? !!allLink(item) : !!linkAtYear(item);
  }
  function handleClick(item) {
    const url = year === ALL ? allLink(item) : linkAtYear(item);
    if (url) window.open(url, "_blank", "noopener");
  }

  fetch("world.geojson")
    .then((r) => r.json())
    .then((geo) => {
      countriesLayer = L.geoJSON(geo, {
        style: () => ({
          className: "country", color: getVar("--land-line"), weight: 0.7,
          fillColor: getVar("--land"), fillOpacity: 1,
        }),
        onEachFeature: (feature, layer) => {
          layer.on("mouseover", () => layer.bringToFront());
          layer.on("click", () => {
            const lyr = activeLayer();
            if (lyr.type !== "regions") return;
            const rec = regionIndex(lyr)[norm(feature.properties.name)];
            if (rec) { layer.closeTooltip(); handleClick(rec); }
          });
        },
      }).addTo(map);
      if (activeLayer().type !== "places") paint();
    })
    .catch((err) => {
      console.error("Could not load world.geojson", err);
      toast("Map data failed to load, are you running from a server?");
    });

  function mountainIcon() {
    return L.divIcon({
      className: "pin",
      html: `<svg width="30" height="30" viewBox="0 0 30 30"><path d="M15 5 L26 25 H4 Z"
        fill="url(#foxGrad)" stroke="#2f74b5" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M11.5 13 L15 9 L18.5 13 L16.5 15 L15 13.6 L13.5 15 Z" fill="#fff" opacity=".85"/></svg>`,
      iconSize: [30, 30], iconAnchor: [15, 26], tooltipAnchor: [0, -22],
    });
  }
  function circleIcon() {
    return L.divIcon({
      className: "pin",
      html: `<svg width="26" height="26" viewBox="0 0 26 26">
        <circle cx="13" cy="13" r="8" fill="url(#foxGrad)" stroke="#2f74b5" stroke-width="1.4"/>
        <circle cx="13" cy="13" r="3" fill="#fff" opacity=".9"/></svg>`,
      iconSize: [26, 26], iconAnchor: [13, 13], tooltipAnchor: [0, -12],
    });
  }
  function emojiIcon(e) {
    return L.divIcon({
      className: "pin pin-emoji",
      html: `<span>${e}</span>`,
      iconSize: [30, 30], iconAnchor: [15, 26], tooltipAnchor: [0, -24],
    });
  }
  function iconFor(pin, emoji) {
    if (emoji) return emojiIcon(emoji);
    if (pin === "mountain") return mountainIcon();
    return circleIcon();
  }

  function metaOf(lyr, item) {
    const m = lyr.metric;
    const badge = m && item[m.key] != null && item[m.key] !== "" ? item[m.key] + (m.suffix || "") : null;
    return [badge, item.group].filter(Boolean).join(" · ");
  }

  function buildMarkers(lyr) {
    markerLayer.clearLayers();
    currentMarkers = [];
    (lyr.items || []).forEach((item) => {
      const m = L.marker(item.coords, { icon: iconFor(lyr.pin, item.icon), riseOnHover: true, keyboard: false });
      m.__meta = metaOf(lyr, item);
      m.__item = item;
      m.on("click", () => { m.closeTooltip(); handleClick(item); });
      currentMarkers.push(m);
    });
  }

  function paint() {
    const lyr = activeLayer();
    const isRegions = lyr.type === "regions";
    const isPoints = lyr.type === "points";

    if (countriesLayer) {
      const index = isRegions ? regionIndex(lyr) : null;
      countriesLayer.eachLayer((layer) => {
        const el = layer.getElement && layer.getElement();
        const rec = index ? index[norm(layer.feature.properties.name)] : null;
        layer.feature.__rec = rec;
        const isHome = rec && rec.home;
        const on = rec && (isHome || visibleInYear(rec));
        if (isRegions && on) {
          const can = clickable(rec);
          if (isHome) {
            layer.setStyle({ color: getVar("--home-line"), weight: 1 });
            if (el) { el.classList.add("country-home"); el.classList.remove("country-visited"); el.classList.toggle("no-link", !can); }
            layer.bindTooltip(tip(rec.name, "home", can, rec.note),
              { className: "tt", direction: "top", sticky: false, opacity: 1 });
          } else {
            layer.setStyle({ color: getVar("--deep"), weight: 1 });
            if (el) { el.classList.add("country-visited"); el.classList.remove("country-home"); el.classList.toggle("no-link", !can); }
            const metaText = year === ALL ? "visited " + (rec.years || []).join(", ") : "";
            layer.bindTooltip(tip(rec.name, metaText, can, rec.note),
              { className: "tt", direction: "top", sticky: false, opacity: 1 });
          }
        } else {
          if (el) el.classList.remove("country-visited", "country-home", "no-link");
          layer.setStyle({ color: getVar("--land-line"), weight: 0.7, fillColor: getVar("--land"), fillOpacity: 1 });
          layer.unbindTooltip();
        }
      });
    }

    if (isPoints) {
      map.addLayer(markerLayer);
      markerLayer.clearLayers();
      currentMarkers.forEach((m) => {
        if (!visibleInYear(m.__item)) return;
        const can = clickable(m.__item);
        m.bindTooltip(tip(m.__item.name, m.__meta, can, m.__item.note),
          { className: "tt", direction: "top", opacity: 1, sticky: false });
        markerLayer.addLayer(m);
        const el = m.getElement && m.getElement();
        if (el) el.classList.toggle("no-link", !can);
      });
    } else {
      map.removeLayer(markerLayer);
    }

    updateStats();
    updateSlider();
    updateLegend();
    updateYearList();
  }

  function nounOf(lyr) {
    return lyr.noun || { one: (lyr.label || "").toLowerCase(), many: (lyr.label || "").toLowerCase() };
  }

  function updateStats() {
    const lyr = activeLayer();
    const big = $("#statBig"), sub = $("#statSub");
    const visible = (lyr.items || []).filter((x) => !x.home && visibleInYear(x));
    const n = new Set(visible.map((x) => x.name)).size;
    const noun = nounOf(lyr);
    big.innerHTML = `<em>${n}</em> ${n === 1 ? noun.one : noun.many}`;
    if (lyr.metric) {
      const hi = visible.reduce((a, b) => Math.max(a, Number(b[lyr.metric.key]) || 0), 0);
      sub.textContent = hi ? `highest · ${hi.toLocaleString()}${lyr.metric.suffix || ""}` : "";
    } else if (year === ALL) {
      sub.textContent = lyr.subAll || "";
    } else {
      sub.textContent = lyr.subYear ? lyr.subYear.replace("{year}", year) : "in " + year;
    }
  }

  function updateLegend() {
    const lyr = activeLayer();
    const l = $("#legend");
    if (lyr.type === "regions") {
      const hasHome = (lyr.items || []).some((x) => x.home);
      l.innerHTML = `<span class="dot"></span> visited` + (hasHome ? ` &nbsp; <span class="dot home"></span> home` : "");
    } else {
      l.innerHTML = `<span class="dot pin-dot"></span> ${(lyr.label || "").toLowerCase()}`;
    }
  }

  function updateYearList() {
    const box = $("#yearList");
    if (!box) return;
    if (year === ALL) { box.classList.remove("show"); box.innerHTML = ""; return; }
    const lyr = activeLayer();
    const noun = nounOf(lyr);
    const list = (lyr.items || [])
      .filter((x) => (lyr.type !== "regions" || !x.home) && visibleInYear(x))
      .slice().sort((a, b) => a.name.localeCompare(b.name));
    const rows = list.map((item) => {
      const can = clickable(item);
      const m = lyr.metric;
      const meta = m && item[m.key] != null && item[m.key] !== "" ? `<span class="yl-meta">${item[m.key]}${m.suffix || ""}</span>` : "";
      return `<button class="yl-row${can ? "" : " no-link"}" data-name="${encodeURIComponent(item.name)}">` +
             `<span class="yl-name">${item.name}</span>${meta}${can ? '<span class="yl-go">→</span>' : ""}</button>`;
    }).join("");
    box.innerHTML =
      `<div class="yl-head">${year}<span>${list.length} ${list.length === 1 ? noun.one : noun.many}</span></div>` +
      `<div class="yl-body">${rows || '<div class="yl-empty">nothing this year</div>'}</div>`;
    box.classList.add("show");
    box.querySelectorAll(".yl-row").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = (lyr.items || []).find((x) => x.name === decodeURIComponent(btn.dataset.name));
        const url = item && linkAtYear(item);
        if (url) window.open(url, "_blank", "noopener");
      });
    });
  }

  function updateSlider() {
    const label = $("#yearNow");
    if (!label) return;
    if (year === ALL) { label.className = "year-now all"; label.innerHTML = `<em>All years</em>`; }
    else { label.className = "year-now"; label.textContent = year; }
    document.querySelectorAll(".ticks button").forEach((b) => {
      b.classList.toggle("on", Number(b.dataset.v) === year);
    });
    $("#range").value = year;
  }

  function setTab(next) {
    activeId = next;
    const lyr = activeLayer();
    document.querySelectorAll(".tab").forEach((t) =>
      t.setAttribute("aria-selected", String(t.dataset.tab === next)));

    const consoleEl = $(".console");
    const isPlaces = lyr.type === "places";
    consoleEl.classList.toggle("mode-places", isPlaces);
    map.removeLayer(markerLayer);
    if (shownPlaces) { map.removeLayer(shownPlaces); shownPlaces = null; }
    setTerrain(false);

    if (isPlaces) {
      clearRegionHighlights();
      ensurePlaces(lyr);
      shownPlaces = lyr.__group;
      map.addLayer(lyr.__group);
      buildThemes(lyr);
      map.flyToBounds(L.latLngBounds(lyr.bounds), { duration: .6 });
      return;
    }

    year = (TIMELINE && lyr.type === "points") ? maxYear : ALL;
    configureSlider(lyr);
    if (lyr.type === "points") buildMarkers(lyr);
    paint();
    frameCurrent();
  }

  function blogIcon() {
    return L.divIcon({
      className: "pin blog-pin",
      html: `<svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="7"
        fill="url(#foxGrad)" stroke="#2f74b5" stroke-width="1.4"/><circle cx="11" cy="11" r="2.4"
        fill="#fff" opacity=".92"/></svg>`,
      iconSize: [22, 22], iconAnchor: [11, 11], tooltipAnchor: [0, -10],
    });
  }
  function ensurePlaces(lyr) {
    if (lyr.__group) return;
    lyr.__group = L.layerGroup();
    (lyr.groups || []).forEach((p) => {
      const m = L.marker(p.coords, { icon: blogIcon(), riseOnHover: true, keyboard: false });
      const links = (p.posts || []).map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`).join("");
      m.bindPopup(`<div class="blog-pop"><div class="bp-title">${p.name}</div><div class="bp-links">${links}</div></div>`,
        { className: "blog-popup", closeButton: true, minWidth: 150, maxWidth: 240 });
      m.bindTooltip(p.name, { className: "tt", direction: "top", opacity: 1 });
      lyr.__group.addLayer(m);
    });
  }
  function buildThemes(lyr) {
    const box = $("#themes");
    if (!box || box.dataset.built === lyr.id) return;
    box.dataset.built = lyr.id;
    const groups = (lyr.themes || []).map((t) =>
      `<div class="th-group"><div class="th-name">${t.name}</div>` +
      (t.posts || []).map(([title, u]) => `<a class="th-link" href="${u}" target="_blank" rel="noopener">${title}</a>`).join("") +
      `</div>`).join("");
    box.innerHTML = `<div class="yl-head">${lyr.label}<span>${(lyr.groups || []).length} areas</span></div>` +
      `<div class="yl-body th-body">${groups}</div>`;
  }
  function clearRegionHighlights() {
    if (!countriesLayer) return;
    countriesLayer.eachLayer((layer) => {
      const el = layer.getElement && layer.getElement();
      if (el) el.classList.remove("country-visited", "country-home", "no-link");
      layer.setStyle({ color: getVar("--land-line"), weight: 0.7, fillColor: getVar("--land"), fillOpacity: 1 });
      layer.unbindTooltip();
    });
  }

  function frameCurrent() {
    const lyr = activeLayer();
    if (year === ALL) { map.flyToBounds(WORLD, { duration: .5 }); return; }
    let bounds = null;
    if (lyr.type === "regions") {
      if (countriesLayer) countriesLayer.eachLayer((l) => {
        const rec = l.feature.__rec;
        if (rec && !rec.home && visibleInYear(rec)) {
          const b = l.getBounds();
          bounds = bounds ? bounds.extend(b) : L.latLngBounds(b.getSouthWest(), b.getNorthEast());
        }
      });
    } else {
      const pts = (lyr.items || []).filter(visibleInYear).map((x) => x.coords);
      if (pts.length) bounds = L.latLngBounds(pts);
    }
    if (bounds && bounds.isValid()) map.flyToBounds(bounds.pad(0.35), { duration: .6, maxZoom: 6 });
    else map.flyToBounds(WORLD, { duration: .5 });
  }

  function yearsForLayer(lyr) {
    const s = new Set();
    (lyr.items || []).forEach((x) => (x.years || []).forEach((y) => s.add(y)));
    return [...s].sort((a, b) => a - b);
  }

  function buildTicks(lyr) {
    const ticks = $("#ticks");
    ticks.innerHTML = "";
    const present = new Set(yearsForLayer(lyr));
    const ys = [...present].sort((a, b) => a - b);
    const lo = ys.length ? ys[0] : minYear;
    const step = Math.max(1, Math.ceil((maxYear - lo) / 6));
    for (let y = lo; y <= maxYear; y++) {
      const b = document.createElement("button");
      b.textContent = y; b.title = y; b.dataset.v = y;
      if (present.has(y)) b.addEventListener("click", () => { year = y; paint(); frameCurrent(); });
      else b.classList.add("off");
      if ((y - lo) % step !== 0 && y !== maxYear) b.classList.add("minor");
      ticks.appendChild(b);
    }
    const all = document.createElement("button");
    all.textContent = "All"; all.className = "all"; all.dataset.v = ALL;
    all.addEventListener("click", () => { year = ALL; paint(); frameCurrent(); });
    ticks.appendChild(all);
  }

  function configureSlider(lyr) {
    if (!TIMELINE) { year = ALL; return; }
    buildTicks(lyr);
    const ys = yearsForLayer(lyr);
    const tMin = ys.length ? ys[0] : minYear;
    const range = $("#range");
    range.min = tMin; range.max = ALL; range.step = 1;
    if (year !== ALL && (year < tMin || year > maxYear)) year = ALL;
    range.value = year;
    updateSlider();
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  const cssVars = getComputedStyle(document.documentElement);
  function getVar(name) { return cssVars.getPropertyValue(name).trim(); }

  function applyConfig() {
    const title = CFG.title || CFG.owner || "map";
    const by = CFG.footerBy || title;
    const label = CFG.siteLabel || SITE.replace(/^https?:\/\//, "");
    document.title = title + (CFG.tagline ? " · " + CFG.tagline : "");

    const root = document.documentElement.style;
    if (Array.isArray(CFG.gradient) && CFG.gradient.length === 3) {
      const g = CFG.gradient;
      root.setProperty("--sky", g[0]); root.setProperty("--peri", g[1]); root.setProperty("--lav", g[2]);
      const defs = ["#foxStop0", "#foxStop1", "#foxStop2"];
      g.forEach((c, i) => { const s = $(defs[i]); if (s) s.setAttribute("stop-color", c); });
    } else if (CFG.accent) {
      root.setProperty("--peri", CFG.accent);
      ["#foxStop0", "#foxStop1", "#foxStop2"].forEach((id) => { const s = $(id); if (s) s.setAttribute("stop-color", CFG.accent); });
    }

    const name = $("#brandName"); if (name) name.textContent = title;
    const logo = $("#brandLogo");
    if (logo) { if (CFG.logo) logo.src = CFG.logo; logo.alt = title + " logo"; }
    const tagEl = $("#brandTag");
    if (tagEl && CFG.tagline) {
      const w = CFG.tagline.trim().split(/\s+/);
      const last = w.pop();
      tagEl.innerHTML = (w.length ? w.join(" ") + " " : "") + "<b>" + last + "</b>";
    } else if (tagEl) { tagEl.textContent = ""; }

    const link = $("#siteLink");
    if (link) {
      if (HAS_SITE) { link.href = SITE + "/"; link.textContent = label + " ↗"; }
      link.style.display = HAS_SITE ? "" : "none";
    }
    const foot = $(".foot");
    if (foot) {
      // Always credit the builder's author (belleelene), then the map's own owner.
      let html = 'Built by <a href="https://belleelene.com/" target="_blank" rel="noopener">belleelene</a>';

      if (by && by.trim().toLowerCase() !== "belleelene") {
        html += HAS_SITE
          ? ` · Edits by <a href="${SITE}/" target="_blank" rel="noopener">${by}</a>`
          : ` · Edits by ${by}`;
      }

      html += ` · Make your <a href="builder.html"> own map</a>`;

      foot.innerHTML = `<span>${html}.</span>`;
    }
    renderCards();
  }

  function renderCards() {
    const box = $("#extras");
    if (!box) return;
    const cards = CFG.cards || [];
    if (!cards.length) { box.style.display = "none"; box.innerHTML = ""; return; }
    box.style.display = "";
    box.innerHTML =
      (CFG.cardsTitle ? `<h2 class="section-title">${CFG.cardsTitle}</h2>` : "") +
      `<div class="cards">` +
      cards.map((c) =>
        `<a class="card" href="${c.href}" target="_blank" rel="noopener">` +
        (c.emoji ? `<div class="emoji">${c.emoji}</div>` : "") +
        `<h3>${c.title || ""}</h3><p>${c.text || ""}</p>` +
        (c.cta ? `<span class="go">${c.cta}</span>` : "") + `</a>`).join("") +
      `</div>`;
  }

  const ICONS = window.MAP_ICONS || {};
  function tabIcon(icon) {
    if (icon && ICONS[icon])
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[icon]}</svg>`;
    return icon ? `<span class="tab-ico">${icon}</span>` : "";
  }
  function buildTabs() {
    const tabsEl = $(".tabs");
    if (!tabsEl) return;
    tabsEl.innerHTML = LAYERS.map((l, i) =>
      `<button class="tab" role="tab" data-tab="${l.id}" aria-selected="${i === 0}">` +
      tabIcon(l.icon) + `${l.label || l.id}</button>`).join("");
    tabsEl.querySelectorAll(".tab").forEach((t) =>
      t.addEventListener("click", () => setTab(t.dataset.tab)));
  }

  function init() {
    applyConfig();
    buildTabs();

    if (!TIMELINE) { const s = $(".slider"); if (s) s.style.display = "none"; }
    const range = $("#range");
    if (range) {
      range.addEventListener("input", () => { year = Number(range.value); paint(); });
      range.addEventListener("change", () => { year = Number(range.value); frameCurrent(); });
    }

    if (activeId) setTab(activeId);

    window.addEventListener("resize", () => map.invalidateSize());
    setTimeout(() => map.invalidateSize(), 200);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
