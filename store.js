/**
 * ÉTOILE data transport.
 * On the local studio (port 8765) this talks to the Python API.
 * On GitHub Pages it reads the public ledger and keeps notes in this browser.
 */
const ETOILE_OVERLAY_KEY = "etoile_user_v1";
const ETOILE_TOKEN_KEY = "etoile_gist_token";
const ETOILE_GIST_KEY = "etoile_gist_id";

const etoileUseLocalApi =
  (location.hostname === "localhost" || location.hostname === "127.0.0.1") &&
  location.port === "8765";

function etoileFold(text) {
  let s = String(text || "").replaceAll("Đ", "D").replaceAll("đ", "d");
  s = s.normalize("NFKD").replace(/\p{M}/gu, "");
  s = s.toLowerCase().replaceAll("&", " and ").replaceAll("œ", "oe").replaceAll("æ", "ae");
  s = s.replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

function etoileEmptyNote() {
  return {
    rating: 0,
    chef: "",
    highlight_dishes: [],
    wine_pairing: "",
    price_per_person: "",
    companions: "",
    notes: "",
    photos: [],
    updated_at: "",
  };
}

function etoileLoadOverlay() {
  try {
    const raw = localStorage.getItem(ETOILE_OVERLAY_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return {
      dossiers: data.dossiers || {},
      extraTimes: data.extraTimes || {},
      hiddenTimes: data.hiddenTimes || {},
      extraRestaurants: data.extraRestaurants || [],
      removed: data.removed || [],
      customCheckins: data.customCheckins || [],
      wishlist: data.wishlist || [],
    };
  } catch {
    return {
      dossiers: {},
      extraTimes: {},
      hiddenTimes: {},
      extraRestaurants: [],
      removed: [],
      customCheckins: [],
      wishlist: [],
    };
  }
}

function etoileSaveOverlay(overlay) {
  localStorage.setItem(ETOILE_OVERLAY_KEY, JSON.stringify(overlay));
}

function etoileYearlyMatrix(row) {
  const starYears = row.star_years || {};
  const green = new Set(row.green_years || []);
  const bib = new Set(row.bib_years || []);
  const plate = new Set(row.plate_years || []);
  const bestByYear = {};
  for (const b of row.best50 || []) {
    if (!b.year) continue;
    (bestByYear[b.year] || (bestByYear[b.year] = [])).push(b);
  }
  const otherByYear = {};
  for (const item of row.other_ranks || []) {
    if (!item.year) continue;
    (otherByYear[item.year] || (otherByYear[item.year] = [])).push(item);
  }
  const years = new Set();
  for (let y = 2016; y <= 2027; y += 1) years.add(y);
  for (const list of Object.values(starYears)) {
    for (const y of list || []) if (y) years.add(y);
  }
  for (const y of [...green, ...bib, ...plate]) years.add(y);
  Object.keys(bestByYear).forEach((y) => years.add(Number(y)));
  Object.keys(otherByYear).forEach((y) => years.add(Number(y)));
  const matrix = [];
  for (const y of [...years].filter((year) => year >= 1950 && year <= 2027).sort((a, b) => a - b)) {
    let stars = 0;
    for (const lv of ["3", "2", "1"]) {
      if ((starYears[lv] || []).includes(y)) stars = Math.max(stars, Number(lv));
    }
    const b50 = bestByYear[y] || [];
    const other = otherByYear[y] || [];
    if (stars || green.has(y) || bib.has(y) || plate.has(y) || b50.length || other.length) {
      matrix.push({
        year: y,
        stars,
        green: green.has(y),
        bib: bib.has(y),
        plate: plate.has(y),
        best50: b50,
        other,
      });
    }
  }
  return matrix;
}

function etoileApplyOverlay(base, overlay) {
  const removed = new Set(overlay.removed || []);
  const restaurants = (base.restaurants || [])
    .filter((r) => !removed.has(r.id))
    .map((r) => {
      const copy = JSON.parse(JSON.stringify(r));
      const extra = overlay.extraTimes[copy.id] || [];
      const hidden = new Set(overlay.hiddenTimes[copy.id] || []);
      const times = [...new Set([...(copy.times || []), ...extra])].filter((d) => !hidden.has(d)).sort();
      copy.times = times;
      copy.visit_count = Math.max(times.length, 1);
      copy.first_visit = times[0] || "";
      copy.latest_visit = times[times.length - 1] || "";
      const dossier = overlay.dossiers[copy.id];
      if (dossier) {
        copy.user_note = { ...etoileEmptyNote(), ...(copy.user_note || {}), ...dossier };
      }
      return copy;
    });

  for (const extra of overlay.extraRestaurants || []) {
    if (removed.has(extra.id) || restaurants.some((r) => r.id === extra.id)) continue;
    const copy = JSON.parse(JSON.stringify(extra));
    const dossier = overlay.dossiers[copy.id];
    if (dossier) copy.user_note = { ...etoileEmptyNote(), ...(copy.user_note || {}), ...dossier };
    restaurants.push(copy);
  }

  const visitedKeys = new Set(
    restaurants.map((r) => `${etoileFold(r.award_name)}|${(r.award_city || r.city || "").toLowerCase()}`)
  );
  const regionLeft = (base._regionItems || []).filter((item) => {
    const key = `${etoileFold(item.award_name)}|${(item.city || "").toLowerCase()}`;
    return !visitedKeys.has(key);
  });

  const summary = etoileSummarize(restaurants, base.summary || {}, regionLeft.length, overlay);
  return {
    ...base,
    summary,
    restaurants,
    cities: etoileCities(restaurants),
    chronicle: etoileChronicle(restaurants),
    custom_checkins: overlay.customCheckins || [],
    wishlist: overlay.wishlist || [],
    _regionItems: regionLeft,
  };
}

function etoileSummarize(restaurants, prev, regionCount, overlay) {
  const tiers = { 3: 0, 2: 0, 1: 0 };
  let starSum = 0;
  let bib = 0;
  let plate = 0;
  let green = 0;
  let best50 = 0;
  let xinrong = 0;
  let xinrongStars = 0;
  const cities = new Set();
  for (const r of restaurants) {
    const stars = r.max_stars || 0;
    if (tiers[stars] !== undefined) tiers[stars] += 1;
    if (stars > 0) starSum += stars;
    if (r.bib_years && r.bib_years.length && !r.is_xinrong) bib += 1;
    if (r.plate_years && r.plate_years.length && !r.is_xinrong) plate += 1;
    if (r.green_years && r.green_years.length && !r.is_xinrong) green += 1;
    if (r.best50 && r.best50.length && !r.is_xinrong) best50 += 1;
    if (r.is_xinrong) {
      xinrong += 1;
      xinrongStars += stars;
    }
    if (r.city) cities.add(r.city);
  }
  return {
    ...prev,
    total_matched: restaurants.length,
    starred_count: tiers[3] + tiers[2] + tiers[1],
    star_sum: starSum,
    tiers,
    bib_count: bib,
    plate_count: plate,
    green_count: green,
    best50_count: best50,
    xinrong_count: xinrong,
    xinrong_stars: xinrongStars,
    cities_count: cities.size,
    region_unmatched_count: regionCount,
    overseas_unmatched_count: 0,
    custom_checkin_count: (overlay.customCheckins || []).length,
    wishlist_count: (overlay.wishlist || []).length,
  };
}

function etoileCities(restaurants) {
  const grouped = {};
  for (const r of restaurants) {
    const c = r.city || "global";
    const bucket = grouped[c] || {
      city: c,
      city_zh: r.city_zh || c,
      city_en: r.city_en || c,
      country_zh: r.country_zh || "",
      region: r.region || "",
      lat: r.lat || 0,
      lng: r.lng || 0,
      total_restaurants: 0,
      total_stars: 0,
      star_3: 0,
      star_2: 0,
      star_1: 0,
      green: 0,
      bib: 0,
      plate: 0,
      best50: 0,
      top_restaurants: [],
    };
    bucket.total_restaurants += 1;
    bucket.total_stars += r.max_stars || 0;
    if (r.max_stars === 3) bucket.star_3 += 1;
    else if (r.max_stars === 2) bucket.star_2 += 1;
    else if (r.max_stars === 1) bucket.star_1 += 1;
    if (r.green_years && r.green_years.length) bucket.green += 1;
    if (r.bib_years && r.bib_years.length) bucket.bib += 1;
    if (r.plate_years && r.plate_years.length) bucket.plate += 1;
    if (r.best50 && r.best50.length) bucket.best50 += 1;
    if (bucket.top_restaurants.length < 5) {
      bucket.top_restaurants.push({
        id: r.id,
        shop: r.shop,
        award_name: r.award_name,
        max_stars: r.max_stars,
      });
    }
    grouped[c] = bucket;
  }
  return Object.values(grouped).sort(
    (a, b) => b.total_stars - a.total_stars || b.total_restaurants - a.total_restaurants || a.city_en.localeCompare(b.city_en)
  );
}

function etoileChronicle(restaurants) {
  const years = {};
  for (const r of restaurants) {
    for (const dt of r.times || []) {
      const yr = String(dt).slice(0, 4);
      if (!/^\d{4}$/.test(yr)) continue;
      const yb = years[yr] || { year: yr, visits: 0, stars_visited: 0, three_stars: 0, items: [] };
      yb.visits += 1;
      yb.stars_visited += r.max_stars || 0;
      if (r.max_stars === 3) yb.three_stars += 1;
      yb.items.push({
        date: dt,
        id: r.id,
        shop: r.shop,
        award_name: r.award_name,
        city_zh: r.city_zh,
        city_en: r.city_en,
        max_stars: r.max_stars,
        green: !!(r.green_years && r.green_years.length),
        best50: !!(r.best50 && r.best50.length),
      });
      years[yr] = yb;
    }
  }
  return Object.keys(years)
    .sort((a, b) => b.localeCompare(a))
    .map((k) => {
      years[k].items.sort((a, b) => b.date.localeCompare(a.date));
      return years[k];
    });
}

function etoileRestaurantFromCatalog(item, shop, city, date, note) {
  const awardCity = (item.c || city || "").toLowerCase();
  const awardName = item.n;
  const id = `${etoileFold(awardName)}|${(city || awardCity).toLowerCase()}`;
  const times = date ? [date] : [];
  const row = {
    id,
    shop: shop || item.z || awardName,
    award_name: awardName,
    zh_name: item.z || "",
    city: (city || awardCity).toLowerCase(),
    award_city: awardCity,
    city_zh: item.cz || awardCity,
    city_en: item.ce || awardCity,
    country_zh: item.co || "",
    region: item.rg || "",
    lat: item.la || 0,
    lng: item.ln || 0,
    address: "",
    cuisine: "",
    times,
    visit_count: Math.max(times.length, 1),
    first_visit: times[0] || "",
    latest_visit: times[times.length - 1] || "",
    match: "新增打卡",
    max_stars: item.s || 0,
    star_years: item.sy || {},
    green_years: item.gy || [],
    bib_years: item.by || [],
    plate_years: item.py || [],
    best50: item.b50 || [],
    best_rank: item.br || {},
    other_ranks: item.or || [],
    yearly_matrix: [],
    is_xinrong: /xin rong|新荣记/i.test(`${awardName} ${shop}`),
    special_note: "",
    user_note: { ...etoileEmptyNote(), ...note },
  };
  row.yearly_matrix = etoileYearlyMatrix(row);
  return row;
}

const etoile = {
  base: null,
  region: null,
  catalog: null,
  view: null,

  async request(url, opts = {}) {
    if (etoileUseLocalApi) {
      const res = await fetch(url, opts);
      return res.json();
    }
    return this.staticRequest(url, opts);
  },

  async ensureBase() {
    if (this.base) return;
    const res = await fetch("./data/bootstrap.json");
    if (!res.ok) throw new Error("bootstrap");
    this.base = await res.json();
    try {
      const regionRes = await fetch("./data/region_unmatched.json");
      if (regionRes.ok) {
        const region = await regionRes.json();
        this.base._regionItems = region.items || [];
      }
    } catch {
      this.base._regionItems = [];
    }
  },

  merged() {
    const overlay = etoileLoadOverlay();
    this.view = etoileApplyOverlay(this.base, overlay);
    return { overlay, view: this.view };
  },

  async staticRequest(url, opts) {
    await this.ensureBase();
    const parsed = new URL(url, location.origin);
    const path = parsed.pathname;
    if (path.endsWith("/api/bootstrap")) {
      return this.merged().view;
    }
    if (path.endsWith("/api/unmatched")) {
      return this.unmatched(parsed.searchParams);
    }
    if (path.endsWith("/api/awards/search")) {
      return this.search(parsed.searchParams.get("q") || "", Number(parsed.searchParams.get("limit") || 25));
    }
    const body = opts.body ? JSON.parse(opts.body) : {};
    if (path.endsWith("/api/notes")) return this.saveNotes(body);
    if (path.endsWith("/api/checkin") && (opts.method || "GET").toUpperCase() === "DELETE") {
      return this.remove(parsed.searchParams.get("id") || "");
    }
    if (path.endsWith("/api/checkin")) return this.addCheckin(body);
    return { ok: false, error: "unsupported" };
  },

  unmatched(params) {
    const { view, overlay } = this.merged();
    const q = (params.get("q") || "").trim().toLowerCase();
    const city = (params.get("city") || "").trim().toLowerCase();
    const wish = new Set(overlay.wishlist || []);
    const rows = (view._regionItems || []).map((item) => ({ ...item, wishlisted: wish.has(item.id) }));
    const cityCounts = {};
    for (const r of rows) {
      const bucket = cityCounts[r.city] || { city: r.city, city_zh: r.city_zh, city_en: r.city_en, count: 0 };
      bucket.count += 1;
      cityCounts[r.city] = bucket;
    }
    const filtered = rows.filter((r) => {
      if (city && r.city !== city) return false;
      if (!q) return true;
      return [r.award_name, r.zh_name, r.city_zh, r.area].join(" ").toLowerCase().includes(q);
    });
    return {
      total: rows.length,
      filtered_count: filtered.length,
      cities: Object.values(cityCounts).sort((a, b) => b.count - a.count),
      items: filtered.slice(0, 120),
    };
  },

  async search(q, limit) {
    if (!this.catalog) {
      const res = await fetch("./data/catalog.json");
      if (!res.ok) return { items: [] };
      this.catalog = await res.json();
    }
    const { view } = this.merged();
    const query = q.trim().toLowerCase();
    const folded = etoileFold(query);
    const have = new Set(
      (view.restaurants || []).map((r) => `${etoileFold(r.award_name)}|${(r.award_city || r.city || "").toLowerCase()}`)
    );
    const hits = [];
    for (const item of this.catalog) {
      const blob = `${item.n} ${item.z || ""} ${item.c} ${item.cz || ""} ${item.ce || ""}`.toLowerCase();
      let score = 0;
      if (!query) score = 10;
      else if (query === item.n.toLowerCase() || query === (item.z || "").toLowerCase() || (folded && folded === etoileFold(item.n))) score = 100;
      else if (item.n.toLowerCase().startsWith(query) || (item.z && item.z.toLowerCase().startsWith(query))) score = 80;
      else if (blob.includes(query) || (folded && blob.includes(folded))) score = 50;
      else {
        const tokens = query.split(/\s+/).filter(Boolean);
        if (tokens.length && tokens.every((t) => blob.includes(t))) score = 35;
      }
      if (score > 0) hits.push({ item, score });
    }
    hits.sort((a, b) => b.score - a.score || (b.item.s || 0) - (a.item.s || 0) || a.item.n.localeCompare(b.item.n));
    return {
      items: hits.slice(0, limit).map(({ item }) => ({
        award_name: item.n,
        award_city: item.c,
        city_zh: item.cz,
        city_en: item.ce,
        country_zh: item.co,
        zh_name: item.z || "",
        max_stars: item.s || 0,
        star_years: item.sy || {},
        green_years: item.gy || [],
        bib_years: item.by || [],
        plate_years: item.py || [],
        best50: item.b50 || [],
        best_rank: item.br || {},
        other_ranks: item.or || [],
        other_ranks: item.or || [],
        already_checked_in: have.has(`${etoileFold(item.n)}|${item.c}`),
        _compact: item,
      })),
    };
  },

  saveNotes(payload) {
    const overlay = etoileLoadOverlay();
    const id = (payload.id || "").trim();
    if (!id) return { ok: false, error: "Missing restaurant id" };
    if (payload.action === "toggle_wishlist") {
      const wl = overlay.wishlist;
      const idx = wl.indexOf(id);
      if (idx >= 0) wl.splice(idx, 1);
      else wl.push(id);
      etoileSaveOverlay(overlay);
      return { ok: true, id, wishlisted: wl.includes(id), wishlist: wl };
    }
    if (payload.add_date) {
      const list = overlay.extraTimes[id] || [];
      if (!list.includes(payload.add_date)) list.push(payload.add_date);
      overlay.extraTimes[id] = list;
      overlay.hiddenTimes[id] = (overlay.hiddenTimes[id] || []).filter((d) => d !== payload.add_date);
    }
    if (payload.remove_date) {
      const hidden = overlay.hiddenTimes[id] || [];
      if (!hidden.includes(payload.remove_date)) hidden.push(payload.remove_date);
      overlay.hiddenTimes[id] = hidden;
      overlay.extraTimes[id] = (overlay.extraTimes[id] || []).filter((d) => d !== payload.remove_date);
    }
    const cur = overlay.dossiers[id] || {};
    for (const field of ["rating", "chef", "wine_pairing", "price_per_person", "companions", "notes", "cuisine"]) {
      if (payload[field] !== undefined && payload[field] !== "") cur[field] = payload[field];
    }
    if (payload.highlight_dishes !== undefined && payload.highlight_dishes !== null) {
      const dishes = payload.highlight_dishes;
      cur.highlight_dishes = Array.isArray(dishes)
        ? dishes
        : String(dishes).split(/[,，、\n]/).map((d) => d.trim()).filter(Boolean);
    }
    if (Array.isArray(payload.photos)) cur.photos = payload.photos;
    if (Object.keys(cur).length) {
      cur.updated_at = new Date().toISOString().slice(0, 16).replace("T", " ");
      overlay.dossiers[id] = cur;
    }
    etoileSaveOverlay(overlay);
    const view = etoileApplyOverlay(this.base, overlay);
    return { ok: true, id, restaurant: (view.restaurants || []).find((r) => r.id === id) || null };
  },

  async addCheckin(payload) {
    if (!this.catalog) {
      try {
        const res = await fetch("./data/catalog.json");
        if (res.ok) this.catalog = await res.json();
      } catch {
        /* search still works after a later query */
      }
    }
    const overlay = etoileLoadOverlay();
    const date = (payload.date || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const shop = (payload.shop || "").trim();
    const awardName = (payload.award_name || "").trim();
    const awardCity = (payload.award_city || payload.city || "").trim().toLowerCase();
    const note = {
      rating: payload.rating || 0,
      highlight_dishes: payload.highlight_dishes,
      price_per_person: payload.price_per_person || "",
      notes: payload.notes || "",
      photos: payload.photos || [],
    };
    if ((payload.mode || "award") === "award" && awardName) {
      const view = etoileApplyOverlay(this.base, overlay);
      const existing = (view.restaurants || []).find(
        (r) => etoileFold(r.award_name) === etoileFold(awardName) && (r.award_city || r.city) === awardCity
      );
      if (existing) {
        const list = overlay.extraTimes[existing.id] || [];
        if (date && !existing.times.includes(date) && !list.includes(date)) list.push(date);
        overlay.extraTimes[existing.id] = list;
        overlay.hiddenTimes[existing.id] = (overlay.hiddenTimes[existing.id] || []).filter((d) => d !== date);
        if (note.notes || note.rating || (note.photos && note.photos.length)) {
          overlay.dossiers[existing.id] = { ...(overlay.dossiers[existing.id] || {}), ...this.normalizeNote(note) };
        }
        etoileSaveOverlay(overlay);
        const next = etoileApplyOverlay(this.base, overlay);
        return {
          ok: true,
          is_new_restaurant: false,
          restaurant: next.restaurants.find((r) => r.id === existing.id),
        };
      }
      const compact = payload._compact || (this.catalog || []).find((item) => etoileFold(item.n) === etoileFold(awardName) && item.c === awardCity);
      const city = (payload.city || awardCity).toLowerCase();
      const known = (this.base.cities || []).find((c) => c.city === city) || {};
      const item = compact || {
        n: awardName,
        c: awardCity,
        z: shop,
        cz: known.city_zh || city,
        ce: known.city_en || city,
        co: known.country_zh || "",
        rg: known.region || "",
        la: known.lat || 0,
        ln: known.lng || 0,
        s: Number(payload.max_stars || 1),
        sy: {},
        gy: [],
        by: [],
        py: [],
        b50: [],
        br: {},
      };
      const restaurant = etoileRestaurantFromCatalog(item, shop, city, date, this.normalizeNote(note));
      overlay.extraRestaurants.push(restaurant);
      if (note.notes || note.rating) overlay.dossiers[restaurant.id] = restaurant.user_note;
      etoileSaveOverlay(overlay);
      return { ok: true, is_new_restaurant: true, restaurant };
    }
    const city = (payload.city || "").trim().toLowerCase();
    const known = (this.base.cities || []).find((c) => c.city === city) || {};
    const entry = {
      id: `custom|${Date.now()}`,
      shop: shop || awardName || "未命名餐厅",
      city,
      city_zh: known.city_zh || city,
      city_en: known.city_en || city,
      date,
      address: "",
      cuisine: "Fine Dining · 私享美馔",
      rating: Number(payload.rating || 0),
      highlight_dishes: payload.highlight_dishes || "",
      price_per_person: payload.price_per_person || "",
      notes: payload.notes || "",
      photos: payload.photos || [],
    };
    overlay.customCheckins.unshift(entry);
    etoileSaveOverlay(overlay);
    return { ok: true, is_new_restaurant: true, custom_checkin: entry };
  },

  normalizeNote(note) {
    const dishes = note.highlight_dishes;
    return {
      ...etoileEmptyNote(),
      rating: note.rating || 0,
      price_per_person: note.price_per_person || "",
      notes: note.notes || "",
      photos: note.photos || [],
      highlight_dishes: Array.isArray(dishes)
        ? dishes
        : String(dishes || "").split(/[,，、\n]/).map((d) => d.trim()).filter(Boolean),
    };
  },

  remove(id) {
    const overlay = etoileLoadOverlay();
    if (id.startsWith("custom|")) {
      overlay.customCheckins = overlay.customCheckins.filter((c) => c.id !== id);
    } else if ((overlay.extraRestaurants || []).some((r) => r.id === id)) {
      overlay.extraRestaurants = overlay.extraRestaurants.filter((r) => r.id !== id);
    } else if (!overlay.removed.includes(id)) {
      overlay.removed.push(id);
    }
    etoileSaveOverlay(overlay);
    return { ok: true };
  },

  exportOverlay() {
    const blob = new Blob([localStorage.getItem(ETOILE_OVERLAY_KEY) || "{}"], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "etoile-notes.json";
    a.click();
    URL.revokeObjectURL(a.href);
  },

  importOverlay(text) {
    const data = JSON.parse(text);
    if (!data || typeof data !== "object") throw new Error("bad file");
    localStorage.setItem(ETOILE_OVERLAY_KEY, JSON.stringify(data));
    this.view = null;
  },

  async pushGist(token) {
    const overlay = localStorage.getItem(ETOILE_OVERLAY_KEY) || "{}";
    const gistId = localStorage.getItem(ETOILE_GIST_KEY);
    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const body = {
      description: "ÉTOILE private notes",
      public: false,
      files: { "etoile-notes.json": { content: overlay } },
    };
    const res = await fetch(gistId ? `https://api.github.com/gists/${gistId}` : "https://api.github.com/gists", {
      method: gistId ? "PATCH" : "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("gist");
    const data = await res.json();
    if (data.id) localStorage.setItem(ETOILE_GIST_KEY, data.id);
    localStorage.setItem(ETOILE_TOKEN_KEY, token);
    return data.id;
  },

  async pullGist(token) {
    const gistId = localStorage.getItem(ETOILE_GIST_KEY);
    if (!gistId) throw new Error("no gist");
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("gist");
    const data = await res.json();
    const file = data.files && data.files["etoile-notes.json"];
    if (!file || !file.content) throw new Error("empty gist");
    this.importOverlay(file.content);
    localStorage.setItem(ETOILE_TOKEN_KEY, token);
  },
};

window.etoile = etoile;
