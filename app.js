(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const norm = (s) => String(s).trim().toLowerCase();

  function canonicalCountry(name) {
    const n = norm(name);
    if (COUNTRY_ALIASES[n]) return COUNTRY_ALIASES[n];
    return name;
  }

  const countryIndex = {};
  TRAVELS.countries.forEach((c) => {
    const key = norm(canonicalCountry(c.name));
    countryIndex[key] = { years: c.years || [], url: c.url || "", links: c.links || null, home: !!c.home, label: c.name };
  });

  const allYears = new Set();
  const collect = (arr) => arr.forEach((x) => (x.years || []).forEach((y) => allYears.add(y)));
  collect(TRAVELS.countries); collect(TRAVELS.mountains); collect(TRAVELS.islands);
  const years = [...allYears].sort((a, b) => a - b);
  const minYear = years[0], maxYear = years[years.length - 1];
  const ALL = maxYear + 1;

  let tab = "countries";
  let year = ALL;

  const visibleInYear = (item) =>
    year === ALL ? (item.years && item.years.length > 0)
                 : (item.years || []).includes(year);

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
  map.zoomControl.setPosition("topright");
  map.createPane("terrain");
  map.getPane("terrain").style.zIndex = 250; // above the base, below the country outlines
  const WORLD = L.latLngBounds([[-58, -172], [80, 192]]);
  map.fitBounds(WORLD);

  let countriesLayer = null;
  const markerLayer = L.layerGroup();
  let currentMarkers = [];

  const terrainLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}", {
    pane: "terrain", maxZoom: 13, opacity: 0.85, noWrap: true, className: "terrain-tiles",
    bounds: [[-85.05, -180], [85.05, 180]],
    attribution: "Shaded relief © Esri",
  });
  function setTerrain(on) {
    if (on && !map.hasLayer(terrainLayer)) terrainLayer.addTo(map);
    if (!on && map.hasLayer(terrainLayer)) map.removeLayer(terrainLayer);
  }

  function tip(name, meta, hasUrl) {
    return `<div class="tt-name">${name}</div>` +
           (meta ? `<div class="tt-meta">${meta}</div>` : "") +
           (hasUrl ? `<div class="tt-go">read the article →</div>` : "");
  }

  function linkAtYear(item) {
    if (!item) return "";
    if (item.links) return item.links[year] || "";
    return item.url || "";
  }
  function allYearLinks(item) {
    const out = [];
    if (item && item.links) {
      Object.keys(item.links).forEach((y) => { if (item.links[y]) out.push({ year: +y, url: item.links[y] }); });
    } else if (item && item.url) {
      out.push({ year: null, url: item.url });
    }
    return out.sort((a, b) => (a.year || 0) - (b.year || 0));
  }
  function clickable(item) {
    return year === ALL ? allYearLinks(item).length > 0 : !!linkAtYear(item);
  }

  function handleClick(item, latlng) {
    if (year !== ALL) {
      const url = linkAtYear(item);
      if (url) window.open(url, "_blank", "noopener");
      return;
    }
    const opts = allYearLinks(item);
    if (opts.length === 0) return;
    if (opts.length === 1) { window.open(opts[0].url, "_blank", "noopener"); return; }
    const html = `<div class="chooser">` +
      opts.map((o) => `<a href="${o.url}" target="_blank" rel="noopener">${o.year} &rarr;</a>`).join("") +
      `</div>`;
    // defer so the click that opened it doesn't also close it (closePopupOnClick)
    setTimeout(() => {
      L.popup({ className: "chooser-popup", closeButton: false, offset: [0, 2] })
        .setLatLng(latlng).setContent(html).openOn(map);
    }, 0);
  }

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
            layer.on("click", (e) => {
              if (tab !== "countries") return;
              layer.closeTooltip();
              handleClick(rec, e.latlng);
            });
          }
        },
      }).addTo(map);
      setTerrain(tab === "terrain");
      paint();
    })
    .catch((err) => {
      console.error("Could not load world.geojson", err);
      toast("Map data failed to load — are you running from a server?");
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
      m.__meta = kind === "mountains"
        ? [item.elevation ? item.elevation + " m" : null, item.country].filter(Boolean).join(" · ")
        : [item.country].filter(Boolean).join(" · ");
      m.on("click", () => { m.closeTooltip(); handleClick(item, m.getLatLng()); });
      m.__item = item;
      currentMarkers.push(m);
    });
  }

  function paint() {
    if (countriesLayer) {
      countriesLayer.eachLayer((layer) => {
        const rec = layer.feature.__rec;
        const el = layer.getElement && layer.getElement();
        const isHome = rec && rec.home;
        const on = rec && (isHome || visibleInYear(rec));
        if (tab === "countries" && on) {
          const can = clickable(rec);
          if (isHome) {
            layer.setStyle({ color: getVar("--home-line"), weight: 1 });
            if (el) { el.classList.add("country-home"); el.classList.remove("country-visited"); el.classList.toggle("no-link", !can); }
            layer.bindTooltip(tip(rec.label, "home", can),
              { className: "tt", direction: "top", sticky: false, opacity: 1 });
          } else {
            layer.setStyle({ color: getVar("--deep"), weight: 1 });
            if (el) { el.classList.add("country-visited"); el.classList.remove("country-home"); el.classList.toggle("no-link", !can); }
            const metaText = year === ALL ? "visited " + rec.years.join(", ") : "";
            layer.bindTooltip(tip(rec.label, metaText, can),
              { className: "tt", direction: "top", sticky: false, opacity: 1 });
          }
        } else {
          if (el) el.classList.remove("country-visited", "country-home", "no-link");
          if (tab === "terrain")
            layer.setStyle({ color: getVar("--terrain-line"), weight: 0.8, fillOpacity: 0 });
          else
            layer.setStyle({ color: getVar("--land-line"), weight: 0.7,
              fillColor: getVar("--land"), fillOpacity: 1 });
          layer.unbindTooltip();
        }
      });
    }

    if (tab === "mountains" || tab === "islands") {
      map.addLayer(markerLayer);
      markerLayer.clearLayers();
      currentMarkers.forEach((m) => {
        if (!visibleInYear(m.__item)) return;
        const can = clickable(m.__item);
        m.bindTooltip(tip(m.__item.name, m.__meta, can),
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

  function updateStats() {
    const big = $("#statBig"), sub = $("#statSub");
    const uniq = (list) => new Set(list.map((x) => x.name)).size;
    if (tab === "countries") {
      const n = uniq(TRAVELS.countries.filter((c) => !c.home && visibleInYear(c)));
      big.innerHTML = `<em>${n}</em> ${n === 1 ? "country" : "countries"}`;
      sub.textContent = year === ALL ? "everywhere I've set foot" : `visited in ${year}`;
    } else if (tab === "mountains") {
      const list = TRAVELS.mountains.filter(visibleInYear);
      const n = uniq(list);
      const hi = list.reduce((a, b) => Math.max(a, b.elevation || 0), 0);
      big.innerHTML = `<em>${n}</em> ${n === 1 ? "summit" : "summits"}`;
      sub.textContent = hi ? `highest · ${hi.toLocaleString()} m` : "peaks climbed";
    } else {
      const n = uniq(TRAVELS.islands.filter(visibleInYear));
      big.innerHTML = `<em>${n}</em> ${n === 1 ? "island" : "islands"}`;
      sub.textContent = year === ALL ? "islands wandered" : `wandered in ${year}`;
    }
  }

  function updateLegend() {
    const l = $("#legend");
    if (tab === "countries") { l.innerHTML = `<span class="dot"></span> visited &nbsp; <span class="dot home"></span> home`; }
    else if (tab === "mountains") { l.innerHTML = `<span class="dot pin-dot"></span> summits`; }
    else { l.innerHTML = `<span class="dot pin-dot"></span> islands`; }
  }

  function updateYearList() {
    const box = $("#yearList");
    if (!box) return;
    if (year === ALL) { box.classList.remove("show"); box.innerHTML = ""; return; }
    const src = tab === "countries" ? TRAVELS.countries
              : tab === "mountains" ? TRAVELS.mountains : TRAVELS.islands;
    const noun = tab === "countries" ? "country" : tab === "mountains" ? "summit" : "island";
    const plural = tab === "countries" ? "countries" : noun + "s";
    const list = src.filter((x) => (tab !== "countries" || !x.home) && visibleInYear(x))
      .slice().sort((a, b) => a.name.localeCompare(b.name));
    const rows = list.map((item) => {
      const can = clickable(item);
      const meta = tab === "mountains" && item.elevation ? `<span class="yl-meta">${item.elevation} m</span>` : "";
      return `<button class="yl-row${can ? "" : " no-link"}" data-name="${encodeURIComponent(item.name)}">` +
             `<span class="yl-name">${item.name}</span>${meta}${can ? '<span class="yl-go">→</span>' : ""}</button>`;
    }).join("");
    box.innerHTML =
      `<div class="yl-head">${year}<span>${list.length} ${list.length === 1 ? noun : plural}</span></div>` +
      `<div class="yl-body">${rows || '<div class="yl-empty">nothing this year</div>'}</div>`;
    box.classList.add("show");
    box.querySelectorAll(".yl-row").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = src.find((x) => x.name === decodeURIComponent(btn.dataset.name));
        const url = item && linkAtYear(item);
        if (url) window.open(url, "_blank", "noopener");
      });
    });
  }

  function updateSlider() {
    const label = $("#yearNow");
    if (year === ALL) { label.className = "year-now all"; label.innerHTML = `<em>All years</em>`; }
    else { label.className = "year-now"; label.textContent = year; }
    document.querySelectorAll(".ticks button").forEach((b) => {
      b.classList.toggle("on", Number(b.dataset.v) === year);
    });
    $("#range").value = year;
  }

  function setTab(next) {
    tab = next;
    document.querySelectorAll(".tab").forEach((t) =>
      t.setAttribute("aria-selected", String(t.dataset.tab === next)));

    const consoleEl = document.querySelector(".console");
    const isJapan = next === "japanblog";
    consoleEl.classList.toggle("mode-japan", isJapan);
    consoleEl.classList.toggle("terrain-on", next === "terrain");
    map.removeLayer(markerLayer);
    if (isJapan) {
      setTerrain(false);
      clearCountryHighlights();
      ensureJapanBlog();
      map.addLayer(japanBlogLayer);
      buildThemesPanel();
      map.flyToBounds(L.latLngBounds(JAPAN_BLOG.bounds), { duration: .6 });
      return;
    }
    if (japanBlogLayer) map.removeLayer(japanBlogLayer);
    setTerrain(next === "terrain");

    configureSlider(next);
    if (next === "mountains") buildMarkers("mountains");
    if (next === "islands") buildMarkers("islands");
    paint();
    frameCurrent();
  }

  let japanBlogLayer = null;
  function blogIcon() {
    return L.divIcon({
      className: "pin blog-pin",
      html: `<svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="7"
        fill="url(#foxGrad)" stroke="#2f74b5" stroke-width="1.4"/><circle cx="11" cy="11" r="2.4"
        fill="#fff" opacity=".92"/></svg>`,
      iconSize: [22, 22], iconAnchor: [11, 11], tooltipAnchor: [0, -10],
    });
  }
  function ensureJapanBlog() {
    if (japanBlogLayer) return;
    japanBlogLayer = L.layerGroup();
    JAPAN_BLOG.prefectures.forEach((p) => {
      const m = L.marker(p.coords, { icon: blogIcon(), riseOnHover: true, keyboard: false });
      const links = p.posts.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`).join("");
      m.bindPopup(`<div class="blog-pop"><div class="bp-title">${p.name}</div><div class="bp-links">${links}</div></div>`,
        { className: "blog-popup", closeButton: true, minWidth: 150, maxWidth: 240 });
      m.bindTooltip(p.name, { className: "tt", direction: "top", opacity: 1 });
      japanBlogLayer.addLayer(m);
    });
  }
  function buildThemesPanel() {
    const box = $("#themes");
    if (!box || box.dataset.built) return;
    box.dataset.built = "1";
    const groups = JAPAN_BLOG.themes.map((t) =>
      `<div class="th-group"><div class="th-name">${t.name}</div>` +
      t.posts.map(([title, u]) => `<a class="th-link" href="${u}" target="_blank" rel="noopener">${title}</a>`).join("") +
      `</div>`).join("");
    box.innerHTML = `<div class="yl-head">Japan blog<span>${JAPAN_BLOG.prefectures.length} areas</span></div>` +
      `<div class="yl-body th-body">${groups}</div>`;
  }
  function clearCountryHighlights() {
    if (!countriesLayer) return;
    countriesLayer.eachLayer((layer) => {
      const el = layer.getElement && layer.getElement();
      if (el) el.classList.remove("country-visited", "country-home", "no-link");
      layer.setStyle({ color: getVar("--land-line"), weight: 0.7, fillColor: getVar("--land"), fillOpacity: 1 });
      layer.unbindTooltip();
    });
  }

  function frameCurrent() {
    if (year === ALL) { map.flyToBounds(WORLD, { duration: .5 }); return; }
    let bounds = null;
    if (tab === "countries") {
      if (countriesLayer) countriesLayer.eachLayer((l) => {
        const rec = l.feature.__rec;
        if (rec && !rec.home && visibleInYear(rec)) {
          const b = l.getBounds();
          bounds = bounds ? bounds.extend(b) : L.latLngBounds(b.getSouthWest(), b.getNorthEast());
        }
      });
    } else {
      const src = tab === "mountains" ? TRAVELS.mountains : TRAVELS.islands;
      const pts = src.filter(visibleInYear).map((x) => x.coords);
      if (pts.length) bounds = L.latLngBounds(pts);
    }
    if (bounds && bounds.isValid()) map.flyToBounds(bounds.pad(0.35), { duration: .6, maxZoom: 6 });
    else map.flyToBounds(WORLD, { duration: .5 });
  }

  function yearsForTab(t) {
    const src = t === "mountains" ? TRAVELS.mountains
              : t === "islands" ? TRAVELS.islands : TRAVELS.countries;
    const s = new Set();
    src.forEach((x) => (x.years || []).forEach((y) => s.add(y)));
    return [...s].sort((a, b) => a - b);
  }

  function buildTicks(t) {
    const ticks = $("#ticks");
    ticks.innerHTML = "";
    const present = new Set(yearsForTab(t));
    const ys = [...present].sort((a, b) => a - b);
    const lo = ys.length ? ys[0] : minYear;
    const step = Math.max(1, Math.ceil((maxYear - lo) / 6)); // ~6 labels shown on mobile
    for (let y = lo; y <= maxYear; y++) {
      const b = document.createElement("button");
      b.textContent = y; b.title = y; b.dataset.v = y;
      if (present.has(y)) {
        b.addEventListener("click", () => { year = y; paint(); frameCurrent(); });
      } else {
        b.classList.add("off");
      }
      if ((y - lo) % step !== 0 && y !== maxYear) b.classList.add("minor");
      ticks.appendChild(b);
    }
    const all = document.createElement("button");
    all.textContent = "All"; all.className = "all"; all.dataset.v = ALL;
    all.addEventListener("click", () => { year = ALL; paint(); frameCurrent(); });
    ticks.appendChild(all);
  }

  function configureSlider(t) {
    buildTicks(t);
    const ys = yearsForTab(t);
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

  function init() {
    document.querySelectorAll(".tab").forEach((t) =>
      t.addEventListener("click", () => setTab(t.dataset.tab)));

    const range = $("#range");
    range.addEventListener("input", () => { year = Number(range.value); paint(); });
    range.addEventListener("change", () => { year = Number(range.value); frameCurrent(); });

    configureSlider("countries");

    window.addEventListener("resize", () => map.invalidateSize());
    setTimeout(() => map.invalidateSize(), 200);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
