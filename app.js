// Banc typo — aucune dépendance, aucun build.
(() => {
  "use strict";

  // italic: false pour les familles sans italique sur Google Fonts (sinon la requête css2 répond 400).
  const FONTS = [
    { family: "Manrope", kind: "sans", italic: false, note: "actuelle" },
    { family: "IBM Plex Serif", kind: "serif" },
    { family: "Zilla Slab", kind: "serif" },
    { family: "Bitter", kind: "serif" },
    { family: "Newsreader", kind: "serif" },
    { family: "Source Serif 4", kind: "serif" },
    { family: "Hanken Grotesk", kind: "sans" },
    { family: "Public Sans", kind: "sans" },
    { family: "Schibsted Grotesk", kind: "sans" },
    { family: "Geist", kind: "sans", italic: false },
    { family: "Inter", kind: "sans" },
    { family: "Source Sans 3", kind: "sans" },
  ];

  const DEFAULTS = {
    body: "Manrope",
    heading: "", // "" = identique au corps
    size: 11,
    lh: 1.6,
    ps: 0.75,
    hw: 600,
    ht: 0,
    hb: 0.5, // espace avant les titres (em du titre)
    ha: 0.5, // espace après
    justify: true,
    view: "page",
    compare: ["Manrope", "Source Serif 4", "Inter"],
  };

  const STORE_STATE = "typo-showcase:state";
  const STORE_TEXT = "typo-showcase:text";

  const $ = (sel) => document.querySelector(sel);
  const byFamily = (f) => FONTS.find((x) => x.family === f);
  const stack = (f) => {
    const font = byFamily(f);
    const fallback = font && font.kind === "serif" ? "Georgia, serif" : "system-ui, sans-serif";
    return `"${f}", ${fallback}`;
  };

  // ---------------------------------------------------------------- stockage
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, v) { try { localStorage.setItem(key, v); } catch { /* navigation privée */ } },
    del(key) { try { localStorage.removeItem(key); } catch { /* idem */ } },
  };

  function readHash() {
    const params = new URLSearchParams(location.hash.slice(1));
    const out = {};
    for (const [k, v] of params) {
      if (k === "compare") out.compare = v.split("|").filter(byFamily);
      else if (k === "justify") out.justify = v === "1";
      else if (["size", "lh", "ps", "hw", "ht", "hb", "ha"].includes(k)) out[k] = Number(v);
      else out[k] = v;
    }
    if (out.body && !byFamily(out.body)) delete out.body;
    if (out.heading && !byFamily(out.heading)) delete out.heading;
    return out;
  }

  function writeHash() {
    const p = new URLSearchParams();
    for (const k of Object.keys(DEFAULTS)) {
      const v = state[k];
      if (k === "compare") p.set(k, v.join("|"));
      else if (k === "justify") p.set(k, v ? "1" : "0");
      else p.set(k, String(v));
    }
    history.replaceState(null, "", "#" + p.toString());
  }

  let saved = {};
  try { saved = JSON.parse(store.get(STORE_STATE) || "{}"); } catch { saved = {}; }
  // Le lien partagé a priorité sur la mémoire locale.
  const state = { ...DEFAULTS, ...saved, ...readHash() };
  // Une police retirée de FONTS peut traîner dans la mémoire locale ou un vieux lien.
  if (!byFamily(state.body)) state.body = DEFAULTS.body;
  if (state.heading && !byFamily(state.heading)) state.heading = "";
  state.compare = (Array.isArray(state.compare) ? state.compare : DEFAULTS.compare).filter(byFamily);

  // ---------------------------------------------------------------- polices
  FONTS.forEach(({ family, italic }) => {
    const axes = italic === false
      ? "wght@400;500;600;700"
      : "ital,wght@0,400;0,500;0,600;0,700;1,400;1,700";
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:${axes}&display=swap`;
    link.onerror = () => {
      document.querySelectorAll(`option[value="${family}"]`).forEach((o) => { o.textContent += " (non chargée)"; });
    };
    document.head.appendChild(link);
  });

  // ---------------------------------------------------------------- contrôles
  const bodySel = $("#bodyFont");
  const headSel = $("#headingFont");

  function fillSelect(sel, withSame) {
    if (withSame) sel.add(new Option("Identique au corps", ""));
    for (const kind of ["serif", "sans"]) {
      const group = document.createElement("optgroup");
      group.label = kind === "serif" ? "Serif" : "Sans serif";
      FONTS.filter((f) => f.kind === kind).forEach((f) => {
        group.appendChild(new Option(f.note ? `${f.family} — ${f.note}` : f.family, f.family));
      });
      sel.appendChild(group);
    }
  }
  fillSelect(bodySel, false);
  fillSelect(headSel, true);

  const ranges = {
    size: { el: $("#fontSize"), fmt: (v) => `${v} pt` },
    lh: { el: $("#lineHeight"), fmt: (v) => v.toFixed(2) },
    ps: { el: $("#paraSpace"), fmt: (v) => `${v.toFixed(2)} em` },
    hw: { el: $("#headingWeight"), fmt: (v) => String(v) },
    ht: { el: $("#headingTracking"), fmt: (v) => `${v > 0 ? "+" : ""}${v.toFixed(3)} em` },
    hb: { el: $("#headingBefore"), fmt: (v) => `${v.toFixed(2)} em` },
    ha: { el: $("#headingAfter"), fmt: (v) => `${v.toFixed(2)} em` },
  };

  const compareList = $("#compareList");
  FONTS.forEach((f) => {
    const label = document.createElement("label");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.value = f.family;
    box.addEventListener("change", () => {
      state.compare = FONTS.map((x) => x.family).filter((fam) =>
        compareList.querySelector(`input[value="${fam}"]`).checked);
      update();
    });
    label.append(box, " ", f.family);
    compareList.appendChild(label);
  });

  // ---------------------------------------------------------------- rendu
  const root = document.documentElement;
  const page = $("#page");
  const sampleHtml = $("#sample").innerHTML.trim();
  page.innerHTML = store.get(STORE_TEXT) || sampleHtml;

  function headingFamily(body) { return state.heading || body; }

  function applyVars() {
    root.style.setProperty("--body-font", stack(state.body));
    root.style.setProperty("--heading-font", stack(headingFamily(state.body)));
    root.style.setProperty("--font-size", `${state.size}pt`);
    root.style.setProperty("--line-height", String(state.lh));
    root.style.setProperty("--para-space", `${state.ps}em`);
    root.style.setProperty("--heading-weight", String(state.hw));
    root.style.setProperty("--heading-weight-h1", String(Math.min(state.hw + 100, 700)));
    root.style.setProperty("--heading-tracking", `${state.ht}em`);
    root.style.setProperty("--heading-before", `${state.hb}em`);
    root.style.setProperty("--heading-after", `${state.ha}em`);
    root.style.setProperty("--text-align", state.justify ? "justify" : "left");
    root.style.setProperty("--hyphens", state.justify ? "auto" : "manual");
  }

  function syncControls() {
    bodySel.value = state.body;
    headSel.value = state.heading;
    for (const [k, { el, fmt }] of Object.entries(ranges)) {
      el.value = state[k];
      document.querySelector(`output[for="${el.id}"]`).textContent = fmt(Number(state[k]));
    }
    $("#justify").checked = state.justify;
    compareList.querySelectorAll("input").forEach((b) => { b.checked = state.compare.includes(b.value); });

    document.querySelectorAll(".tabs button").forEach((b) => {
      b.setAttribute("aria-selected", String(b.dataset.view === state.view));
    });
    $("#viewPage").hidden = state.view !== "page";
    $("#viewCompare").hidden = state.view !== "compare";
    $("#viewGrid").hidden = state.view !== "grid";
    $("#compareGroup").hidden = state.view !== "compare";
  }

  function pick(family) {
    state.body = family;
    state.view = "page";
    update();
    $("#viewPage .scroll").scrollTop = 0;
  }

  function renderCompare() {
    const strip = $("#compareStrip");
    strip.replaceChildren();
    if (!state.compare.length) {
      const p = document.createElement("p");
      p.className = "compare-empty";
      p.textContent = "Coche au moins une police dans le panneau.";
      strip.appendChild(p);
      return;
    }
    const html = page.innerHTML;
    state.compare.forEach((family) => {
      const col = document.createElement("div");
      col.className = "compare-col";
      const label = document.createElement("div");
      label.className = "compare-col__label";
      const name = document.createElement("span");
      name.textContent = family;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Ouvrir en page →";
      btn.addEventListener("click", () => pick(family));
      label.append(name, btn);
      const art = document.createElement("article");
      art.className = "rte-page";
      art.innerHTML = html;
      art.style.setProperty("--body-font", stack(family));
      art.style.setProperty("--heading-font", stack(headingFamily(family)));
      col.append(label, art);
      strip.appendChild(col);
    });
  }

  const CARD_TITLE = "Article 7 — Conditions financières";
  const CARD_TEXT = "En contrepartie de la transmission du savoir-faire, le Franchisé versera au Franchiseur une redevance d'exploitation de 6 % du chiffre d'affaires hors taxes, payable le 10 de chaque mois. Toute somme non réglée à l'échéance portera intérêt de plein droit.";
  const CARD_DIGITS = "0123456789 · 25 000,00 € · L. 330-3 · « fi fl ffi » · Éè àç Œœ";

  function renderGrid() {
    const grid = $("#grid");
    grid.replaceChildren();
    FONTS.forEach((f) => {
      const card = document.createElement("div");
      card.className = "card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(f.family); }
      });
      if (f.family === state.body) card.setAttribute("aria-current", "true");
      card.style.setProperty("--card-font", stack(f.family));
      if (state.heading) card.style.setProperty("--card-heading-font", stack(state.heading));
      card.innerHTML = `
        <div class="card__head"><strong></strong><span></span></div>
        <div class="card__body">
          <h3></h3><p></p><p><em>Le Franchisé reconnaît avoir reçu le DIP.</em> <strong>Fait à Paris.</strong></p>
          <p class="card__digits"></p>
        </div>`;
      card.querySelector("strong").textContent = f.family;
      card.querySelector(".card__head span").textContent =
        (f.kind === "serif" ? "Serif" : "Sans serif") + (f.note ? ` · ${f.note}` : "");
      card.querySelector("h3").textContent = CARD_TITLE;
      card.querySelector(".card__body p").textContent = CARD_TEXT;
      card.querySelector(".card__digits").textContent = CARD_DIGITS;
      card.addEventListener("click", () => pick(f.family));
      grid.appendChild(card);
    });
  }

  function update() {
    applyVars();
    syncControls();
    if (state.view === "compare") renderCompare();
    if (state.view === "grid") renderGrid();
    store.set(STORE_STATE, JSON.stringify(state));
    writeHash();
  }

  // ---------------------------------------------------------------- événements
  bodySel.addEventListener("change", () => { state.body = bodySel.value; update(); });
  headSel.addEventListener("change", () => { state.heading = headSel.value; update(); });
  for (const [k, { el }] of Object.entries(ranges)) {
    el.addEventListener("input", () => { state[k] = Number(el.value); update(); });
  }
  $("#justify").addEventListener("change", (e) => { state.justify = e.target.checked; update(); });
  document.querySelectorAll(".tabs button").forEach((b) => {
    b.addEventListener("click", () => { state.view = b.dataset.view; update(); });
  });

  let saveTimer;
  page.addEventListener("input", () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => store.set(STORE_TEXT, page.innerHTML), 400);
  });

  // ← → : police du corps précédente / suivante, sauf pendant une saisie.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const t = e.target;
    if (t.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName) || $("#textDialog").open) return;
    e.preventDefault();
    const i = FONTS.findIndex((f) => f.family === state.body);
    const n = FONTS.length;
    state.body = FONTS[(i + (e.key === "ArrowRight" ? 1 : -1) + n) % n].family;
    update();
  });

  // M maintenue : coup d'œil sur Manrope, sans toucher aux réglages.
  const isTyping = (t) => t.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName) || $("#textDialog").open;
  const peek = (on) => root.classList.toggle("peek", on);
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() !== "m" || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
    e.preventDefault();
    peek(true);
  });
  document.addEventListener("keyup", (e) => { if (e.key.toLowerCase() === "m") peek(false); });
  window.addEventListener("blur", () => peek(false));

  const toast = $("#toast");
  let toastTimer;
  function say(msg) {
    toast.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.textContent = ""; }, 2500);
  }
  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); say(msg); }
    catch { window.prompt("Copie manuelle :", text); }
  }

  function cssSnippet() {
    const body = state.body;
    const head = headingFamily(body);
    const families = [...new Set([body, head])];
    const imports = families.map((f) => f.replace(/ /g, "_")).join(", ");
    const headRule = head !== body ? `\n  font-family: ${stack(head)};` : "";
    return `/* components/rich-editor/styles/editor.css */
/* Police(s) : ${families.join(" + ")} — Next : import { ${imports} } from "next/font/google" */

.rte-wrapper .ProseMirror {
  font-family: ${stack(body)};
  line-height: ${state.lh};${state.justify ? "\n  text-align: justify;\n  hyphens: auto;" : ""}
}
.rte-wrapper.page-layout .ProseMirror { font-size: ${state.size}pt; }
.rte-wrapper .ProseMirror p { margin: 0 0 ${state.ps}em 0; }

.rte-wrapper .ProseMirror :is(h1, h2, h3, h4, h5, h6) {${headRule}
  font-weight: ${state.hw};
  letter-spacing: ${state.ht}em;
  margin: ${state.hb}em 0 ${state.ha}em;
}
.rte-wrapper .ProseMirror h1 { font-weight: ${Math.min(state.hw + 100, 700)}; }
`;
  }

  $("#copyCss").addEventListener("click", () => copy(cssSnippet(), "CSS copié."));
  $("#share").addEventListener("click", () => copy(location.href, "Lien copié (réglages inclus, pas le texte)."));
  $("#reset").addEventListener("click", () => {
    Object.assign(state, DEFAULTS);
    update();
    say("Réglages réinitialisés.");
  });

  // ---------------------------------------------------------------- texte perso
  const dialog = $("#textDialog");
  const input = $("#textInput");

  const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function plainToHtml(text) {
    const out = [];
    let list = [];
    const flush = () => { if (list.length) { out.push(`<ul>${list.join("")}</ul>`); list = []; } };
    text.replace(/\r\n?/g, "\n").split(/\n\s*\n/).forEach((block) => {
      block.split("\n").forEach((raw) => {
        const line = raw.trim();
        if (!line) return;
        const h = line.match(/^(#{1,6})\s+(.*)$/);
        const li = line.match(/^[-*•]\s+(.*)$/);
        if (li) { list.push(`<li>${escapeHtml(li[1])}</li>`); return; }
        flush();
        if (h) out.push(`<h${h[1].length}>${escapeHtml(h[2])}</h${h[1].length}>`);
        else out.push(`<p>${escapeHtml(line)}</p>`);
      });
      flush();
    });
    return out.join("\n");
  }

  // Le HTML collé est rendu dans la page : on retire scripts et gestionnaires d'événements.
  function sanitize(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script, style, iframe, object, embed, link, meta").forEach((n) => n.remove());
    doc.querySelectorAll("*").forEach((el) => {
      [...el.attributes].forEach((a) => {
        if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name);
      });
    });
    return doc.body.innerHTML;
  }

  $("#editText").addEventListener("click", () => { input.value = ""; dialog.showModal(); input.focus(); });
  dialog.addEventListener("close", () => {
    if (dialog.returnValue === "apply" && input.value.trim()) {
      const v = input.value.trim();
      page.innerHTML = /<\/?[a-z][\s\S]*>/i.test(v) ? sanitize(v) : plainToHtml(v);
      store.set(STORE_TEXT, page.innerHTML);
      update();
      say("Texte remplacé.");
    } else if (dialog.returnValue === "restore") {
      page.innerHTML = sampleHtml;
      store.del(STORE_TEXT);
      update();
      say("Texte d'origine restauré.");
    }
  });

  update();
})();
