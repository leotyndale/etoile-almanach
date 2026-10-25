/**
 * ÉTOILE — L'Almanach Personnel des Tables Étoilées
 * Haute Couture Editorial & Michelin Enameled Plaque System
 */

const ROSETTE_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block; vertical-align:-1.5px;"><path d="M12 2.2c1.1 2.6 1.8 3.8 4.2 2.8-1.7 2.2-1.7 3.5 1.2 4.8-2.9.7-3.6 1.8-2.2 4.2-2.4-1.5-3.8-1.5-6.4 0 1.4-2.4.7-3.5-2.2-4.2 2.9-1.3 2.9-2.6 1.2-4.8 2.4 1 3.1-.2 4.2-2.8z" transform="translate(0, 2.5)"/><circle cx="12" cy="12" r="1.7" fill="var(--canvas)"/></svg>`;

const CITY_CODES = {
  "hong kong": "HKG",
  "paris": "PAR",
  "shanghai": "SHA",
  "tokyo": "TYO",
  "beijing": "BJS",
  "kyoto": "KYO",
  "macau": "MFM",
  "osaka": "OSA",
  "bangkok": "BKK",
  "singapore": "SIN",
  "seoul": "SEL",
  "chengdu": "CTU",
  "hangzhou": "HGH",
  "guangzhou": "CAN",
  "shenzhen": "SZX",
  "lyon": "LYS",
  "chasselay": "LYO",
  "chagny": "XAN",
  "nara": "NAR",
  "sapporo": "SPK",
  "fukuoka": "FUK",
  "taizhou": "HYN",
  "kuala lumpur": "KUL",
  "penang": "PEN",
  "ho chi minh city": "SGN",
  "hanoi": "HAN",
  "colombo": "CMB",
  "moscow": "MOW",
  "london": "LON",
  "new york": "NYC",
  "rome": "ROM",
  "milan": "MIL",
  "florence": "FLR",
  "venice": "VCE",
  "taipei": "TPE",
};

function getCityCode(city) {
  const c = (city || "").toLowerCase().trim();
  if (CITY_CODES[c]) return CITY_CODES[c];
  return (c.replace(/[^a-z]/g, "").slice(0, 3) || "GLB").toUpperCase();
}

function renderRosettes(count = 1) {
  if (!count || count <= 0) return "";
  return Array.from({ length: count }, () => ROSETTE_SVG).join("");
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const BEST50_LISTS = [
  ["worlds_50", "世界50佳", "世界"],
  ["asias_50", "亚洲50佳", "亚洲"],
  ["europe_50", "欧洲50佳", "欧洲"],
  ["latam_50", "拉美50佳", "拉美"],
  ["north_america_50", "北美50佳", "北美"],
  ["mena_50", "中东50佳", "中东"],
];

function best50Entries(bestRank) {
  if (!bestRank) return [];
  const known = new Set(BEST50_LISTS.map((item) => item[0]));
  const rows = [];
  for (const [key, full, short] of BEST50_LISTS) {
    if (!bestRank[key]) continue;
    let label = full;
    let brief = short;
    if (bestRank[key] > 50 && (key === "worlds_50" || key === "asias_50")) {
      label = key === "worlds_50" ? "世界百佳" : "亚洲百佳";
      brief = "百佳";
    }
    rows.push({ key, full: label, short: brief, rank: bestRank[key] });
  }
  for (const [key, rank] of Object.entries(bestRank)) {
    if (!rank || known.has(key)) continue;
    const short = String(key).replace(/_50$/, "").replace(/_/g, " ");
    rows.push({ key, full: short, short, rank });
  }
  return rows;
}

function formatBest50Label(bestRank) {
  return best50Entries(bestRank).map((row) => `${row.full} N°${row.rank}`);
}

function formatYearBest50(items) {
  if (!items || !items.length) return "";
  const best = {};
  for (const item of items) {
    if (!item.rank) continue;
    if (!best[item.list] || item.rank < best[item.list]) best[item.list] = item.rank;
  }
  return best50Entries(best).map((row) => `${row.short} N°${row.rank}`).join(" · ");
}

const OTHER_LABELS = {
  la_liste: "La Liste",
  gault_millau: "G&M",
  oad: "OAD",
  best_chef: "Best Chef",
  best_chef_pizza: "Best Chef Pizza",
  white_guide: "White",
  falstaff: "Falstaff",
  fifty_top: "50 Top",
  fifty_top_pizza: "50 Top Pizza",
  gambero_rosso: "Gambero Rosso",
  espresso: "Espresso",
  slow_food: "Slow Food",
  identita: "Identità",
  golosario: "Golosario",
  bibenda: "Bibenda",
  i_cento: "I Cento",
  pecora_nera: "Pecora Nera",
  zagat: "Zagat",
  gayot: "Gayot",
  touring: "Touring",
  henris: "Henris",
  accademia: "Accademia",
  repubblica: "Repubblica",
  repsol: "Repsol",
  black_pearl: "Black Pearl",
  feinschmecker: "Feinschmecker",
};

function formatOtherLabel(rows) {
  if (!rows || !rows.length) return [];
  const best = {};
  for (const row of rows) {
    const prev = best[row.list];
    const score = row.rank ? 1000 - row.rank : row.score || row.level || 0;
    const prevScore = prev ? (prev.rank ? 1000 - prev.rank : prev.score || prev.level || 0) : -1;
    if (!prev || score > prevScore) best[row.list] = row;
  }
  return Object.values(best).map((row) => {
    const name = OTHER_LABELS[row.list] || row.list;
    if (row.rank) return `${name} N°${row.rank}`;
    if (row.score) return `${name} ${row.score}`;
    if (row.level) return `${name} ${row.level}`;
    return name;
  });
}

class EtoileApp {
  constructor() {
    this.data = null;
    this.theme = localStorage.getItem("etoile_almanach_theme") || "ivory";
    this.currentView = "dashboard";
    this.collectionTier = "all";
    this.unmatchedTab = "region";
    this.unmatchedData = null;
    this.activeDossierId = null;
    this.studioMode = "award";
    this.studioSelectedCandidate = null;
    this.studioCandidates = [];
    this.studioPhotos = [];
    this.dossierPhotos = [];
  }

  async init() {
    this.applyTheme(this.theme);

    const triple = document.getElementById("hero-macaron-triple");
    if (triple) triple.innerHTML = renderRosettes(3);
    const t3 = document.getElementById("tier-icon-3");
    if (t3) t3.innerHTML = renderRosettes(3);
    const t2 = document.getElementById("tier-icon-2");
    if (t2) t2.innerHTML = renderRosettes(2);
    const t1 = document.getElementById("tier-icon-1");
    if (t1) t1.innerHTML = renderRosettes(1);

    await this.refreshData();
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  }

  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("etoile_almanach_theme", theme);
    const btn = document.getElementById("theme-toggle-btn");
    if (btn) {
      btn.textContent = theme === "ivory" ? "NOIR / 暗夜版" : "IVOIRE / 纸本版";
    }
  }

  toggleTheme() {
    this.applyTheme(this.theme === "ivory" ? "noir" : "ivory");
    if (this.currentView === "atlas") this.renderAtlas();
  }

  async refreshData() {
    try {
      this.data = await etoile.request("/api/bootstrap");
      this.populateCityDropdown();
      this.renderDashboard();
      this.renderCollection();
      this.renderAtlas();
      this.renderChronicle();
    } catch (err) {
      console.error("Failed to bootstrap data:", err);
      this.toast("数据加载失败，请确认服务正在运行");
    }
  }

  populateCityDropdown() {
    const sel = document.getElementById("collection-city-select");
    if (!sel || !this.data) return;
    const current = sel.value;
    const options = [`<option value="">ALL CITIES / 全部城邦 (${this.data.cities.length})</option>`];
    for (const c of this.data.cities) {
      options.push(
        `<option value="${escapeHtml(c.city)}">${getCityCode(c.city)} · ${escapeHtml(c.city_zh)} ${escapeHtml(c.city_en)} (${c.total_stars}★ / ${c.total_restaurants})</option>`
      );
    }
    sel.innerHTML = options.join("");
    sel.value = current;
  }

  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll(".view-pane").forEach((sec) => {
      sec.classList.toggle("active", sec.id === `view-${viewName}`);
    });
    document.querySelectorAll(".index-tab").forEach((btn) => {
      if (btn.dataset.view) {
        btn.classList.toggle("active", btn.dataset.view === viewName);
      }
    });
    if (viewName === "unmatched" && !this.unmatchedData) {
      this.loadUnmatchedView();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  jumpToCollection({ tier = "all", city = "", query = "" } = {}) {
    this.collectionTier = tier;
    document.querySelectorAll("#collection-tier-chips .efs-tag").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.tier === tier);
    });
    const citySel = document.getElementById("collection-city-select");
    if (citySel) citySel.value = city;
    const searchInput = document.getElementById("collection-search-input");
    if (searchInput) searchInput.value = query;
    this.renderCollection();
    this.switchView("collection");
  }

  /* ========================================================================
     1. PALMARÈS SPREAD
     ======================================================================== */
  renderDashboard() {
    if (!this.data) return;
    const s = this.data.summary;

    document.getElementById("hero-star-sum").textContent = s.star_sum;
    document.getElementById("hero-cities-count").textContent = s.cities_count;
    document.getElementById("hero-starred-count").textContent = s.starred_count;
    document.getElementById("hero-total-matched").textContent = s.total_matched;

    const colophon = document.getElementById("colophon-summary-line");
    if (colophon) {
      colophon.textContent = `${s.cities_count} VILLES · ${s.starred_count} TABLES ÉTOILÉES · ${s.star_sum} ÉTOILES`;
    }

    document.getElementById("nav-badge-starred").textContent = `${s.star_sum}★`;
    document.getElementById("nav-badge-cities").textContent = s.cities_count;
    document.getElementById("nav-badge-unmatched").textContent = s.region_unmatched_count;

    const c3 = s.tiers["3"] || 0;
    const c2 = s.tiers["2"] || 0;
    const c1 = s.tiers["1"] || 0;
    document.getElementById("tier-count-3").textContent = c3;
    document.getElementById("tier-stars-3").textContent = `${c3 * 3}★`;
    document.getElementById("tier-count-2").textContent = c2;
    document.getElementById("tier-stars-2").textContent = `${c2 * 2}★`;
    document.getElementById("tier-count-1").textContent = c1;
    document.getElementById("tier-stars-1").textContent = `${c1}★`;

    const chip = (tier, label) => {
      const node = document.querySelector(`#collection-tier-chips [data-tier="${tier}"]`);
      if (node) node.textContent = label;
    };
    chip("starred", `ÉTOILÉS / 全部摘星 (${s.starred_count})`);
    chip("3", `★★★ 三星 (${c3})`);
    chip("2", `★★ 二星 (${c2})`);
    chip("1", `★ 一星 (${c1})`);
    chip("best50", `50佳 (${s.best50_count})`);
    chip("green", `ÉTOILE VERTE / 绿星 (${s.green_count})`);
    chip("xinrong", `XIN RONG JI / 新荣记 (${s.xinrong_count})`);
    const voir = document.getElementById("voir-three-stars");
    if (voir) voir.textContent = `VOIR LES ${c3} TABLES / 查阅全部三星 →`;

    const propBar = document.getElementById("hero-proportion-bar");
    if (propBar) {
      propBar.innerHTML = `
        <div class="prop-seg-3" style="flex: ${c3 * 3 || 1};" title="Trois Étoiles: ${c3 * 3}★"></div>
        <div class="prop-seg-2" style="flex: ${c2 * 2 || 1};" title="Deux Étoiles: ${c2 * 2}★"></div>
        <div class="prop-seg-1" style="flex: ${c1 || 1};" title="Une Étoile: ${c1}★"></div>
      `;
    }

    document.getElementById("bento-best50-count").textContent = s.best50_count;
    const bestExamples = document.getElementById("bento-best50-examples");
    if (bestExamples) {
      const picks = BEST50_LISTS.map(([key, , short]) => {
        let best = null;
        for (const restaurant of this.data.restaurants || []) {
          const rank = restaurant.best_rank && restaurant.best_rank[key];
          if (!rank) continue;
          if (!best || rank < best.rank) best = { name: restaurant.shop, rank, short };
        }
        return best;
      }).filter(Boolean);
      if (picks.length) {
        bestExamples.textContent = picks.slice(0, 3).map((p) => `${p.name} ${p.short} N°${p.rank}`).join(" · ");
      }
    }
    this.renderBest50Board();
    document.getElementById("bento-green-count").textContent = s.green_count;
    document.getElementById("bento-xinrong-count").textContent = s.xinrong_count;
    document.getElementById("bento-bib-count").textContent = s.bib_count + s.plate_count;
    document.getElementById("bento-bib-desc").textContent = `必比登 ${s.bib_count} · 指南入选 ${s.plate_count}`;
    const hatCount = document.getElementById("bento-hat-count");
    if (hatCount) hatCount.textContent = s.hat_count || 0;
    const hatDesc = document.getElementById("bento-hat-desc");
    if (hatDesc) hatDesc.textContent = `历史最高合计 ${s.hat_sum || 0} 帽，不计入星星`;

    // Featured Tasting Menu Extract on Right Column
    const extractBox = document.getElementById("dashboard-featured-extract");
    if (extractBox) {
      const noted = this.data.restaurants.find((r) => r.id === "l ambroisie|paris") ||
                    this.data.restaurants.find((r) => r.user_note && r.user_note.notes) ||
                    this.data.restaurants[0];
      if (noted) {
        const dishes = (noted.user_note?.highlight_dishes || []).slice(0, 2).join(" · ");
        extractBox.innerHTML = `
          <div class="featured-menu-extract" onclick="app.openDossier('${escapeHtml(noted.id)}')">
            <div class="fme-header">
              <span>EXTRAIT DU CARNET DE TABLE · 席间手记选粹</span>
              <span>${renderRosettes(noted.max_stars)}</span>
            </div>
            <div class="fme-title">
              ${escapeHtml(noted.shop)}<span>${escapeHtml(noted.award_name)} (${escapeHtml(noted.city_en)})</span>
            </div>
            <p class="fme-quote">“${escapeHtml(noted.user_note?.notes || noted.cuisine)}”</p>
            <div class="fme-footer">
              <span>${escapeHtml(dishes || noted.cuisine)}</span>
              <span>VISITE: ${escapeHtml((noted.times || [])[0] || "ARCHIVE")} →</span>
            </div>
          </div>
        `;
      }
    }

    // Top 10 Gastronomy Capitals
    const cityStrip = document.getElementById("dashboard-city-strip");
    if (cityStrip) {
      cityStrip.innerHTML = this.data.cities
        .slice(0, 10)
        .map((c) => this.renderTerroirTicketHtml(c))
        .join("");
    }

    // Featured Three-Star Archival Slips (Top 15 on front page)
    const threeStars = this.data.restaurants
      .filter((r) => r.max_stars === 3 && !r.is_xinrong)
      .slice(0, 15);
    const threeList = document.getElementById("dashboard-threestar-list");
    if (threeList) {
      threeList.innerHTML = threeStars
        .map((r, idx) => this.renderArchivalSlipHtml(r, idx + 1))
        .join("");
    }

    // Xin Rong Ji Special Monograph
    const xinrongList = this.data.restaurants.filter((r) => r.is_xinrong);
    const xrContainer = document.getElementById("dashboard-xinrong-list");
    if (xrContainer) {
      const matchedHtml = xinrongList
        .map((r, idx) => this.renderArchivalSlipHtml(r, idx + 1))
        .join("");
      const unmatchedHtml = (this.data.xinrong_unmatched_branches || [])
        .map(
          (b, i) => `
          <div class="archival-slip" style="opacity:0.7; cursor:default;">
            <div class="as-left-code">
              <span class="as-serial">0${xinrongList.length + i + 1}</span>
              <span class="as-iata">XRJ</span>
            </div>
            <div class="as-center-body">
              <div class="as-title-line">
                <span class="as-name-zh">${escapeHtml(b.shop)}</span>
                <span class="as-name-original">Maison Xin Rong Ji</span>
              </div>
              <div class="as-sub-meta">
                <span>${escapeHtml(b.city_zh)}</span>
                <span>·</span>
                <span>${escapeHtml(b.note)}</span>
              </div>
            </div>
            <div class="as-right-honours">
              <span class="as-stamp">ARCHIVE</span>
              <span class="as-date-stub">${escapeHtml(b.date.replace(/-/g, "."))}</span>
            </div>
          </div>`
        )
        .join("");
      xrContainer.innerHTML = matchedHtml + unmatchedHtml;
    }

    const hatList = document.getElementById("dashboard-hats-list");
    if (hatList) {
      const hats = this.data.hats || [];
      hatList.innerHTML = hats.map((row, idx) => `
          <div class="archival-slip" style="cursor:default;">
            <div class="as-left-code">
              <span class="as-serial">${String(idx + 1).padStart(2, "0")}</span>
              <span class="as-iata">${row.hats}帽</span>
            </div>
            <div class="as-center-body">
              <div class="as-title-line">
                <span class="as-name-zh">${escapeHtml(row.shop)}</span>
                <span class="as-name-original">${escapeHtml(row.award_name)}</span>
              </div>
              <div class="as-sub-meta">
                <span>${escapeHtml(row.city_zh)}</span>
                <span>·</span>
                <span>${escapeHtml(row.guide)}</span>
              </div>
            </div>
            <div class="as-right-honours">
              <span class="as-stamp">${row.hats} TOQUES</span>
              <span class="as-date-stub">${escapeHtml((row.time || "").replace(/-/g, "."))}</span>
            </div>
          </div>`).join("");
    }
  }

  renderBest50Board() {
    const host = document.getElementById("dashboard-best50-board");
    if (!host || !this.data) return;
    const groups = [
      ["worlds_50", "世界50佳", (rank) => rank <= 50],
      ["asias_50", "亚洲50佳", (rank) => rank <= 50],
      ["mena_50", "中东50佳", (rank) => rank <= 50],
      ["latam_50", "拉美50佳", (rank) => rank <= 50],
      ["north_america_50", "北美50佳", (rank) => rank <= 50],
      ["europe_50", "欧洲50佳", (rank) => rank <= 50],
      ["worlds_50", "世界百佳", (rank) => rank > 50],
      ["asias_50", "亚洲百佳", (rank) => rank > 50],
    ];
    const listeRows = [];
    for (const restaurant of this.data.restaurants || []) {
      let best = null;
      let year = null;
      for (const item of restaurant.other_ranks || []) {
        if (item.list !== "la_liste" || !item.rank) continue;
        if (best === null || item.rank < best || (item.rank === best && item.year && (year === null || item.year < year))) {
          best = item.rank;
          year = item.year || year;
        }
      }
      if (best) listeRows.push({ id: restaurant.id, name: restaurant.shop, rank: best, year });
    }
    listeRows.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, "zh"));
    const blocks = groups.map(([key, title, accept]) => {
      const rows = [];
      for (const restaurant of this.data.restaurants || []) {
        const rank = restaurant.best_rank && restaurant.best_rank[key];
        if (!rank || !accept(rank)) continue;
        const years = (restaurant.best50 || [])
          .filter((item) => item.list === key && item.rank === rank && item.year)
          .map((item) => item.year);
        rows.push({
          id: restaurant.id,
          name: restaurant.shop,
          rank,
          year: years.length ? Math.min(...years) : null,
        });
      }
      rows.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, "zh"));
      return { title, rows };
    }).filter((group) => group.rows.length);
    if (listeRows.length) {
      const world = blocks.findIndex((group) => group.title === "世界百佳");
      blocks.splice(world < 0 ? blocks.length : world, 0, { title: "La Liste", rows: listeRows });
    }

    host.innerHTML = `
      <div class="best50-board">
        <div class="best50-board-kicker">PALMARÈS PERSONNEL · 去过的 50 佳，按该榜历史最高名次</div>
        ${blocks.map((group) => `
          <section class="best50-list">
            <header>
              <span>${escapeHtml(group.title)}</span>
              <em>${group.rows.length} 家 · 最高 N°${group.rows[0].rank}</em>
            </header>
            <ol>
              ${group.rows.map((row) => `
                <li onclick="app.openDossier('${escapeHtml(row.id)}')">
                  <b>N°${row.rank}</b>
                  <span>${escapeHtml(row.name)}</span>
                  ${row.year ? `<small>${row.year}</small>` : ""}
                </li>
              `).join("")}
            </ol>
          </section>
        `).join("")}
      </div>
    `;
  }

  renderTerroirTicketHtml(c) {
    const code = getCityCode(c.city);
    return `
      <div class="terroir-ticket" onclick="app.jumpToCollection({city:'${escapeHtml(c.city)}'})">
        <div>
          <div class="tt-top">
            <span class="tt-iata">${code} · ${escapeHtml(c.country_zh)}</span>
            <span class="tt-stars">${c.total_stars}★</span>
          </div>
          <div class="tt-city-zh">${escapeHtml(c.city_zh)}</div>
          <div class="tt-city-en">${escapeHtml(c.city_en)}</div>
        </div>
        <div class="tt-foot">
          <span>3★:${c.star_3} · 2★:${c.star_2} · 1★:${c.star_1}</span>
          <span>${c.total_restaurants} 席</span>
        </div>
      </div>
    `;
  }

  renderArchivalSlipHtml(r, indexNum) {
    const serial = String(indexNum).padStart(3, "0");
    const iata = getCityCode(r.city);
    const note = r.user_note || {};
    const b50 = formatBest50Label(r.best_rank);
    const extraAll = formatOtherLabel(r.other_ranks);
    const liste = extraAll.filter((label) => label.startsWith("La Liste"));
    const extra = extraAll.filter((label) => !label.startsWith("La Liste"));
    const dateRaw = r.times && r.times.length > 0 ? r.times[r.times.length - 1] : "CONFIRMÉ";
    const dateFormatted = dateRaw.replace(/-/g, ".");

    return `
      <article class="archival-slip" onclick="app.openDossier('${escapeHtml(r.id)}')">
        <div class="as-left-code">
          <span class="as-serial">${serial}</span>
          <span class="as-iata">${iata}</span>
        </div>

        <div class="as-center-body">
          <div class="as-title-line">
            <span class="as-name-zh">${escapeHtml(r.shop)}</span>
            ${
              r.award_name && r.award_name !== r.shop
                ? `<span class="as-name-original">${escapeHtml(r.award_name)}</span>`
                : ""
            }
          </div>
          <div class="as-sub-meta">
            <span>${escapeHtml(r.city_zh)} · ${escapeHtml(r.city_en)}</span>
            <span>/</span>
            <span>${escapeHtml((r.cuisine || "").split("·")[0].trim())}</span>
            ${
              r.times && r.times.length > 1
                ? `<span style="color:var(--rouge);">${r.times.length} VISITES (多刷)</span>`
                : ""
            }
            ${
              r.special_note
                ? `<span style="color:var(--rouge);">${escapeHtml(r.special_note)}</span>`
                : ""
            }
          </div>
          ${
            note.notes
              ? `<div class="as-critique-line">“${escapeHtml(note.notes)}”</div>`
              : ""
          }
        </div>

        <div class="as-right-honours">
          ${
            r.green_years && r.green_years.length > 0
              ? `<span class="as-stamp stamp-vert">VERTE</span>`
              : ""
          }
          ${b50.map((label) => `<span class="as-stamp stamp-or">${escapeHtml(label)}</span>`).join("")}
          ${liste.map((label) => `<span class="as-stamp stamp-or">${escapeHtml(label)}</span>`).join("")}
          ${
            extra.length > 0
              ? `<span class="as-stamp stamp-or">${escapeHtml(extra[0])}</span>`
              : ""
          }
          ${
            r.max_stars > 0
              ? `<span class="as-rosettes">${renderRosettes(r.max_stars)}</span>`
              : r.bib_years && r.bib_years.length > 0
              ? `<span class="as-stamp" style="border-color:var(--rouge); color:var(--rouge);">BIB</span>`
              : `<span class="as-stamp">SÉL</span>`
          }
          <span class="as-date-stub">${escapeHtml(dateFormatted)}</span>
        </div>
      </article>
    `;
  }

  /* ========================================================================
     2. FULL RÉPERTOIRE
     ======================================================================== */
  setCollectionTier(tier) {
    this.collectionTier = tier;
    document.querySelectorAll("#collection-tier-chips .efs-tag").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.tier === tier);
    });
    this.renderCollection();
  }

  getFilteredRestaurants() {
    if (!this.data) return [];
    const q = (document.getElementById("collection-search-input")?.value || "").trim().toLowerCase();
    const city = document.getElementById("collection-city-select")?.value || "";
    const sortBy = document.getElementById("collection-sort-select")?.value || "stars_desc";
    const tier = this.collectionTier;

    const list = this.data.restaurants.filter((r) => {
      if (city && r.city !== city) return false;
      if (tier === "starred" && r.max_stars <= 0) return false;
      if (tier === "3" && r.max_stars !== 3) return false;
      if (tier === "2" && r.max_stars !== 2) return false;
      if (tier === "1" && r.max_stars !== 1) return false;
      if (tier === "green" && (!r.green_years || r.green_years.length === 0)) return false;
      if (tier === "best50" && (!r.best50 || r.best50.length === 0)) return false;
      if (tier === "xinrong" && !r.is_xinrong) return false;
      if (tier === "bib" && (!r.bib_years || r.bib_years.length === 0) && (!r.plate_years || r.plate_years.length === 0)) return false;
      if (tier === "revisited" && (!r.times || r.times.length < 2)) return false;
      if (tier === "noted" && !(r.user_note && (r.user_note.notes || (r.user_note.highlight_dishes && r.user_note.highlight_dishes.length)))) return false;

      if (q) {
        const blob = [
          r.shop,
          r.award_name,
          r.zh_name,
          r.city,
          r.city_zh,
          r.city_en,
          r.country_zh,
          r.cuisine,
          r.address,
          r.user_note?.notes || "",
          r.user_note?.chef || "",
          (r.user_note?.highlight_dishes || []).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "recent_desc") return (b.latest_visit || "").localeCompare(a.latest_visit || "");
      if (sortBy === "visits_desc") {
        const d = (b.times?.length || 0) - (a.times?.length || 0);
        if (d !== 0) return d;
      }
      if (sortBy === "best50_asc") {
        const minA = Math.min(...Object.values(a.best_rank || {}).filter(Boolean), 999);
        const minB = Math.min(...Object.values(b.best_rank || {}).filter(Boolean), 999);
        if (minA !== minB) return minA - minB;
      }
      if (sortBy === "name_asc") return a.award_name.localeCompare(b.award_name);
      if (b.max_stars !== a.max_stars) return b.max_stars - a.max_stars;
      return a.shop.localeCompare(b.shop);
    });

    return list;
  }

  renderCollection() {
    const list = this.getFilteredRestaurants();
    const totalStars = list.reduce((acc, r) => acc + (r.max_stars || 0), 0);
    const metaEl = document.getElementById("collection-results-meta");
    if (metaEl) {
      metaEl.innerHTML = `SÉLECTION : <strong>${list.length}</strong> TABLES · TOTAL <strong style="color:var(--rouge)">${totalStars} ÉTOILES</strong>`;
    }

    const stage = document.getElementById("collection-stage");
    if (!stage) return;

    if (list.length === 0) {
      stage.innerHTML = `
        <div style="padding:48px 0; text-align:center;">
          <div style="font-family:'Noto Serif SC',serif; font-size:18px; margin-bottom:8px;">当前筛选条件下未找到餐厅记录</div>
          <button class="btn-inscribe" onclick="app.openCheckinStudio()">+ INSCRIRE / 从全球指南库录入新席</button>
        </div>
      `;
      return;
    }

    stage.innerHTML = list.map((r, idx) => this.renderArchivalSlipHtml(r, idx + 1)).join("");
  }

  /* ========================================================================
     3. TERROIRS & ATLAS
     ======================================================================== */
  renderAtlas() {
    if (!this.data) return;
    const mapStage = document.getElementById("atlas-map-stage");
    const gridStage = document.getElementById("atlas-cities-full-grid");
    if (!mapStage || !gridStage) return;

    const cities = this.data.cities;
    const project = (lat, lng) => {
      const x = ((lng + 180) / 360) * 1000;
      const y = ((90 - lat) / 180) * 360;
      return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    };

    const stroke = this.theme === "ivory" ? "rgba(20,19,17,0.12)" : "rgba(239,236,230,0.12)";
    const textCol = this.theme === "ivory" ? "#141311" : "#EFECE6";

    const pinsSvg = cities
      .map((c) => {
        const { x, y } = project(c.lat, c.lng);
        const r = Math.min(Math.max(4 + Math.sqrt(c.total_stars) * 1.35, 4.5), 15);
        return `
          <g style="cursor:pointer;" onclick="app.jumpToCollection({city:'${escapeHtml(c.city)}'})">
            <circle cx="${x}" cy="${y}" r="${r * 1.6}" fill="none" stroke="#A8131A" stroke-width="0.75" stroke-dasharray="2 2" />
            <circle cx="${x}" cy="${y}" r="${r}" fill="#A8131A" />
            <text x="${x}" y="${y - r - 4}" text-anchor="middle" fill="${textCol}" font-family="JetBrains Mono, monospace" font-size="9" font-weight="600">
              ${getCityCode(c.city)} ${c.total_stars}★
            </text>
          </g>
        `;
      })
      .join("");

    mapStage.innerHTML = `
      <div style="width:100%; overflow-x:auto;">
        <svg viewBox="0 0 1000 360" style="width:100%; min-width:600px; height:auto; display:block; background:var(--paper); border:1px solid var(--line-mid);">
          <g stroke="${stroke}" stroke-width="0.7" stroke-dasharray="2 4">
            <line x1="0" y1="90" x2="1000" y2="90" />
            <line x1="0" y1="180" x2="1000" y2="180" />
            <line x1="0" y1="270" x2="1000" y2="270" />
            <line x1="200" y1="0" x2="200" y2="360" />
            <line x1="400" y1="0" x2="400" y2="360" />
            <line x1="600" y1="0" x2="600" y2="360" />
            <line x1="800" y1="0" x2="800" y2="360" />
          </g>
          ${pinsSvg}
        </svg>
      </div>
    `;

    gridStage.innerHTML = cities.map((c) => this.renderTerroirTicketHtml(c)).join("");
  }

  /* ========================================================================
     4. ANNALES (CHRONICLE 2019–2026)
     ======================================================================== */
  renderChronicle() {
    if (!this.data) return;

    const customStage = document.getElementById("chronicle-custom-section");
    const customs = this.data.custom_checkins || [];
    if (customStage) {
      if (customs.length === 0) {
        customStage.innerHTML = "";
      } else {
        customStage.innerHTML = `
          <div style="padding:20px 0; border-bottom:1.5px solid var(--line-heavy);">
            <div class="poster-overline" style="margin-bottom:10px;">CARNET PRIVÉ · 自由录入私享席履 (${customs.length})</div>
            <div class="repertoire-Dynamic-list">
              ${customs
                .map(
                  (c, idx) => `
                <div class="archival-slip" style="cursor:default;">
                  <div class="as-left-code">
                    <span class="as-serial">P${String(idx + 1).padStart(2, "0")}</span>
                    <span class="as-iata">${getCityCode(c.city)}</span>
                  </div>
                  <div class="as-center-body">
                    <div class="as-title-line">
                      <span class="as-name-zh">${escapeHtml(c.shop)}</span>
                    </div>
                    <div class="as-sub-meta">
                      <span>${escapeHtml(c.city_zh || c.city || "GLOBAL")}</span>
                      <span>/</span>
                      <span>${escapeHtml(c.cuisine || "私享美馔")}</span>
                    </div>
                    ${c.notes ? `<div class="as-critique-line">“${escapeHtml(c.notes)}”</div>` : ""}
                  </div>
                  <div class="as-right-honours">
                    <button class="efs-tag" onclick="app.deleteCustomCheckin('${escapeHtml(c.id)}')">删除</button>
                    <span class="as-date-stub">${escapeHtml((c.date || "").replace(/-/g, "."))}</span>
                  </div>
                </div>`
                )
                .join("")}
            </div>
          </div>
        `;
      }
    }

    const stage = document.getElementById("chronicle-timeline-stage");
    if (!stage) return;

    stage.innerHTML = (this.data.chronicle || [])
      .map(
        (yb) => `
        <div style="padding:28px 0 12px;">
          <div style="display:flex; justify-content:space-between; align-items:baseline; padding-bottom:10px; border-bottom:1.5px solid var(--line-heavy);">
            <div style="display:flex; align-items:baseline; gap:14px;">
              <span style="font-family:'Cormorant Garamond',serif; font-style:italic; font-size:42px; font-weight:600; line-height:1;">${escapeHtml(yb.year)}</span>
              <span style="font-family:'JetBrains Mono',monospace; font-size:10.5px; letter-spacing:0.16em; color:var(--rouge);">MILLÉSIME</span>
            </div>
            <div style="font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--ink-mid);">
              ${yb.visits} VISITES · <strong style="color:var(--rouge)">${yb.stars_visited} ★</strong> (3★ × ${yb.three_stars})
            </div>
          </div>
          <div class="repertoire-Dynamic-list">
            ${yb.items
              .map((item, idx) => {
                const full = this.data.restaurants.find((r) => r.id === item.id) || item;
                return this.renderArchivalSlipHtml(
                  { ...full, times: [item.date] },
                  idx + 1
                );
              })
              .join("")}
          </div>
        </div>
      `
      )
      .join("");
  }

  async deleteCustomCheckin(id) {
    await etoile.request(`/api/checkin?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    this.toast("已移除该条私享记录");
    await this.refreshData();
  }

  /* ========================================================================
     5. À DÉCOUVRIR (CANDIDATE 1-STARS & OVERSEAS VOYAGES)
     ======================================================================== */
  switchUnmatchedTab(tab) {
    this.unmatchedTab = tab;
    document.getElementById("btn-unmatched-region").classList.toggle("active", tab === "region");
    document.getElementById("btn-unmatched-overseas").classList.toggle("active", tab === "overseas");
    const citySel = document.getElementById("unmatched-city-select");
    if (citySel) citySel.value = "";
    this.loadUnmatchedView();
  }

  async loadUnmatchedView() {
    const q = document.getElementById("unmatched-search-input")?.value || "";
    const city = document.getElementById("unmatched-city-select")?.value || "";
    const data = await etoile.request(
      `/api/unmatched?type=${encodeURIComponent(this.unmatchedTab)}&city=${encodeURIComponent(city)}&q=${encodeURIComponent(q)}&limit=120`
    );
    this.unmatchedData = data;

    const sel = document.getElementById("unmatched-city-select");
    if (sel) {
      const cur = sel.value;
      sel.innerHTML =
        `<option value="">ALL CITIES / 全部城邦 (${data.total})</option>` +
        (data.cities || [])
          .map((c) => `<option value="${escapeHtml(c.city)}">${getCityCode(c.city)} · ${escapeHtml(c.city_zh)} (${c.count})</option>`)
          .join("");
      sel.value = cur;
    }

    const pills = document.getElementById("unmatched-city-pills");
    if (pills) {
      pills.innerHTML =
        `<button class="efs-tag ${!city ? "active" : ""}" onclick="document.getElementById('unmatched-city-select').value=''; app.loadUnmatchedView()">ALL (${data.total})</button>` +
        (data.cities || [])
          .slice(0, 12)
          .map(
            (c) =>
              `<button class="efs-tag ${city === c.city ? "active" : ""}" onclick="document.getElementById('unmatched-city-select').value='${escapeHtml(c.city)}'; app.loadUnmatchedView()">${escapeHtml(c.city_zh)} (${c.count})</button>`
          )
          .join("");
    }

    const stage = document.getElementById("unmatched-stage");
    if (!stage) return;

    if (this.unmatchedTab === "region") {
      stage.innerHTML = (data.items || [])
        .map(
          (item, idx) => `
          <div class="archival-slip" style="cursor:default;">
            <div class="as-left-code">
              <span class="as-serial">${String(idx + 1).padStart(3, "0")}</span>
              <span class="as-iata">${getCityCode(item.city)}</span>
            </div>
            <div class="as-center-body">
              <div class="as-title-line">
                <span class="as-name-zh">${escapeHtml(item.zh_name || item.award_name)}</span>
                <span class="as-name-original">${escapeHtml(item.award_name)}</span>
              </div>
              <div class="as-sub-meta">
                <span>${escapeHtml(item.city_zh)} · ${escapeHtml(item.city_en)}</span>
                ${item.area ? `<span>· ${escapeHtml(item.area)}</span>` : ""}
              </div>
            </div>
            <div class="as-right-honours">
              <span class="as-rosettes">${renderRosettes(item.max_stars || 1)}</span>
              <button class="efs-tag" onclick="app.toggleWishlist('${escapeHtml(item.id)}')">
                ${item.wishlisted ? "★ 已收藏" : "☆ 候选"}
              </button>
              <button class="btn-inscribe" style="padding:4px 10px;" onclick="app.quickCheckinFromUnmatched('${escapeHtml(item.award_name)}', '${escapeHtml(item.city)}', '${escapeHtml(item.zh_name || item.award_name)}')">
                + 点亮入账
              </button>
            </div>
          </div>`
        )
        .join("");
    } else {
      stage.innerHTML = (data.items || [])
        .map(
          (item, idx) => `
          <div class="archival-slip" style="cursor:default;">
            <div class="as-left-code">
              <span class="as-serial">${String(idx + 1).padStart(3, "0")}</span>
              <span class="as-iata">${getCityCode(item.city)}</span>
            </div>
            <div class="as-center-body">
              <div class="as-title-line">
                <span class="as-name-zh">${escapeHtml(item.shop)}</span>
              </div>
              <div class="as-sub-meta">
                <span>${escapeHtml(item.city_zh)} (${escapeHtml(item.country_zh)})</span>
                <span>·</span>
                <span>${escapeHtml(item.address)}</span>
              </div>
            </div>
            <div class="as-right-honours">
              <button class="efs-tag" onclick="app.openCheckinStudioWithPrefill('${escapeHtml(item.shop)}', '${escapeHtml(item.city)}', '${escapeHtml(item.time_last || item.time_first)}', '${escapeHtml(item.address)}')">
                关联奖项 / 撰稿
              </button>
              <span class="as-date-stub">${escapeHtml((item.time_last || item.time_first).replace(/-/g, "."))}</span>
            </div>
          </div>`
        )
        .join("");
    }
  }

  async toggleWishlist(id) {
    await etoile.request("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "toggle_wishlist" }),
    });
    this.toast("已更新候选心愿单");
    await this.loadUnmatchedView();
  }

  quickCheckinFromUnmatched(awardName, city, zhName) {
    this.openCheckinStudio({
      award_name: awardName,
      award_city: city,
      shop: zhName || awardName,
      max_stars: 1,
    });
  }

  openCheckinStudioWithPrefill(shop, city, date, address) {
    this.openCheckinStudio({
      shop,
      city,
      date,
      address,
      searchQuery: shop,
    });
  }

  /* ========================================================================
     6. FRAMED FRENCH TASTING MENU DOSSIER (READ MODE + TOGGLEABLE EDIT MODE)
     ======================================================================== */
  openDossier(id, startInEditMode = false) {
    if (!this.data) return;
    const r = this.data.restaurants.find((item) => item.id === id);
    if (!r) return;
    this.activeDossierId = id;
    this.dossierPhotos = [...(r.user_note?.photos || [])];

    const sheet = document.getElementById("dossier-sheet");
    const backdrop = document.getElementById("dossier-backdrop");
    if (!sheet || !backdrop) return;

    const note = r.user_note || {};
    const dishes = note.highlight_dishes || [];
    const b50 = formatBest50Label(r.best_rank);
    const extra = formatOtherLabel(r.other_ranks);

    const vintageCells = (r.yearly_matrix || [])
      .map(
        (ym) => `
        <div class="mv-cell">
          <div class="mv-yr">${ym.year}</div>
          <div class="mv-val">
            ${ym.stars ? "★".repeat(ym.stars) : ""}
            ${ym.green ? `<span style="color:var(--vert)">V</span>` : ""}
            ${ym.bib ? "Bib" : ""}
            ${ym.plate && !ym.stars ? `<span style="color:var(--ink-light)">Sél</span>` : ""}
          </div>
          ${
            ym.best50 && ym.best50.length
              ? `<div style="font-family:'Noto Serif SC',serif; font-size:10px; color:var(--or);">${escapeHtml(formatYearBest50(ym.best50))}</div>`
              : ""
          }
          ${
            ym.other && ym.other.length
              ? `<div style="font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--or);">${escapeHtml(formatOtherLabel(ym.other)[0] || "")}</div>`
              : ""
          }
        </div>`
      )
      .join("");

    sheet.innerHTML = `
      <div class="menu-top-bar">
        <span>DOSSIER N° · ${getCityCode(r.city)} / ${escapeHtml(r.city_en.toUpperCase())}</span>
        <div style="display:flex; gap:14px;">
          <button class="text-action-btn" onclick="app.toggleMenuEditor()">✎ ÉDITER LA NOTE / 编辑手记</button>
          <button class="text-action-btn" onclick="app.closeDossier()">FERMER / 关闭 [ESC]</button>
        </div>
      </div>

      <!-- Double-Rule Framed French Tasting Menu Card -->
      <div class="haute-menu-frame">
        <div class="haute-menu-inner">
          <!-- Crest & Title -->
          <div class="menu-center-crest">
            ${
              r.max_stars > 0
                ? `<div class="menu-rosettes-crest">${renderRosettes(r.max_stars)}</div>`
                : ""
            }
            <div class="menu-city-kicker">${escapeHtml(r.city_zh)} · ${escapeHtml(r.city_en)} · ${escapeHtml(r.country_zh)}</div>
            <h2 class="menu-house-zh">${escapeHtml(r.shop)}</h2>
            <div class="menu-house-original">
              ${escapeHtml(r.award_name)}${r.zh_name && r.zh_name !== r.shop ? ` · ${escapeHtml(r.zh_name)}` : ""}
            </div>
            <div class="menu-address-line">${escapeHtml(r.cuisine)} · ${escapeHtml(r.address || r.city_zh)}</div>
            ${
              b50.length
                ? `<div style="margin-top:10px;"><span class="as-stamp stamp-or">${escapeHtml(b50.join(" · "))}</span></div>`
                : ""
            }
            ${
              extra.length
                ? `<div style="margin-top:8px;"><span class="as-stamp stamp-or">${escapeHtml(extra.join(" · "))}</span></div>`
                : ""
            }
            ${
              r.special_note
                ? `<div style="margin-top:8px; font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--rouge);">${escapeHtml(r.special_note)}</div>`
                : ""
            }
          </div>

          <!-- Courses & Tasting Critique (Menu Style) -->
          <div class="menu-courses-section">
            <div class="menu-section-caption">MENU DÉGUSTATION &amp; CRITIQUE · 席间品鉴录</div>
            ${
              note.chef
                ? `<div style="font-family:'Cormorant Garamond',serif; font-style:italic; font-size:17px; color:var(--ink-mid); margin-bottom:14px;">Chef de Cuisine — ${escapeHtml(note.chef)}</div>`
                : ""
            }
            ${
              dishes.length > 0
                ? dishes.map((d) => `<div class="menu-course-item">— ${escapeHtml(d)} —</div>`).join("")
                : `<div class="menu-course-item" style="color:var(--ink-light); font-size:13px;">（点击右上角「编辑手记」录入代表菜品与私人品鉴随笔）</div>`
            }
            ${
              note.wine_pairing
                ? `<div style="font-family:'Cormorant Garamond',serif; font-style:italic; font-size:15px; color:var(--or); margin-top:12px;">Accords : ${escapeHtml(note.wine_pairing)}</div>`
                : ""
            }
            ${
              note.notes
                ? `<p class="menu-critique-prose">“${escapeHtml(note.notes)}”</p>`
                : ""
            }
            ${
              note.price_per_person || note.rating
                ? `<div style="margin-top:14px; font-family:'JetBrains Mono',monospace; font-size:10.5px; color:var(--ink-light);">
                    ${note.rating ? `NOTE PERSONNELLE : ${note.rating.toFixed(1)} / 5.0` : ""}
                    ${note.price_per_person ? ` · ADDITION : ${escapeHtml(note.price_per_person)}` : ""}
                   </div>`
                : ""
            }

            ${
              this.dossierPhotos.length > 0
                ? `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px; margin-top:18px;">
                    ${this.dossierPhotos
                      .map(
                        (src) => `<div style="aspect-ratio:4/3; border:1px solid var(--line-mid); overflow:hidden;"><img src="${src}" style="width:100%; height:100%; object-fit:cover;" /></div>`
                      )
                      .join("")}
                   </div>`
                : ""
            }
          </div>

          <!-- Visit Date Stamps & Add Repeat Visit -->
          <div style="padding:20px 0; border-bottom:1px solid var(--line-fine); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <div class="menu-section-caption" style="margin-bottom:6px; text-align:left;">DATES DE VISITE · 入席印记</div>
              <div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${
                  r.times && r.times.length
                    ? r.times
                        .map(
                          (dt) => `
                      <span class="as-stamp" style="padding:3px 8px;">
                        ${escapeHtml(dt.replace(/-/g, "."))}
                        <button onclick="app.removeVisitDate('${escapeHtml(r.id)}', '${escapeHtml(dt)}')" style="background:none; border:none; color:var(--ink-light); cursor:pointer; margin-left:4px;">×</button>
                      </span>`
                        )
                        .join("")
                    : `<span style="font-size:12px; color:var(--ink-light);">CONFIRMÉ</span>`
                }
              </div>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
              <input type="date" id="dossier-new-date" value="${new Date().toISOString().slice(0, 10)}" style="background:transparent; border:1px solid var(--line-mid); padding:4px 8px; color:var(--ink); font-family:'JetBrains Mono',monospace; font-size:11px;" />
              <button class="efs-tag" onclick="app.addVisitDate('${escapeHtml(r.id)}')">+ 二刷日期</button>
            </div>
          </div>

          <!-- 2016-2027 Michelin Star History -->
          <div style="padding-top:20px;">
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
              <span class="menu-section-caption" style="margin:0;">PALMARÈS 2016 — 2027 · 历年指南授星轨迹</span>
              <span style="font-family:'JetBrains Mono',monospace; font-size:10.5px; color:var(--rouge);">MAX : ${r.max_stars} ★</span>
            </div>
            <div class="menu-vintage-grid">
              ${vintageCells || `<div style="padding:10px; font-size:11.5px; color:var(--ink-light); grid-column:1/-1;">历史最高 ${r.max_stars} 星收录</div>`}
            </div>
          </div>

          <!-- Toggleable Edit Drawer -->
          <div class="menu-editor-drawer ${startInEditMode ? "open" : ""}" id="menu-editor-drawer">
            <div class="menu-section-caption" style="text-align:left;">ÉDITION DU CARNET · 编辑席间品鉴档案</div>
            <div class="editor-grid-2">
              <div class="editor-field">
                <label>个人评分 (0.0 - 5.0)</label>
                <input type="number" id="dossier-rating" step="0.1" min="0" max="5" value="${note.rating || 5.0}" />
              </div>
              <div class="editor-field">
                <label>主厨 (CHEF DE CUISINE)</label>
                <input type="text" id="dossier-chef" placeholder="如：Bernard Pacaud / 张勇 / 石原仁司" value="${escapeHtml(note.chef || "")}" />
              </div>
              <div class="editor-field">
                <label>人均消费 (ADDITION)</label>
                <input type="text" id="dossier-price" placeholder="如：€480 / ¥2,200" value="${escapeHtml(note.price_per_person || "")}" />
              </div>
              <div class="editor-field">
                <label>侍酒搭配 (ACCORDS METS &amp; VINS)</label>
                <input type="text" id="dossier-wine" placeholder="如：Puligny-Montrachet / 二十年陈花雕" value="${escapeHtml(note.wine_pairing || "")}" />
              </div>
            </div>

            <div class="editor-field">
              <label>代表菜品（逗号分隔，将以法式菜单居中排印）</label>
              <input type="text" id="dossier-dishes" placeholder="如：芝麻酥皮海螯虾, 家烧东海野生大黄鱼, 经典苦可可塔" value="${escapeHtml((note.highlight_dishes || []).join(", "))}" />
            </div>

            <div class="editor-field">
              <label>席间随笔与品鉴评论</label>
              <textarea id="dossier-notes" rows="4" placeholder="记录菜品火候、酱汁美学与席间记忆...">${escapeHtml(note.notes || "")}</textarea>
            </div>

            <div class="editor-field">
              <label>上传菜品或菜单实拍照片</label>
              <input type="file" accept="image/*" multiple onchange="app.handleDossierPhotoUpload(event)" style="font-size:11.5px;" />
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
              <button class="efs-tag" style="color:var(--rouge); border-color:var(--rouge);" onclick="app.deleteRestaurantFromMatched('${escapeHtml(r.id)}')">
                从此名录移除
              </button>
              <button class="btn-inscribe" onclick="app.saveDossier('${escapeHtml(r.id)}')">
                ENREGISTRER / 保存品鉴手记
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    backdrop.classList.add("open");
  }

  toggleMenuEditor() {
    const drawer = document.getElementById("menu-editor-drawer");
    if (drawer) {
      drawer.classList.toggle("open");
      if (drawer.classList.contains("open")) {
        drawer.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  closeDossier() {
    const backdrop = document.getElementById("dossier-backdrop");
    if (backdrop) backdrop.classList.remove("open");
    this.activeDossierId = null;
  }

  handleDossierPhotoUpload(event) {
    const files = Array.from(event.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.dossierPhotos.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  async addVisitDate(id) {
    const dt = document.getElementById("dossier-new-date")?.value;
    if (!dt) return;
    await etoile.request("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, add_date: dt }),
    });
    this.toast(`已增补入席日期：${dt}`);
    await this.refreshData();
    this.openDossier(id);
  }

  async removeVisitDate(id, dt) {
    await etoile.request("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, remove_date: dt }),
    });
    this.toast(`已移除日期：${dt}`);
    await this.refreshData();
    this.openDossier(id);
  }

  async saveDossier(id) {
    const rating = parseFloat(document.getElementById("dossier-rating")?.value || "0");
    const chef = document.getElementById("dossier-chef")?.value || "";
    const price_per_person = document.getElementById("dossier-price")?.value || "";
    const wine_pairing = document.getElementById("dossier-wine")?.value || "";
    const highlight_dishes = document.getElementById("dossier-dishes")?.value || "";
    const notes = document.getElementById("dossier-notes")?.value || "";

    await etoile.request("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        rating,
        chef,
        price_per_person,
        wine_pairing,
        highlight_dishes,
        notes,
        photos: this.dossierPhotos,
      }),
    });

    this.toast("品鉴手记已排印归档");
    await this.refreshData();
    this.openDossier(id, false);
  }

  async deleteRestaurantFromMatched(id) {
    await etoile.request(`/api/checkin?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    this.closeDossier();
    this.toast("已从名录移除");
    await this.refreshData();
  }

  /* ========================================================================
     7. SMART CHECK-IN & GLOBAL AWARD INSCRIPTION STUDIO
     ======================================================================== */
  openCheckinStudio(prefill = null) {
    this.studioMode = "award";
    this.studioSelectedCandidate = prefill && prefill.award_name ? prefill : null;
    this.studioPhotos = [];

    const backdrop = document.getElementById("studio-backdrop");
    const card = document.getElementById("studio-modal-card");
    if (!backdrop || !card) return;

    const today = (prefill && prefill.date) || new Date().toISOString().slice(0, 10);
    const initialSearch = (prefill && (prefill.searchQuery || prefill.award_name)) || "";

    card.innerHTML = `
      <div class="menu-top-bar">
        <span>INSCRIPTION D'UNE TABLE · 录入新席与点亮星冕</span>
        <button class="text-action-btn" onclick="app.closeCheckinStudio()">FERMER / 关闭</button>
      </div>

      <h2 style="font-family:'Noto Serif SC',serif; font-size:24px; font-weight:700; margin-bottom:14px;">新增打卡记录</h2>

      <div style="display:flex; gap:6px; margin-bottom:18px;">
        <button class="efs-tag active" id="studio-tab-award" onclick="app.setStudioMode('award')">
          检索全球米其林 &amp; 50 Best 库 (40,000+ 记录)
        </button>
        <button class="efs-tag" id="studio-tab-custom" onclick="app.setStudioMode('custom')">
          自由录入私享食府
        </button>
      </div>

      <div id="studio-award-finder">
        <div class="editor-field">
          <label>RECHERCHE GLOBALE / 输入中英文店名或城市（如 Odette / Plénitude / 颐宫 / Tokyo）</label>
          <input type="text" id="studio-award-query" placeholder="输入店名即刻匹配历年最高星级与 50 Best 排名..." value="${escapeHtml(initialSearch)}" oninput="app.searchStudioCandidates()" />
        </div>
        <div id="studio-selected-banner"></div>
        <div class="studio-results-box" id="studio-candidate-list"></div>
      </div>

      <div>
        <div class="editor-grid-2">
          <div class="editor-field">
            <label>打卡展示店名</label>
            <input type="text" id="studio-shop-name" placeholder="如：Odette / 颐宫" value="${escapeHtml((prefill && prefill.shop) || "")}" />
          </div>
          <div class="editor-field">
            <label>所在城市 (如 singapore / paris / tokyo)</label>
            <input type="text" id="studio-city" placeholder="如：singapore / paris / hong kong" value="${escapeHtml((prefill && (prefill.award_city || prefill.city)) || "")}" />
          </div>
          <div class="editor-field">
            <label>入席日期</label>
            <input type="date" id="studio-visit-date" value="${escapeHtml(today)}" />
          </div>
          <div class="editor-field">
            <label>个人评分 (0.0 - 5.0)</label>
            <input type="number" id="studio-rating" step="0.1" min="0" max="5" value="5.0" />
          </div>
          <div class="editor-field">
            <label>代表菜品（逗号分隔）</label>
            <input type="text" id="studio-dishes" placeholder="如：迷迭香烟熏有机蛋, 诺曼底乳鸽" />
          </div>
          <div class="editor-field">
            <label>人均消费</label>
            <input type="text" id="studio-price" placeholder="如：S$480" />
          </div>
        </div>

        <div class="editor-field">
          <label>席间品鉴手记</label>
          <textarea id="studio-notes" rows="3" placeholder="记录此次摘星体验..."></textarea>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
          <button class="efs-tag" onclick="app.closeCheckinStudio()">取消</button>
          <button class="btn-inscribe" onclick="app.submitStudioCheckin()">+ CONFIRMER / 确认入账</button>
        </div>
      </div>
    `;

    backdrop.classList.add("open");
    this.renderSelectedCandidateBanner();
    this.searchStudioCandidates();
  }

  closeCheckinStudio() {
    const backdrop = document.getElementById("studio-backdrop");
    if (backdrop) backdrop.classList.remove("open");
  }

  setStudioMode(mode) {
    this.studioMode = mode;
    document.getElementById("studio-tab-award").classList.toggle("active", mode === "award");
    document.getElementById("studio-tab-custom").classList.toggle("active", mode === "custom");
    const finder = document.getElementById("studio-award-finder");
    if (finder) finder.style.display = mode === "award" ? "block" : "none";
  }

  async searchStudioCandidates() {
    const q = document.getElementById("studio-award-query")?.value || "";
    const data = await etoile.request(`/api/awards/search?q=${encodeURIComponent(q)}&limit=25`);
    this.studioCandidates = data.items || [];
    const listEl = document.getElementById("studio-candidate-list");
    if (!listEl) return;

    listEl.innerHTML = this.studioCandidates
      .map((item, idx) => {
        const isSel =
          this.studioSelectedCandidate &&
          this.studioSelectedCandidate.award_name === item.award_name &&
          this.studioSelectedCandidate.award_city === item.award_city;

        return `
          <div class="studio-result-row ${isSel ? "selected" : ""}" onclick="app.selectStudioCandidate(${idx})">
            <div>
              <span style="font-family:'Noto Serif SC',serif; font-weight:700;">
                ${escapeHtml(item.zh_name ? `${item.zh_name} · ${item.award_name}` : item.award_name)}
              </span>
              <span style="font-family:'JetBrains Mono',monospace; font-size:10.5px; color:var(--ink-light); margin-left:8px;">
                ${getCityCode(item.award_city)} · ${escapeHtml(item.city_zh)}
              </span>
              ${item.already_checked_in ? `<span style="font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--rouge); margin-left:6px;">[已在名录]</span>` : ""}
            </div>
            <div style="color:var(--rouge);">${item.max_stars > 0 ? renderRosettes(item.max_stars) : `<span class="as-stamp">SÉL</span>`}</div>
          </div>
        `;
      })
      .join("");
  }

  selectStudioCandidate(idx) {
    const item = this.studioCandidates[idx];
    if (!item) return;
    this.studioSelectedCandidate = item;
    const shopInput = document.getElementById("studio-shop-name");
    if (shopInput) shopInput.value = item.zh_name || item.award_name;
    const cityInput = document.getElementById("studio-city");
    if (cityInput) cityInput.value = item.award_city || "";
    this.renderSelectedCandidateBanner();
    this.searchStudioCandidates();
  }

  renderSelectedCandidateBanner() {
    const banner = document.getElementById("studio-selected-banner");
    if (!banner) return;
    const c = this.studioSelectedCandidate;
    if (!c) {
      banner.innerHTML = "";
      return;
    }
    banner.innerHTML = `
      <div style="background:var(--rouge-tint); border:1px solid var(--rouge); padding:10px 14px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--rouge);">TABLE SÉLECTIONNÉE :</span>
          <div style="font-family:'Noto Serif SC',serif; font-size:16px; font-weight:700;">
            ${escapeHtml(c.award_name)} ${c.zh_name ? `· ${escapeHtml(c.zh_name)}` : ""} (${escapeHtml(c.award_city)})
          </div>
        </div>
        <div style="color:var(--rouge);">${renderRosettes(c.max_stars || 1)}</div>
      </div>
    `;
  }

  async submitStudioCheckin() {
    const shop = document.getElementById("studio-shop-name")?.value.trim() || "";
    const city = document.getElementById("studio-city")?.value.trim() || "";
    const date = document.getElementById("studio-visit-date")?.value || "";
    const rating = parseFloat(document.getElementById("studio-rating")?.value || "5");
    const highlight_dishes = document.getElementById("studio-dishes")?.value || "";
    const price_per_person = document.getElementById("studio-price")?.value || "";
    const notes = document.getElementById("studio-notes")?.value || "";

    if (this.studioMode === "award" && !this.studioSelectedCandidate && !shop) {
      this.toast("请先从指南列表中点选一家餐厅或输入店名");
      return;
    }

    const payload = {
      mode: this.studioMode,
      shop: shop || (this.studioSelectedCandidate && this.studioSelectedCandidate.award_name) || "",
      award_name:
        this.studioMode === "award"
          ? (this.studioSelectedCandidate && this.studioSelectedCandidate.award_name) || shop
          : "",
      award_city:
        this.studioMode === "award"
          ? (this.studioSelectedCandidate && this.studioSelectedCandidate.award_city) || city
          : city,
      city,
      date,
      rating,
      highlight_dishes,
      price_per_person,
      notes,
      photos: this.studioPhotos,
      _compact: this.studioSelectedCandidate && this.studioSelectedCandidate._compact,
    };

    const out = await etoile.request("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (out.ok) {
      this.closeCheckinStudio();
      await this.refreshData();
      if (this.currentView === "unmatched") {
        await this.loadUnmatchedView();
      }
      if (out.restaurant) {
        const stars = out.restaurant.max_stars || 0;
        this.toast(
          out.is_new_restaurant
            ? `新席归档：${out.restaurant.shop}（+${stars} ★）`
            : `已为 ${out.restaurant.shop} 增补记录`
        );
        this.openDossier(out.restaurant.id);
      } else {
        this.toast("私享记录已归档");
        this.switchView("chronicle");
      }
    } else {
      this.toast(out.error || "保存失败");
    }
  }

  openCloudSyncModal() {
    const backdrop = document.getElementById("sync-backdrop");
    const card = document.getElementById("sync-modal-card");
    if (!backdrop || !card) return;
    const onPages = !etoileUseLocalApi;
    card.innerHTML = `
      <div class="menu-top-bar">
        <span>CARNET PRIVÉ · 手记只留在这台设备</span>
        <button class="text-action-btn" onclick="app.closeCloudSyncModal()">FERMER</button>
      </div>
      <div style="padding:22px 22px 28px;">
        <p style="font-family:'Noto Serif SC',serif; font-size:18px; line-height:1.55; margin:0 0 14px;">
          ${onPages
            ? "公开页面只有摘星名录。品鉴手记写在这台手机的浏览器里，不会回到 GitHub。"
            : "这台电脑仍写回本地档案。导出的手记文件可以在手机上导入。"}
        </p>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px;">
          <button class="btn-inscribe" onclick="app.exportPrivateNotes()">导出手记</button>
          <button class="btn-inscribe" onclick="document.getElementById('etoile-import-file').click()">导入手记</button>
          <input id="etoile-import-file" type="file" accept="application/json" hidden onchange="app.importPrivateNotes(event)" />
        </div>
        <label style="font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.14em;">OPTIONAL SECRET GIST TOKEN</label>
        <input id="etoile-gist-token" type="password" autocomplete="off" placeholder="粘贴后只保存在本机" style="width:100%; margin:8px 0 12px; padding:10px; border:1px solid var(--line-heavy); background:transparent; font-family:'JetBrains Mono',monospace;" />
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="efs-tag" onclick="app.pushPrivateGist()">上传到私人 Gist</button>
          <button class="efs-tag" onclick="app.pullPrivateGist()">从私人 Gist 取回</button>
        </div>
      </div>
    `;
    const tokenInput = document.getElementById("etoile-gist-token");
    if (tokenInput) tokenInput.value = localStorage.getItem("etoile_gist_token") || "";
    backdrop.classList.add("open");
  }

  closeCloudSyncModal() {
    document.getElementById("sync-backdrop")?.classList.remove("open");
  }

  exportPrivateNotes() {
    etoile.exportOverlay();
    this.toast("手记文件已下载，请自行传到手机");
  }

  async importPrivateNotes(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      etoile.importOverlay(await file.text());
      await this.refreshData();
      this.toast("手记已导入这台设备");
      this.closeCloudSyncModal();
    } catch {
      this.toast("这份文件无法读取");
    }
  }

  async pushPrivateGist() {
    const token = document.getElementById("etoile-gist-token")?.value.trim();
    if (!token) {
      this.toast("先粘贴一个只保存在本机的 token");
      return;
    }
    try {
      await etoile.pushGist(token);
      this.toast("已写入私人 Gist");
    } catch {
      this.toast("私人 Gist 没有写成");
    }
  }

  async pullPrivateGist() {
    const token = document.getElementById("etoile-gist-token")?.value.trim();
    if (!token) {
      this.toast("先粘贴一个只保存在本机的 token");
      return;
    }
    try {
      await etoile.pullGist(token);
      await this.refreshData();
      this.toast("已从私人 Gist 取回手记");
      this.closeCloudSyncModal();
    } catch {
      this.toast("私人 Gist 没有取回");
    }
  }

  toast(message) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const el = document.createElement("div");
    el.className = "toast-msg";
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
}

const app = new EtoileApp();
window.addEventListener("DOMContentLoaded", () => {
  app.init();
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      app.closeDossier();
      app.closeCheckinStudio();
    }
  });
});
