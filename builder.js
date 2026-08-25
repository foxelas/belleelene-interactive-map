(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const el = (id) => document.getElementById(id);
  const KEY = "MAP_BUILDER";

  const EMOJIS = ("📍 ⛰️ 🏝️ ⛩️ 🌍 🗺️ 🏔️ 🌋 🏕️ 🏞️ 🏖️ 🌲 🐾 🦊 🐻 🐺 🦅 🦉 🐋 🐬 🦈 🐢 🦎 🦋 🐝 " +
    "🦁 🐘 🦒 🦓 🦛 🐊 🦧 🦥 🦘 🐨 🐸 🦌 🦭 🐧 🦜 🦩 🐆 🐍 🕷️ 🌸 🍁 ❄️ ⭐ ❤️ 🏵️ 🔖 📷 🎨 🔬").split(/\s+/);

  const ICONS = window.MAP_ICONS || {};
  function iconSvg(key) {
    if (key && ICONS[key])
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">${ICONS[key]}</svg>`;
    return `<span style="font-size:15px">${esc(key || "")}</span>`;
  }
  function iconOptions(cur) {
    let opts = Object.keys(ICONS).map((k) => `<option value="${k}" ${k === cur ? "selected" : ""}>${k}</option>`).join("");
    if (cur && !ICONS[cur]) opts = `<option value="${esc(cur)}" selected>${esc(cur)} (custom)</option>` + opts;
    return opts;
  }

  function starter() {
    const P = "https://fieldnotes.example";   // placeholder links, swap for your own
    return {
      config: {
        title: "Maya's Field Atlas", tagline: "fieldwork trips & the animals I met",
        site: "", siteLabel: "", footerBy: "Maya", linkLabel: "meet the species →",
        accent: "#4e9d6b", logo: "logo.png", timeline: true,
        cardsTitle: "From the field",
        cards: [
          { emoji: "🔬", title: "Species checklist", text: "The full running list of everything recorded on these trips, by taxon.", href: P + "/checklist", cta: "Open the checklist →" },
          { emoji: "📓", title: "Field methods", text: "How the surveys were run: transects, camera traps and mist-netting notes.", href: P + "/methods", cta: "Read the methods →" },
        ],
      },
      layers: [
        { id: "animals", label: "Animals", icon: "paw", type: "points", pin: "dot",
          noun: { one: "species", many: "species" }, subAll: "species I've met",
          items: [
            { name: "Lion",                coords: [-1.48, 35.14],  group: "Kenya · Mammal",       years: [2021], icon: "🦁", url: P + "/species/lion",            note: "Pride of 12 at first light" },
            { name: "African elephant",    coords: [-2.65, 37.26],  group: "Kenya · Mammal",       years: [2021], icon: "🐘", url: P + "/species/african-elephant" },
            { name: "Red-eyed tree frog",  coords: [10.43, -84.00], group: "Costa Rica · Amphibian", years: [2022], icon: "🐸", url: P + "/species/red-eyed-tree-frog", note: "Only calling after rain" },
            { name: "Three-toed sloth",    coords: [9.39, -82.83],  group: "Costa Rica · Mammal",  years: [2022], icon: "🦥", url: P + "/species/three-toed-sloth" },
            { name: "Bornean orangutan",   coords: [-0.90, 114.02], group: "Indonesia · Mammal",   years: [2022], icon: "🦧", url: P + "/species/bornean-orangutan", note: "Mother and juvenile, 30 m up" },
            { name: "Komodo dragon",       coords: [-8.55, 119.49], group: "Indonesia · Reptile",  years: [2022], icon: "🦎", url: P + "/species/komodo-dragon" },
            { name: "Red kangaroo",        coords: [-31.20, 145.80], group: "Australia · Mammal",  years: [2023], icon: "🦘", url: P + "/species/red-kangaroo" },
            { name: "Laughing kookaburra", coords: [-28.02, 153.40], group: "Australia · Bird",    years: [2023], icon: "🦜", url: P + "/species/kookaburra" },
            { name: "Andean condor",       coords: [-13.54, -71.98], group: "Peru · Bird",         years: [2023], icon: "🦅", url: P + "/species/andean-condor",   note: "Colca Canyon thermals" },
            { name: "Ring-tailed lemur",   coords: [-22.55, 45.40],  group: "Madagascar · Mammal", years: [2024], icon: "🐒", url: P + "/species/ring-tailed-lemur" },
            { name: "Humpback whale",      coords: [69.65, 18.95],   group: "Norway · Mammal",     years: [2024], icon: "🐋", url: P + "/species/humpback-whale",  note: "Feeding on herring in the fjord" },
            { name: "Arctic fox",          coords: [70.05, 24.98],   group: "Norway · Mammal",     years: [2024], icon: "🦊", url: P + "/species/arctic-fox" },
          ] },
        { id: "trips", label: "Trips", icon: "globe", type: "regions",
          noun: { one: "country", many: "countries" },
          subAll: "everywhere I've done fieldwork", subYear: "fieldwork in {year}",
          items: [
            { name: "Kenya",      years: [2021], url: P + "/trips/kenya-2021", note: "Maasai Mara - savanna mammal survey" },
            { name: "Costa Rica", years: [2022], url: P + "/trips/costa-rica-2022", note: "Cloud-forest amphibian transects" },
            { name: "Indonesia",  years: [2022], url: P + "/trips/borneo-2022", note: "Borneo canopy work" },
            { name: "Australia",  years: [2023], url: P + "/trips/australia-2023" },
            { name: "Peru",       years: [2023], url: P + "/trips/peru-2023", note: "Andes to Amazon" },
            { name: "Madagascar", years: [2024], url: P + "/trips/madagascar-2024" },
            { name: "Norway",     years: [2024], url: P + "/trips/norway-2024", note: "Arctic coast, summer" },
          ] },
      ],
    };
  }

  let model, aliases;
  (function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && raw.model && raw.model.layers) { model = raw.model; aliases = raw.aliases || null; return; }
    } catch (e) { /* ignore */ }
    model = starter(); aliases = null;
  })();

  let dataLayerIdx = 0;

  /* ---------- persistence + preview ---------- */
  function save() {
    localStorage.setItem(KEY, JSON.stringify({ model, aliases }));
    setDot(true);
    refreshExport();
  }
  let dotTimer;
  function setDot(dirty) {
    const d = el("saveDot");
    if (dirty) { d.classList.add("dirty"); d.textContent = "saving…"; clearTimeout(dotTimer); dotTimer = setTimeout(() => { d.classList.remove("dirty"); d.textContent = "saved"; }, 500); }
  }

  function slugify(s) { return String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

  function finalize() {
    const m = JSON.parse(JSON.stringify({ config: model.config, layers: model.layers }));
    m.layers.forEach((l) => {
      if (l.type === "places" && (l.groups || []).length && !l.bounds) {
        const lats = l.groups.map((g) => g.coords[0]), lngs = l.groups.map((g) => g.coords[1]);
        l.bounds = [[Math.min(...lats) - 1, Math.min(...lngs) - 1], [Math.max(...lats) + 1, Math.max(...lngs) + 1]];
      }
    });
    return m;
  }

  function writePreview() {
    localStorage.setItem("MAP_PREVIEW", JSON.stringify(finalize()));
    if (aliases) localStorage.setItem("MAP_PREVIEW_ALIASES", JSON.stringify(aliases));
    else localStorage.removeItem("MAP_PREVIEW_ALIASES");
    const f = el("previewFrame");
    f.src = "index.html?preview=1&t=" + Date.now();
  }

  /* ---------- tabs ---------- */
  el("tabs").addEventListener("click", (e) => {
    const b = e.target.closest(".tab"); if (!b) return;
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === b));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + b.dataset.panel));
    if (b.dataset.panel === "preview") writePreview();
    if (b.dataset.panel === "export") refreshExport();
    if (b.dataset.panel === "data") { populateDataSelect(); renderData(); }
  });

  /* ---------- BRAND ---------- */
  function renderBrand() {
    const c = model.config;
    el("c-title").value = c.title || "";
    el("c-tagline").value = c.tagline || "";
    el("c-site").value = c.site || "";
    el("c-siteLabel").value = c.siteLabel || "";
    el("c-footerBy").value = c.footerBy || "";
    el("c-linkLabel").value = c.linkLabel || "";
    el("c-accent").value = c.accent || "#9db4f0";
    el("c-accentHex").value = c.accent || "#9db4f0";
    el("c-logo").value = c.logo || "";
    el("c-timeline").checked = c.timeline !== false;
    el("c-cardsTitle").value = c.cardsTitle || "";
    renderCards();
  }
  function bindBrand() {
    const map = { "c-title": "title", "c-tagline": "tagline", "c-site": "site", "c-siteLabel": "siteLabel", "c-footerBy": "footerBy", "c-linkLabel": "linkLabel", "c-logo": "logo", "c-cardsTitle": "cardsTitle" };
    Object.keys(map).forEach((id) => el(id).addEventListener("input", () => { model.config[map[id]] = el(id).value; save(); }));
    el("c-timeline").addEventListener("change", () => { model.config.timeline = el("c-timeline").checked; save(); });
    function setAccent(v) { model.config.accent = v; delete model.config.gradient; el("c-accent").value = v; el("c-accentHex").value = v; save(); }
    el("c-accent").addEventListener("input", () => setAccent(el("c-accent").value));
    el("c-accentHex").addEventListener("change", () => { const v = el("c-accentHex").value.trim(); if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) setAccent(v); });
    el("logoBtn").addEventListener("click", () => el("logoFile").click());
    el("logoFile").addEventListener("change", () => {
      const file = el("logoFile").files[0]; if (!file) return;
      const rd = new FileReader();
      rd.onload = () => { model.config.logo = rd.result; el("c-logo").value = "(uploaded image)"; save(); toast("Logo embedded"); };
      rd.readAsDataURL(file);
    });
    el("addCard").addEventListener("click", () => { (model.config.cards = model.config.cards || []).push({ emoji: "", title: "", text: "", href: "", cta: "" }); save(); renderCards(); });
  }
  function renderCards() {
    const box = el("cardsList"); box.innerHTML = "";
    (model.config.cards || []).forEach((card, i) => {
      const row = document.createElement("div"); row.className = "box"; row.style.padding = "12px"; row.style.marginBottom = "10px";
      row.innerHTML =
        `<div class="grid">
          <label class="field">Emoji <input type="text" data-f="emoji" value="${esc(card.emoji)}" style="width:64px" /></label>
          <label class="field">Title <input type="text" data-f="title" value="${esc(card.title)}" /></label>
          <label class="field">Link URL <input type="url" data-f="href" value="${esc(card.href)}" /></label>
          <label class="field">Button text <input type="text" data-f="cta" value="${esc(card.cta)}" /></label>
        </div>
        <label class="field" style="margin-top:10px">Description <textarea data-f="text">${esc(card.text)}</textarea></label>
        <div class="btn-row"><button class="btn ghost sm" data-del="1">Remove card</button></div>`;
      row.querySelectorAll("[data-f]").forEach((inp) => inp.addEventListener("input", () => { card[inp.dataset.f] = inp.value; save(); }));
      row.querySelector("[data-del]").addEventListener("click", () => { model.config.cards.splice(i, 1); save(); renderCards(); });
      box.appendChild(row);
    });
  }

  /* ---------- LAYERS ---------- */
  const TYPES = [["points", "Points (pins)"], ["regions", "Regions (countries)"], ["places", "Places (grouped + themes)"]];
  function renderLayers() {
    const box = el("layersList"); box.innerHTML = "";
    model.layers.forEach((l, i) => {
      const row = document.createElement("div"); row.className = "layer-row";
      const opts = TYPES.map(([v, t]) => `<option value="${v}" ${l.type === v ? "selected" : ""}>${t}</option>`).join("");
      row.innerHTML =
        `<span class="lico-wrap"><span class="lico-prev">${iconSvg(l.icon)}</span><select class="lico" title="tab icon">${iconOptions(l.icon)}</select></span>
         <input type="text" class="llabel" value="${esc(l.label)}" placeholder="Label" />
         <select class="ltype">${opts}</select>
         <span class="metric">${l.type === "points"
            ? `<input type="text" class="mkey" placeholder="metric" value="${esc(l.metric && l.metric.key)}" title="e.g. elevation" /><input type="text" class="msuf" placeholder="unit" value="${esc(l.metric && l.metric.suffix)}" title="e.g. &quot; m&quot;" />`
            : `<span class="muted">-</span>`}</span>
         <span class="layer-actions">
           <button class="btn ghost sm" data-up title="move up">↑</button>
           <button class="btn ghost sm" data-down title="move down">↓</button>
           <button class="btn ghost sm" data-del title="delete">✕</button>
         </span>`;
      const licoSel = row.querySelector(".lico");
      licoSel.addEventListener("change", () => { l.icon = licoSel.value; row.querySelector(".lico-prev").innerHTML = iconSvg(l.icon); save(); });
      row.querySelector(".llabel").addEventListener("input", (e) => { l.label = e.target.value; save(); });
      row.querySelector(".ltype").addEventListener("change", (e) => { changeLayerType(l, e.target.value); save(); renderLayers(); });
      const mk = row.querySelector(".mkey"), ms = row.querySelector(".msuf");
      if (mk) mk.addEventListener("input", () => { l.metric = l.metric || {}; l.metric.key = mk.value; save(); });
      if (ms) ms.addEventListener("input", () => { l.metric = l.metric || {}; l.metric.suffix = ms.value; save(); });
      row.querySelector("[data-up]").addEventListener("click", () => { if (i > 0) { model.layers.splice(i - 1, 0, model.layers.splice(i, 1)[0]); save(); renderLayers(); } });
      row.querySelector("[data-down]").addEventListener("click", () => { if (i < model.layers.length - 1) { model.layers.splice(i + 1, 0, model.layers.splice(i, 1)[0]); save(); renderLayers(); } });
      row.querySelector("[data-del]").addEventListener("click", () => {
        if (model.layers.length <= 1) { toast("Keep at least one layer"); return; }
        model.layers.splice(i, 1); if (dataLayerIdx >= model.layers.length) dataLayerIdx = 0; save(); renderLayers();
      });
      box.appendChild(row);
    });
  }
  function changeLayerType(l, type) {
    l.type = type;
    if (type === "points") { l.items = l.items || []; l.pin = l.pin || "dot"; }
    else if (type === "regions") { l.items = l.items || []; delete l.pin; delete l.metric; }
    else if (type === "places") { l.groups = l.groups || []; l.themes = l.themes || []; delete l.pin; delete l.metric; }
  }
  function newLayer() {
    let id = "layer", n = 1; const ids = new Set(model.layers.map((l) => l.id));
    while (ids.has(id + n)) n++;
    model.layers.push({ id: id + n, label: "New layer", icon: "pin", type: "points", pin: "dot", items: [] });
    save(); renderLayers();
  }
  el("addLayer").addEventListener("click", newLayer);

  /* ---------- DATA ---------- */
  function populateDataSelect() {
    const sel = el("dataLayer");
    sel.innerHTML = model.layers.map((l, i) => `<option value="${i}">${esc(l.label)} - ${l.type}</option>`).join("");
    if (dataLayerIdx >= model.layers.length) dataLayerIdx = 0;
    sel.value = dataLayerIdx;
  }
  el("dataLayer").addEventListener("change", (e) => { dataLayerIdx = Number(e.target.value); renderData(); });
  el("addRow").addEventListener("click", () => {
    const l = model.layers[dataLayerIdx];
    if (l.type === "regions") l.items.push({ name: "", years: [], url: "" });
    else if (l.type === "points") l.items.push({ name: "", coords: [0, 0], group: "", years: [], url: "", note: "" });
    else l.groups.push({ name: "", coords: [0, 0], posts: [] });
    save(); renderData();
  });

  const years2str = (a) => (a || []).join(", ");
  const str2years = (s) => [...new Set(String(s).split(/[^0-9]+/).filter(Boolean).map(Number))].sort((a, b) => a - b);
  const posts2str = (a) => (a || []).map(([t, u]) => `${t} | ${u}`).join("\n");
  const str2posts = (s) => String(s).split("\n").map((ln) => ln.split("|")).filter((p) => p[0] && p[0].trim()).map((p) => [p[0].trim(), (p[1] || "").trim()]);

  function renderData() {
    const l = model.layers[dataLayerIdx]; const box = el("dataBody"); box.innerHTML = "";
    if (!l) return;
    if (l.type === "places") return renderPlaces(l, box);
    const cols = l.type === "regions"
      ? ["Name", "Home", "Years", "Link", "Tag", "Note", ""]
      : ["Name", "Lat", "Lng", "Group", "Years", "Icon", "Link", "Note", "", ""];
    const t = document.createElement("table"); t.className = "data";
    t.innerHTML = "<thead><tr>" + cols.map((c) => `<th>${c}</th>`).join("") + "</tr></thead><tbody></tbody>";
    const tb = t.querySelector("tbody");
    l.items.forEach((it, i) => tb.appendChild(l.type === "regions" ? regionRow(l, it, i) : pointRow(l, it, i)));
    const wrap = document.createElement("div"); wrap.className = "tablewrap"; wrap.appendChild(t);
    box.appendChild(wrap);
  }

  function txt(value, oninput, cls) {
    const i = document.createElement("input"); i.type = "text"; i.value = value == null ? "" : value; if (cls) i.className = cls;
    i.addEventListener("input", () => oninput(i.value)); return i;
  }
  function cell(node, cls) { const td = document.createElement("td"); if (cls) td.className = cls; td.appendChild(node); return td; }
  function delBtn(fn) { const b = document.createElement("button"); b.className = "btn ghost sm"; b.textContent = "✕"; b.title = "delete row"; b.addEventListener("click", fn); return b; }

  function linkCell(it) {
    if (it.links && typeof it.links === "object") {
      const i = document.createElement("input"); i.type = "text"; i.value = "(per-year links)"; i.disabled = true; i.title = "This place has per-year links, edit data.js to change them.";
      return cell(i, "tight");
    }
    return cell(txt(it.url, (v) => { it.url = v; save(); }, ""), "tight");
  }

  function regionRow(l, it, i) {
    const tr = document.createElement("tr");
    tr.appendChild(cell(txt(it.name, (v) => { it.name = v; save(); })));
    const home = document.createElement("input"); home.type = "checkbox"; home.checked = !!it.home;
    home.addEventListener("change", () => { it.home = home.checked; if (it.home) delete it.years; else it.years = it.years || []; save(); });
    tr.appendChild(cell(home));
    tr.appendChild(cell(txt(years2str(it.years), (v) => { it.years = str2years(v); save(); }), "tight"));
    tr.appendChild(linkCell(it));
    tr.appendChild(cell(txt(it.tag, (v) => { it.tag = v || undefined; save(); }), "tight"));
    tr.appendChild(cell(txt(it.note, (v) => { it.note = v || undefined; save(); })));
    tr.appendChild(cell(delBtn(() => { l.items.splice(i, 1); save(); renderData(); })));
    return tr;
  }

  function pointRow(l, it, i) {
    const tr = document.createElement("tr");
    it.coords = it.coords || [0, 0];
    tr.appendChild(cell(txt(it.name, (v) => { it.name = v; save(); })));
    const lat = txt(it.coords[0], (v) => { it.coords[0] = Number(v); save(); }); lat.type = "number"; lat.step = "any";
    const lng = txt(it.coords[1], (v) => { it.coords[1] = Number(v); save(); }); lng.type = "number"; lng.step = "any";
    tr.appendChild(cell(lat, "num")); tr.appendChild(cell(lng, "num"));
    tr.appendChild(cell(txt(it.group, (v) => { it.group = v; save(); }), "tight"));
    tr.appendChild(cell(txt(years2str(it.years), (v) => { it.years = str2years(v); save(); }), "tight"));
    const ico = txt(it.icon, (v) => { it.icon = v || undefined; save(); }); ico.title = "optional emoji";
    const icoTd = cell(ico, "icon"); attachEmoji(ico, (e) => { ico.value = e; it.icon = e; save(); }); tr.appendChild(icoTd);
    tr.appendChild(linkCell(it));
    tr.appendChild(cell(txt(it.note, (v) => { it.note = v || undefined; save(); })));
    const pick = document.createElement("button"); pick.className = "btn sm"; pick.textContent = "📍"; pick.title = "pick on map";
    pick.addEventListener("click", () => openPick(it, lat, lng));
    tr.appendChild(cell(pick));
    tr.appendChild(cell(delBtn(() => { l.items.splice(i, 1); save(); renderData(); })));
    return tr;
  }

  function renderPlaces(l, box) {
    l.groups = l.groups || []; l.themes = l.themes || [];
    const gsec = document.createElement("div");
    gsec.innerHTML = `<h3 style="font-family:var(--serif);font-weight:600;margin:4px 0 8px">Markers <span class="muted" style="font-weight:400">(groups)</span></h3>`;
    const gt = document.createElement("table"); gt.className = "data";
    gt.innerHTML = "<thead><tr><th>Name</th><th>Lat</th><th>Lng</th><th>Posts (one “Title | URL” per line)</th><th></th><th></th></tr></thead><tbody></tbody>";
    const gtb = gt.querySelector("tbody");
    l.groups.forEach((g, i) => {
      g.coords = g.coords || [0, 0];
      const tr = document.createElement("tr");
      tr.appendChild(cell(txt(g.name, (v) => { g.name = v; save(); })));
      const lat = txt(g.coords[0], (v) => { g.coords[0] = Number(v); save(); }); lat.type = "number"; lat.step = "any";
      const lng = txt(g.coords[1], (v) => { g.coords[1] = Number(v); save(); }); lng.type = "number"; lng.step = "any";
      tr.appendChild(cell(lat, "num")); tr.appendChild(cell(lng, "num"));
      const ta = document.createElement("textarea"); ta.value = posts2str(g.posts); ta.rows = 2; ta.style.minWidth = "240px";
      ta.addEventListener("input", () => { g.posts = str2posts(ta.value); save(); });
      tr.appendChild(cell(ta));
      const pick = document.createElement("button"); pick.className = "btn sm"; pick.textContent = "📍"; pick.title = "pick on map";
      pick.addEventListener("click", () => openPick(g, lat, lng));
      tr.appendChild(cell(pick));
      tr.appendChild(cell(delBtn(() => { l.groups.splice(i, 1); save(); renderData(); })));
      gtb.appendChild(tr);
    });
    const gwrap = document.createElement("div"); gwrap.className = "tablewrap"; gwrap.appendChild(gt); gsec.appendChild(gwrap);
    const addG = document.createElement("button"); addG.className = "btn sm"; addG.textContent = "+ Add marker"; addG.style.marginTop = "10px";
    addG.addEventListener("click", () => { l.groups.push({ name: "", coords: [0, 0], posts: [] }); save(); renderData(); });
    gsec.appendChild(addG);

    const tsec = document.createElement("div"); tsec.style.marginTop = "22px";
    tsec.innerHTML = `<h3 style="font-family:var(--serif);font-weight:600;margin:4px 0 8px">Themes <span class="muted" style="font-weight:400">(side panel)</span></h3>`;
    const tt = document.createElement("table"); tt.className = "data";
    tt.innerHTML = "<thead><tr><th>Theme</th><th>Posts (one “Title | URL” per line)</th><th></th></tr></thead><tbody></tbody>";
    const ttb = tt.querySelector("tbody");
    l.themes.forEach((th, i) => {
      const tr = document.createElement("tr");
      tr.appendChild(cell(txt(th.name, (v) => { th.name = v; save(); })));
      const ta = document.createElement("textarea"); ta.value = posts2str(th.posts); ta.rows = 2; ta.style.minWidth = "260px";
      ta.addEventListener("input", () => { th.posts = str2posts(ta.value); save(); });
      tr.appendChild(cell(ta));
      tr.appendChild(cell(delBtn(() => { l.themes.splice(i, 1); save(); renderData(); })));
      ttb.appendChild(tr);
    });
    const twrap = document.createElement("div"); twrap.className = "tablewrap"; twrap.appendChild(tt); tsec.appendChild(twrap);
    const addT = document.createElement("button"); addT.className = "btn sm"; addT.textContent = "+ Add theme"; addT.style.marginTop = "10px";
    addT.addEventListener("click", () => { l.themes.push({ name: "", posts: [] }); save(); renderData(); });
    tsec.appendChild(addT);

    box.appendChild(gsec); box.appendChild(tsec);
  }

  /* ---------- emoji popover ---------- */
  const pop = el("emojiPop");
  pop.innerHTML = EMOJIS.map((e) => `<button type="button">${e}</button>`).join("");
  let popPick = null;
  pop.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b && popPick) { popPick(b.textContent); pop.classList.remove("show"); } });
  function attachEmoji(input, onPick) {
    input.addEventListener("focus", () => {
      const r = input.getBoundingClientRect();
      pop.style.left = Math.min(r.left, window.innerWidth - 290) + window.scrollX + "px";
      pop.style.top = r.bottom + window.scrollY + 4 + "px";
      popPick = onPick; pop.classList.add("show");
    });
  }
  document.addEventListener("click", (e) => { if (!pop.contains(e.target) && !(e.target.tagName === "INPUT" && e.target.classList.contains("icon"))) { /* keep */ } });
  document.addEventListener("mousedown", (e) => { if (!pop.contains(e.target) && !e.target.closest("td.icon")) pop.classList.remove("show"); });

  /* ---------- pick on map ---------- */
  let pickMap, pickMarker, pickTarget;
  function pickIcon() {
    return L.divIcon({
      className: "pick-pin",
      html: '<svg width="30" height="30" viewBox="0 0 24 24" fill="#4e9d6b" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"><path d="M12 22s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6" fill="#fff"/></svg>',
      iconSize: [30, 30], iconAnchor: [15, 28],
    });
  }
  function openPick(item, latInput, lngInput) {
    pickTarget = { item, latInput, lngInput };
    el("pickResults").innerHTML = ""; el("pickSearch").value = "";
    el("pickModal").classList.add("show");
    if (!pickMap) {
      pickMap = L.map("pickMap", { worldCopyJump: true }).setView([30, 10], 2);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" }).addTo(pickMap);
      pickMap.on("click", (e) => setPick(e.latlng.lat, e.latlng.lng));
    }
    setTimeout(() => pickMap.invalidateSize(), 60);
    const c = item.coords && (item.coords[0] || item.coords[1]) ? item.coords : null;
    if (c) { setPick(c[0], c[1]); pickMap.setView(c, 6); } else { el("pickCoord").textContent = "—"; if (pickMarker) { pickMap.removeLayer(pickMarker); pickMarker = null; } }
  }
  function setPick(lat, lng) {
    lat = Math.round(lat * 1e4) / 1e4; lng = Math.round(lng * 1e4) / 1e4;
    pickTarget.lat = lat; pickTarget.lng = lng;
    el("pickCoord").textContent = lat + ", " + lng;
    if (!pickMarker) pickMarker = L.marker([lat, lng], { icon: pickIcon() }).addTo(pickMap); else pickMarker.setLatLng([lat, lng]);
  }
  function geocode() {
    const q = el("pickSearch").value.trim();
    const box = el("pickResults");
    if (!q) { box.innerHTML = ""; return; }
    box.innerHTML = '<div class="muted" style="padding:6px 4px">searching…</div>';
    fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=" + encodeURIComponent(q), { headers: { "Accept-Language": "en" } })
      .then((r) => r.json())
      .then((rows) => {
        if (!rows.length) { box.innerHTML = '<div class="muted" style="padding:6px 4px">no matches, try a broader name, or click the map</div>'; return; }
        box.innerHTML = "";
        rows.forEach((r) => {
          const lat = Math.round(+r.lat * 1e4) / 1e4, lng = Math.round(+r.lon * 1e4) / 1e4;
          const b = document.createElement("button"); b.type = "button"; b.className = "pick-hit";
          b.innerHTML = `<span>${esc(r.display_name)}</span><small>${lat}, ${lng}</small>`;
          b.addEventListener("click", () => { setPick(lat, lng); pickMap.setView([lat, lng], zoomFor(r)); box.innerHTML = ""; el("pickSearch").value = r.display_name; });
          box.appendChild(b);
        });
      })
      .catch(() => { box.innerHTML = '<div class="muted" style="padding:6px 4px">search failed. Check your connection, or click the map</div>'; });
  }
  function zoomFor(r) {
    const t = r.addresstype || r.type || "";
    if (/country/.test(t)) return 4;
    if (/state|region|county/.test(t)) return 6;
    if (/city|town|island/.test(t)) return 9;
    return 11;
  }
  el("pickSearchBtn").addEventListener("click", geocode);
  el("pickSearch").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); geocode(); } });

  el("pickCancel").addEventListener("click", () => el("pickModal").classList.remove("show"));
  el("pickDone").addEventListener("click", () => {
    if (pickTarget && pickTarget.lat != null) {
      pickTarget.item.coords = [pickTarget.lat, pickTarget.lng];
      pickTarget.latInput.value = pickTarget.lat; pickTarget.lngInput.value = pickTarget.lng;
      save();
    }
    el("pickModal").classList.remove("show");
  });

  /* ---------- export / import ---------- */
  function exportText() {
    let out = "window.MAP = " + JSON.stringify(finalize(), null, 2) + ";\n";
    if (aliases && Object.keys(aliases).length) out += "\nwindow.COUNTRY_ALIASES = " + JSON.stringify(aliases, null, 2) + ";\n";
    return out;
  }
  function refreshExport() { const a = el("exportArea"); if (a) a.value = exportText(); }
  el("downloadBtn").addEventListener("click", () => {
    const blob = new Blob([exportText()], { type: "text/javascript" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "data.js"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000); toast("data.js downloaded");
  });
  el("copyBtn").addEventListener("click", () => {
    navigator.clipboard.writeText(exportText()).then(() => toast("Copied to clipboard"), () => toast("Copy failed. Select the text"));
  });
  el("importBtn").addEventListener("click", () => el("importFile").click());
  el("importFile").addEventListener("change", () => {
    const f = el("importFile").files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const sandbox = {};
        new Function("window", rd.result)(sandbox);
        if (!sandbox.MAP || !sandbox.MAP.layers) throw new Error("no window.MAP");
        model = sandbox.MAP; aliases = sandbox.COUNTRY_ALIASES || null; dataLayerIdx = 0;
        save(); renderAll(); toast("Imported " + (model.layers.length) + " layer(s)");
      } catch (err) { toast("Could not read that file"); console.error(err); }
    };
    rd.readAsText(f);
  });
  el("resetBtn").addEventListener("click", () => {
    if (!confirm("Reset the builder to a blank starter map? Your current data will be cleared.")) return;
    model = starter(); aliases = null; dataLayerIdx = 0; save(); renderAll(); toast("Reset");
  });
  el("refreshPreview").addEventListener("click", writePreview);

  /* ---------- utils ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  let toastTimer;
  function toast(m) { const t = el("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200); }

  function renderAll() { renderBrand(); renderLayers(); populateDataSelect(); renderData(); refreshExport(); }
  bindBrand();
  renderAll();
})();
