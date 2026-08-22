/* ============================================================================
   YOUR TRAVELS  —  this is the only file you need to edit.
   ----------------------------------------------------------------------------
   • Add / remove entries in COUNTRIES, MOUNTAINS and ISLANDS below.
   • "years" is a list — put every year you visited (repeat visits welcome).
   • "url" is your blog post link. Leave "" for now; fill it in whenever.
   • Countries are matched by name (see the friendly aliases at the bottom —
     "USA", "UK", "Korea" etc. all work). Everything is sample data for now.
   ============================================================================ */

const TRAVELS = {
  meta: {
    name: "belleelene",
    tagline: "a map of my wanderings",
    // Your existing deep-dive maps (shown as cards further down the page):
    links: {
      hiking: "https://foxelas.github.io/belleelene-interactive-map/hiking",
      japan:  "https://foxelas.github.io/belleelene-interactive-map/",
      site:   "https://belleelene.com/",
    },
  },

  // ── Countries of the world ────────────────────────────────────────────────
  countries: [
    { name: "Greece",         years: [2016, 2017, 2018, 2019, 2020, 2021, 2022], url: "" },
    { name: "Japan",          years: [2018, 2023],       url: "https://belleelene.com/" },
    { name: "Italy",          years: [2016, 2019],       url: "" },
    { name: "France",         years: [2017],             url: "" },
    { name: "Spain",          years: [2018],             url: "" },
    { name: "Portugal",       years: [2022],             url: "" },
    { name: "Germany",        years: [2017, 2019],       url: "" },
    { name: "Netherlands",    years: [2019],             url: "" },
    { name: "United Kingdom", years: [2016, 2021],       url: "" },
    { name: "Switzerland",    years: [2019],             url: "" },
    { name: "Austria",        years: [2019],             url: "" },
    { name: "Czechia",        years: [2018],             url: "" },
    { name: "Croatia",        years: [2020],             url: "" },
    { name: "Turkey",         years: [2017, 2022],       url: "" },
    { name: "Morocco",        years: [2021],             url: "" },
    { name: "Egypt",          years: [2018],             url: "" },
    { name: "Thailand",       years: [2019],             url: "" },
    { name: "Vietnam",        years: [2019],             url: "" },
    { name: "South Korea",    years: [2023],             url: "" },
    { name: "USA",            years: [2016, 2024],       url: "" },
  ],

  // ── Mountains & summits ───────────────────────────────────────────────────
  // coords are [latitude, longitude].  elevation in metres (optional).
  mountains: [
    { name: "Mytikas · Mt Olympus", coords: [40.0885, 22.3583], elevation: 2917, country: "Greece", years: [2019], url: "" },
    { name: "Mt Fuji",              coords: [35.3606, 138.7274], elevation: 3776, country: "Japan",  years: [2023], url: "https://belleelene.com/" },
    { name: "Smolikas",             coords: [40.0900, 20.9200],  elevation: 2637, country: "Greece", years: [2021], url: "" },
    { name: "Psiloritis · Ida",     coords: [35.2380, 24.7710],  elevation: 2456, country: "Greece", years: [2017], url: "" },
    { name: "Parnassus",            coords: [38.5350, 22.5850],  elevation: 2457, country: "Greece", years: [2018], url: "" },
    { name: "Taygetus",             coords: [37.0170, 22.3560],  elevation: 2407, country: "Greece", years: [2020], url: "" },
    { name: "Mt Takao",             coords: [35.6250, 139.2430], elevation: 599,  country: "Japan",  years: [2023], url: "" },
  ],

  // ── Islands ───────────────────────────────────────────────────────────────
  islands: [
    { name: "Nisyros",              coords: [36.5830, 27.1660], country: "Greece", years: [2022], url: "" },
    { name: "Naxos",                coords: [37.1000, 25.4400], country: "Greece", years: [2016], url: "" },
    { name: "Santorini",            coords: [36.4200, 25.4300], country: "Greece", years: [2018], url: "" },
    { name: "Crete",                coords: [35.2400, 24.8000], country: "Greece", years: [2017], url: "" },
    { name: "Rhodes",               coords: [36.1600, 27.9200], country: "Greece", years: [2019], url: "" },
    { name: "Corfu",                coords: [39.6200, 19.9200], country: "Greece", years: [2016], url: "" },
    { name: "Miyajima · Itsukushima", coords: [34.2800, 132.3200], country: "Japan", years: [2023], url: "https://belleelene.com/" },
    { name: "Okinawa",              coords: [26.3400, 127.8000], country: "Japan",  years: [2023], url: "" },
  ],
};

/* Friendly country-name aliases → the names used by the world map data.
   Add your own on the left if you ever type a name that doesn't light up. */
const COUNTRY_ALIASES = {
  "usa": "United States of America",
  "us": "United States of America",
  "united states": "United States of America",
  "america": "United States of America",
  "uk": "United Kingdom",
  "britain": "United Kingdom",
  "great britain": "United Kingdom",
  "england": "United Kingdom",
  "korea": "South Korea",
  "south korea": "South Korea",
  "north korea": "North Korea",
  "czech republic": "Czechia",
  "uae": "United Arab Emirates",
  "ivory coast": "Côte d'Ivoire",
  "bosnia": "Bosnia and Herz.",
  "north macedonia": "Macedonia",
  "drc": "Dem. Rep. Congo",
  "dr congo": "Dem. Rep. Congo",
  "swaziland": "eSwatini",
  "east timor": "Timor-Leste",
  "burma": "Myanmar",
};
