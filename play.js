/* HANK · Play — Dagvald athletic Fire lane + game boards.
   Kid uses sparks/cards + checkoffs + "tell Dad" notes. Parent is the only Grok operator.
   Notes POST to /api/answer (capture queue) and save locally. Does not touch Castle money. */
(function () {
  "use strict";

  var KID = window.PLAY_KID || "Dagvald";
  var LS = "hank.play." + KID;
  var state = loadState();

  var GAMES = window.PLAY_DATA.GAMES;
  var INTERESTS = window.PLAY_DATA.INTERESTS;
  var CARDS = window.PLAY_DATA.CARDS;
  var SPARKS = (window.PLAY_DATA.SPARKS || []).slice();
  function loadSparkOverlay() {
    fetch("/api/play/sparks", { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.ok || !Array.isArray(j.overlay) || !j.overlay.length) return;
      var ids = {};
      SPARKS.forEach(function (s) { ids[s.id] = true; });
      j.overlay.forEach(function (s) { if (s && s.id && !ids[s.id]) { SPARKS.unshift(s); ids[s.id] = true; } });
      if (view === "fire") render();
    }).catch(function () {});
  }


  var VIBES = [
    "Play loud. Think quiet.",
    "Jokić vision. Jones power. Your build.",
    "One spark. One step. Tell Dad.",
    "Film. Feet. Finish."
  ];

  function loadState() {
    var s = { interests: ["minecraft", "hogwarts"], done: {}, notes: [], ideas: [], custom: [] };
    try {
      var raw = localStorage.getItem(LS);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p === "object") {
          if (Array.isArray(p.interests)) s.interests = p.interests;
          if (p.done && typeof p.done === "object") s.done = p.done;
          if (Array.isArray(p.notes)) s.notes = p.notes;
          if (Array.isArray(p.ideas)) s.ideas = p.ideas;
          if (Array.isArray(p.custom)) s.custom = p.custom;
        }
      }
    } catch (e) {}
    return s;
  }
  function saveState() {
    try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {}
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  var css = "" +
    ":root{--ink:#e8f0e4;--muted:#8a9a88;--line:#1e2a20;--paper:#121814;--lime:#b8ff3c;--bg:#0b0f0c;--mc:#3d8c3a;--hw:#c9923d}" +
    "*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg);color:var(--ink);font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif;-webkit-tap-highlight-color:transparent}" +
    ".chead{background:linear-gradient(165deg,#0d1510 0%,#0b0f0c 60%,#121a10 100%);color:#fff;padding:calc(12px + env(safe-area-inset-top)) 14px 0;border-bottom:1px solid #1a241c}" +
    ".cbar{display:flex;align-items:center;justify-content:space-between;gap:10px}" +
    ".chead h1{margin:0;font-size:18px;font-weight:900;letter-spacing:-.3px}" +
    ".csub{margin:4px 0 0;opacity:.75;font-size:12px}" +
    ".backchip{display:inline-flex;text-decoration:none;color:#fff;font-size:12px;font-weight:800;padding:7px 11px;border-radius:999px;background:rgba(184,255,60,.12);border:1px solid rgba(184,255,60,.25)}" +
    ".tabs{display:flex;gap:4px;margin-top:10px;overflow:auto;-webkit-overflow-scrolling:touch}" +
    ".tab{color:#c5d4c2;text-decoration:none;font-size:12px;font-weight:700;padding:8px 10px;border-radius:10px 10px 0 0;opacity:.7;white-space:nowrap}" +
    ".tab.active{background:var(--paper);color:var(--lime);opacity:1}" +
    ".wrap{max-width:560px;margin:0 auto;padding:12px 12px 96px}" +
    ".lane{display:flex;gap:6px;margin:10px 0 14px;overflow:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}" +
    ".lane::-webkit-scrollbar{display:none}" +
    ".sw{flex:0 0 auto;min-width:72px;border:1px solid #243028;border-radius:16px;padding:14px 16px;font-weight:900;font-size:15px;cursor:pointer;background:#121814;color:#c5d4c2;letter-spacing:-.2px}" +
    ".sw.on{background:var(--lime);color:#0b0f0c;border-color:var(--lime);box-shadow:0 0 24px rgba(184,255,60,.25)}" +
    ".sw.on-mc{background:#3d8c3a;color:#fff;border-color:#3d8c3a}" +
    ".sw.on-hw{background:#8a5a12;color:#fff;border-color:#8a5a12}" +
    ".fire-hero{border-radius:22px;padding:18px 16px;margin:0 0 14px;background:linear-gradient(145deg,#142018 0%,#0b0f0c 55%,#1a2210 100%);border:1px solid #243028;position:relative;overflow:hidden}" +
    ".fire-hero::after{content:'';position:absolute;right:-20px;top:-20px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(184,255,60,.22),transparent 70%);pointer-events:none}" +
    ".fire-kicker{font-size:11px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;color:var(--lime);margin:0 0 6px}" +
    ".fire-hero h2{margin:0;font-size:28px;font-weight:900;letter-spacing:-.8px;line-height:1.1}" +
    ".vibe{margin:10px 0 0;font-size:15px;font-weight:700;color:#d7e8c8;min-height:1.3em;transition:opacity .4s ease}" +
    ".vibe.fade{opacity:.35}" +
    ".fchips{display:flex;gap:8px;overflow:auto;margin:0 0 14px;padding-bottom:2px;-webkit-overflow-scrolling:touch}" +
    ".fchip{flex:0 0 auto;border:1px solid #2a382c;background:#121814;color:#c5d4c2;border-radius:999px;padding:10px 14px;font-weight:800;font-size:13px;cursor:pointer}" +
    ".fchip.on{background:var(--lime);color:#0b0f0c;border-color:var(--lime)}" +
    ".spark{background:#121814;border:1px solid #243028;border-radius:20px;margin:0 0 14px;overflow:hidden;cursor:pointer;transition:transform .15s ease,border-color .15s}" +
    ".spark:active{transform:scale(.99)}" +
    ".spark.open{border-color:var(--lime);cursor:default}" +
    ".spark-img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#1a2218}.spark-fallback{height:140px;display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:900;background:linear-gradient(135deg,#1e2a20,#0b0f0c);color:var(--lime);border-bottom:1px solid #243028}" +
    ".spark-body{padding:14px 14px 16px}" +
    ".spark-title{font-weight:900;font-size:20px;letter-spacing:-.4px;line-height:1.2;margin:0 0 6px}" +
    ".spark-why{font-size:14px;line-height:1.4;color:var(--muted);margin:0}" +
    ".spark-tag{display:inline-block;font-size:10px;font-weight:900;letter-spacing:.8px;text-transform:uppercase;color:var(--lime);margin:0 0 8px}" +
    ".spark-x{display:none;width:100%;margin:0 0 10px;border:0;border-radius:14px;padding:14px;font-weight:900;font-size:16px;background:#1e2a20;color:var(--ink);cursor:pointer}" +
    ".spark.open .spark-x{display:block}" +
    ".spark-more{display:none;margin-top:12px}" +
    ".spark.open .spark-more{display:block}" +
    ".spark.open .spark-img{max-height:160px}" +
    ".facts{margin:0;padding:0 0 0 18px}" +
    ".facts li{margin:0 0 8px;font-size:14px;line-height:1.4;color:#d0ddc8}" +
    ".ytwrap{position:relative;width:100%;aspect-ratio:16/9;margin:10px 0;border-radius:12px;overflow:hidden;background:#000}" +
    ".ytwrap iframe{position:absolute;inset:0;width:100%;height:100%;border:0}" +
    ".linkboard{display:inline-flex;margin:8px 0 0;padding:10px 14px;border-radius:12px;background:rgba(184,255,60,.12);color:var(--lime);font-weight:800;font-size:13px;border:1px solid rgba(184,255,60,.3);cursor:pointer}" +
    ".chrome-hide .chead .tabs,.chrome-hide .lane{display:none}" +
    ".hero{border-radius:22px;padding:16px 16px 14px;margin:8px 0 14px;color:#143018;position:relative;overflow:hidden}" +
    ".hero.mc{background:radial-gradient(120% 80% at 100% 0%,#b7e38a 0%,#7bc36a 40%,#4e9a4a 100%)}" +
    ".hero.hw{background:radial-gradient(120% 80% at 0% 0%,#f3d48a 0%,#c9923d 45%,#7a4314 100%);color:#2a1a08}" +
    ".hero h2{margin:0;font-size:26px;letter-spacing:-.6px}" +
    ".hero p{margin:6px 0 0;font-size:13.5px;line-height:1.45;opacity:.92}" +
    ".switch{display:flex;gap:8px;margin:0 0 12px}" +
    ".card{background:#121814;border:1px solid #243028;border-radius:18px;padding:14px;margin:0 0 12px}" +
    ".meta{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 8px}" +
    ".pill{font-size:11px;font-weight:700;padding:3px 8px;border-radius:99px;background:#1e2a20;color:#a8bda6}" +
    ".why{font-size:13.5px;line-height:1.45;margin:0 0 8px;color:#c5d4c2}" +
    ".card-face{display:flex;flex-direction:column;gap:10px}" +
    ".card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}" +
    ".ctitle{font-weight:900;font-size:18px;letter-spacing:-.3px;line-height:1.25}" +
    ".card-vibe{font-size:14px;line-height:1.35;color:#c5d4c2;margin:0}" +
    ".card-time{font-size:12px;font-weight:800;color:var(--muted)}" +
    ".card-cta{width:100%;border:0;border-radius:16px;padding:16px 18px;font-weight:900;font-size:17px;letter-spacing:-.2px;cursor:pointer;background:var(--lime);color:#0b0f0c;-webkit-tap-highlight-color:transparent}" +
    ".card-cta:active{transform:scale(.985)}" +
    ".card-chrome{display:flex;align-items:center;gap:8px;margin-top:2px}" +
    ".morebtn{flex:0 0 auto;width:44px;height:44px;border-radius:14px;border:1px solid #2a382c;background:#1e2a20;color:var(--ink);font-weight:900;font-size:18px;cursor:pointer}" +
    ".overflow{position:relative}" +
    ".overflow-menu{display:none;position:absolute;right:0;bottom:calc(100% + 6px);min-width:180px;background:#121814;border:1px solid #2a382c;border-radius:14px;padding:6px;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.45)}" +
    ".overflow.open .overflow-menu{display:block}" +
    ".overflow-menu button{display:block;width:100%;text-align:left;border:0;background:transparent;color:var(--ink);font-weight:700;font-size:14px;padding:12px 12px;border-radius:10px;cursor:pointer}" +
    ".overflow-menu button:active{background:#1e2a20}" +
    ".pack{font-size:12.5px;color:var(--muted);margin:8px 0 0}" +
    ".actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}" +
    ".btnp{background:var(--lime);color:#0b0f0c;border:0;border-radius:11px;padding:11px 14px;font-weight:900;font-size:13px;cursor:pointer}" +
    ".btns{background:#1e2a20;color:var(--ink);border:1px solid #2a382c;border-radius:11px;padding:11px 14px;font-weight:700;font-size:13px;cursor:pointer}" +
    ".done{outline:2px solid var(--lime);background:#142018}" +
    ".guide-sheet{position:fixed;inset:0;z-index:80;background:#0b0f0c;display:flex;flex-direction:column;padding:calc(10px + env(safe-area-inset-top)) 14px calc(14px + env(safe-area-inset-bottom));max-width:560px;margin:0 auto}" +
    ".guide-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}" +
    ".guide-bar h2{margin:0;font-size:16px;font-weight:900;letter-spacing:-.2px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".guide-x{border:0;background:#1e2a20;color:var(--ink);border-radius:12px;padding:10px 14px;font-weight:900;font-size:14px;cursor:pointer}" +
    ".guide-progress{font-size:12px;font-weight:800;color:var(--muted);margin:0 0 12px}" +
    ".guide-stage{flex:1;min-height:0;display:flex;flex-direction:column;touch-action:pan-y}" +
    ".guide-pic{flex:1;min-height:180px;border-radius:22px;display:flex;align-items:center;justify-content:center;font-size:64px;font-weight:900;color:#0b0f0c;position:relative;overflow:hidden;border:1px solid #243028}" +
    ".guide-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}" +
    ".guide-pic .ph{position:relative;z-index:1;text-align:center;padding:20px}" +
    ".guide-pic .ph small{display:block;font-size:13px;font-weight:800;opacity:.7;margin-top:8px}.guide-pic.has-diagram{padding:0;background:#0f1410!important}.guide-pic .diagram{position:absolute;inset:0;display:flex}.guide-pic .diagram svg{width:100%;height:100%;display:block}" +
    ".guide-cap{margin:16px 0 0;font-size:22px;font-weight:900;letter-spacing:-.4px;line-height:1.25;text-align:center;min-height:2.6em}" +
    ".guide-nav{display:flex;gap:10px;margin-top:16px}" +
    ".guide-nav button{flex:1;border:0;border-radius:16px;padding:16px;font-weight:900;font-size:16px;cursor:pointer}" +
    ".guide-nav .back{background:#1e2a20;color:var(--ink);border:1px solid #2a382c}" +
    ".guide-nav .next{background:var(--lime);color:#0b0f0c}" +
    ".guide-nav .next:disabled,.guide-nav .back:disabled{opacity:.35}" +
    ".guide-end{flex:1;display:flex;flex-direction:column;justify-content:center;gap:12px;text-align:center}" +
    ".guide-end h3{margin:0 0 6px;font-size:26px;font-weight:900;letter-spacing:-.6px}" +
    ".guide-end p{margin:0 0 18px;color:var(--muted);font-size:15px}" +
    ".guide-end .btnp,.guide-end .btns{width:100%;padding:16px;border-radius:16px;font-size:16px}" +
    ".h{font-size:12px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--muted);margin:18px 4px 8px}" +
    ".chips{display:flex;flex-wrap:wrap;gap:8px}" +
    ".chip{border:1px solid #2a382c;background:#121814;border-radius:999px;padding:8px 12px;font-weight:700;font-size:13px;cursor:pointer;color:#c5d4c2}" +
    ".chip.on{background:var(--lime);color:#0b0f0c;border-color:var(--lime)}" +
    "textarea,input[type=text]{width:100%;border:1px solid #2a382c;border-radius:12px;padding:12px;font:inherit;font-size:15px;background:#0b0f0c;color:var(--ink)}" +
    "textarea{min-height:88px;resize:vertical}" +
    ".note{font-size:13px;color:var(--muted);line-height:1.45}" +
    ".toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#142016;color:#fff;padding:10px 16px;border-radius:99px;font-size:14px;opacity:0;transition:.2s;z-index:60;pointer-events:none;border:1px solid #2a382c}.toast.on{opacity:1}" +
    ".idea{border-top:1px solid #243028;padding:10px 0;font-size:14px}" +
    ".idea:first-child{border-top:0}" +
    ".st{font-size:11px;color:var(--muted)}" +
    ".parent{font-size:12.5px;background:#1a1810;border:1px solid #3a3420;border-radius:14px;padding:12px;line-height:1.45;color:#d4c89a}" +
    ".searchbar{display:flex;gap:8px;margin:0 0 12px}.searchbar input{flex:1;border:0;border-radius:14px;padding:14px 14px;font:inherit;font-size:16px;font-weight:700;background:#151b16;color:#f2f7ef}.searchbar button{border:0;border-radius:14px;padding:14px 16px;font-weight:900;background:var(--neon);color:#0b0f0c;cursor:pointer}.sres{display:flex;flex-direction:column;gap:10px;margin:0 0 16px}.sres a{display:block;background:#151b16;border:1px solid #243028;border-radius:16px;padding:14px;text-decoration:none;color:#f2f7ef}.sres .stitle{font-weight:900;font-size:15px;margin:0 0 4px}.sres .ssnip{font-size:13px;color:#9aa89c;line-height:1.35}.sres .sact{margin-top:8px}.sempty{font-size:13px;color:#9aa89c;padding:8px 2px 14px}.gpedia-card{background:#121814;border:1px solid #2a382c;border-radius:18px;padding:14px;margin:0 0 12px}.gpedia-kicker{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8fd18a;margin:0 0 4px}.gpedia-title{font-size:18px;font-weight:900;margin:0 0 6px}.gpedia-note{font-size:13px;color:var(--muted);margin:0 0 12px;line-height:1.35}.srow{background:#151b16;border:1px solid #243028;border-radius:14px;padding:12px;margin:0 0 8px}.srow .stitle{font-weight:900;font-size:15px;margin:0 0 4px}.srow .ssnip{font-size:13px;color:#9aa89c;line-height:1.35}.srow .sact{margin-top:8px;display:flex;flex-wrap:wrap;gap:8px}";

  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);
  var theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.setAttribute("content", "#0b0f0c");

  var game = "minecraft";
  var view = "fire";
  var fireFilter = "jokic";
  var openSpark = null;
  var vibeIdx = 0;
  var vibeTimer = null;
  var guideCardId = null;
  var guideIdx = 0;
  var guideEnd = false;
  var overflowId = null;
  var guideTouchX = null;

  var GUIDE_COLORS = ["#b8ff3c", "#7bc36a", "#c9923d", "#6ec6ff", "#e8a0ff", "#ffb86c", "#8ad4a0", "#f0e68c"];
  var GUIDE_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"];

  function header() {
    return '<header class="chead"><div class="cbar"><div><a class="backchip" href="kids.html">← Kids</a> <h1 style="display:inline;margin-left:6px">Play</h1></div>' +
      '<a id="dadExit" class="backchip" href="./" style="display:none">Dad · HANK home</a></div>' +
      '<p class="csub">Fire · boards · tell Dad — parent-curated only</p>' +
      '<div class="tabs">' +
      '<a class="tab" href="kids.html">Kids</a>' +
      '<a class="tab active" href="play.html">Play</a>' +
      '<a class="tab" href="dagvald.html">Dagvald Fund</a>' +
      '<a class="tab" href="davikja.html">Davikja</a>' +
      "</div></header>";
  }
  function showDadExitIfParent() {
    fetch("/api/session", { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (j) {
      var el = document.getElementById("dadExit");
      if (el && j && j.parent) el.style.display = "inline-flex";
    }).catch(function () {});
  }

  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.className = "toast on";
    setTimeout(function () { t.className = "toast"; }, 1800);
  }

  function fileNote(kind, gameId, text, extra) {
    var row = {
      source: "play",
      kid: KID,
      kind: kind,
      game: gameId || game,
      text: String(text || "").slice(0, 800),
      extra: extra || {},
      ts: Date.now()
    };
    state.notes.unshift({ kind: kind, game: row.game, text: row.text, ts: row.ts });
    if (state.notes.length > 40) state.notes.length = 40;
    saveState();
    fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row)
    }).then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) { toast(j && j.ok ? "Dad will see this" : "Saved on this device"); })
      .catch(function () { toast("Saved on this device"); });
  }

  function startVibeCycle() {
    if (vibeTimer) clearInterval(vibeTimer);
    vibeTimer = setInterval(function () {
      var el = document.getElementById("vibeLine");
      if (!el) return;
      el.classList.add("fade");
      setTimeout(function () {
        vibeIdx = (vibeIdx + 1) % VIBES.length;
        el.textContent = VIBES[vibeIdx];
        el.classList.remove("fade");
      }, 280);
    }, 4200);
  }


  function shortCaption(text, maxWords) {
    var words = String(text || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "";
    if (words.length <= maxWords) return words.join(" ");
    return words.slice(0, maxWords).join(" ") + "…";
  }

  function findCard(id) {
    var lists = [CARDS.minecraft || [], CARDS.hogwarts || []];
    for (var i = 0; i < lists.length; i++) {
      for (var j = 0; j < lists[i].length; j++) {
        if (lists[i][j].id === id) return lists[i][j];
      }
    }
    return null;
  }


  // Inline SVG diagrams for guide sheets (no external images; kid-safe).
  var DIAGRAMS = {
    site: function () {
      return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="200" height="160" fill="#1a2e14"/>' +
        '<ellipse cx="100" cy="110" rx="70" ry="22" fill="#3d6b2a"/>' +
        '<ellipse cx="40" cy="100" rx="28" ry="14" fill="#2b6cb0" opacity=".85"/>' +
        '<rect x="118" y="48" width="18" height="55" fill="#5d4037"/>' +
        '<circle cx="127" cy="42" r="22" fill="#2e7d32"/>' +
        '<circle cx="145" cy="55" r="16" fill="#388e3c"/>' +
        '<path d="M30 120 L170 120" stroke="#8d6e63" stroke-width="3" stroke-dasharray="6 4"/>' +
        '<text x="100" y="148" text-anchor="middle" fill="#c8e6c9" font-size="11" font-family="system-ui" font-weight="700">pick the spot</text>' +
        '</svg>';
    },
    footprint: function () {
      var cells = '';
      for (var r = 0; r < 11; r++) {
        for (var c = 0; c < 11; c++) {
          var x = 28 + c * 13, y = 18 + r * 11;
          var edge = r === 0 || r === 10 || c === 0 || c === 10;
          cells += '<rect x="' + x + '" y="' + y + '" width="12" height="10" rx="1" fill="' +
            (edge ? '#8d6e63' : '#3e2723') + '" stroke="#1b120e" stroke-width=".5"/>';
        }
      }
      return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="200" height="160" fill="#1a1410"/>' + cells +
        '<text x="100" y="152" text-anchor="middle" fill="#efdcc3" font-size="11" font-family="system-ui" font-weight="700">11 × 11 dirt</text>' +
        '</svg>';
    },
    walls: function () {
      return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="200" height="160" fill="#1a1410"/>' +
        '<rect x="40" y="30" width="120" height="100" fill="none" stroke="#a1887f" stroke-width="10"/>' +
        '<rect x="88" y="100" width="24" height="30" fill="#ffb300"/>' +
        '<text x="100" y="28" text-anchor="middle" fill="#ffe082" font-size="10" font-family="system-ui" font-weight="700">sunrise →</text>' +
        '<text x="100" y="152" text-anchor="middle" fill="#efdcc3" font-size="11" font-family="system-ui" font-weight="700">walls 4 high · door</text>' +
        '</svg>';
    },
    room: function () {
      return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="200" height="160" fill="#1a1410"/>' +
        '<rect x="30" y="25" width="140" height="110" fill="#2c2118" stroke="#6d4c41" stroke-width="4"/>' +
        '<rect x="42" y="100" width="36" height="22" rx="3" fill="#5c6bc0"/>' +
        '<text x="60" y="115" text-anchor="middle" fill="#fff" font-size="8" font-family="system-ui">bed</text>' +
        '<rect x="90" y="95" width="22" height="28" fill="#795548"/>' +
        '<rect x="116" y="95" width="22" height="28" fill="#6d4c41"/>' +
        '<rect x="142" y="88" width="18" height="35" fill="#757575"/>' +
        '<circle cx="151" cy="82" r="6" fill="#ff7043"/>' +
        '<text x="100" y="152" text-anchor="middle" fill="#efdcc3" font-size="11" font-family="system-ui" font-weight="700">bed · chests · furnace</text>' +
        '</svg>';
    },
    torches: function () {
      return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="200" height="160" fill="#0d1117"/>' +
        '<rect x="50" y="40" width="100" height="70" fill="none" stroke="#78909c" stroke-width="3"/>' +
        '<g fill="#ffca28">' +
        '<circle cx="50" cy="40" r="6"/><circle cx="150" cy="40" r="6"/>' +
        '<circle cx="50" cy="110" r="6"/><circle cx="150" cy="110" r="6"/>' +
        '<circle cx="100" cy="40" r="5"/><circle cx="100" cy="110" r="5"/>' +
        '<circle cx="50" cy="75" r="5"/><circle cx="150" cy="75" r="5"/>' +
        '</g>' +
        '<text x="100" y="148" text-anchor="middle" fill="#ffe082" font-size="11" font-family="system-ui" font-weight="700">torch the edge</text>' +
        '</svg>';
    },
    storage: function () {
      return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="200" height="160" fill="#1a1410"/>' +
        (function(){
          var s=''; var labels=['wood','stone','ores','food','drops','redstone'];
          for (var i=0;i<6;i++){
            var x=22+i*28;
            s+='<rect x="'+x+'" y="40" width="24" height="36" fill="#5d4037" stroke="#3e2723"/>';
            s+='<rect x="'+x+'" y="80" width="24" height="36" fill="#4e342e" stroke="#3e2723"/>';
            s+='<text x="'+(x+12)+'" y="130" text-anchor="middle" fill="#d7ccc8" font-size="7" font-family="system-ui">'+labels[i].slice(0,4)+'</text>';
          }
          return s;
        })() +
        '<text x="100" y="28" text-anchor="middle" fill="#efdcc3" font-size="11" font-family="system-ui" font-weight="700">labeled chest wall</text>' +
        '</svg>';
    },
    night: function () {
      return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="200" height="160" fill="#0a0e1a"/>' +
        '<circle cx="160" cy="36" r="14" fill="#eceff1"/>' +
        '<rect x="70" y="70" width="60" height="50" fill="#37474f"/>' +
        '<rect x="92" y="95" width="16" height="25" fill="#ffb300"/>' +
        '<circle cx="50" cy="100" r="8" fill="#66bb6a" opacity=".5"/>' +
        '<text x="100" y="148" text-anchor="middle" fill="#cfd8dc" font-size="11" font-family="system-ui" font-weight="700">light up · stay in</text>' +
        '</svg>';
    },
    enchant: function () {
      return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="200" height="160" fill="#12081c"/>' +
        '<rect x="85" y="70" width="30" height="30" fill="#5e35b1"/>' +
        '<rect x="55" y="45" width="14" height="18" fill="#6d4c41"/><rect x="131" y="45" width="14" height="18" fill="#6d4c41"/>' +
        '<rect x="55" y="100" width="14" height="18" fill="#6d4c41"/><rect x="131" y="100" width="14" height="18" fill="#6d4c41"/>' +
        '<rect x="40" y="70" width="14" height="18" fill="#6d4c41"/><rect x="146" y="70" width="14" height="18" fill="#6d4c41"/>' +
        '<text x="100" y="148" text-anchor="middle" fill="#e1bee7" font-size="11" font-family="system-ui" font-weight="700">table + bookshelves</text>' +
        '</svg>';
    },
    village: function () {
      return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="200" height="160" fill="#1b2a1b"/>' +
        '<rect x="40" y="70" width="40" height="40" fill="#8d6e63"/><polygon points="40,70 60,50 80,70" fill="#c62828"/>' +
        '<rect x="100" y="75" width="50" height="35" fill="#a1887f"/><polygon points="100,75 125,55 150,75" fill="#6d4c41"/>' +
        '<circle cx="70" cy="115" r="6" fill="#ffcc80"/>' +
        '<text x="100" y="148" text-anchor="middle" fill="#c8e6c9" font-size="11" font-family="system-ui" font-weight="700">fair trade · workshop</text>' +
        '</svg>';
    },
    brief: function () {
      return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="200" height="160" fill="#141a14"/>' +
        '<rect x="45" y="35" width="110" height="80" rx="8" fill="#263226" stroke="#8fd18a" stroke-width="2"/>' +
        '<text x="100" y="70" text-anchor="middle" fill="#c8e6c9" font-size="14" font-family="system-ui" font-weight="800">ask Dad</text>' +
        '<text x="100" y="92" text-anchor="middle" fill="#9aa89c" font-size="11" font-family="system-ui">custom build card</text>' +
        '<text x="100" y="148" text-anchor="middle" fill="#8fd18a" font-size="11" font-family="system-ui" font-weight="700">note → Sent</text>' +
        '</svg>';
    },
    hw_room: function () {
      return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="200" height="160" fill="#1a1030"/>' +
        '<rect x="35" y="40" width="130" height="80" rx="6" fill="#2a1b4a" stroke="#9575cd" stroke-width="3"/>' +
        '<circle cx="100" cy="80" r="18" fill="#7e57c2" opacity=".7"/>' +
        '<text x="100" y="148" text-anchor="middle" fill="#e1bee7" font-size="11" font-family="system-ui" font-weight="700">claim · organize · leave</text>' +
        '</svg>';
    },
    hw_book: function () {
      return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="200" height="160" fill="#1a1030"/>' +
        '<rect x="55" y="40" width="90" height="70" rx="4" fill="#5e35b1"/>' +
        '<rect x="60" y="45" width="80" height="60" fill="#ede7f6"/>' +
        '<path d="M100 45 V105" stroke="#5e35b1" stroke-width="2"/>' +
        '<text x="100" y="148" text-anchor="middle" fill="#e1bee7" font-size="11" font-family="system-ui" font-weight="700">Field Guide habit</text>' +
        '</svg>';
    },
    hw_combat: function () {
      return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="200" height="160" fill="#1a1030"/>' +
        '<circle cx="70" cy="80" r="22" fill="#4527a0" stroke="#b39ddb" stroke-width="3"/>' +
        '<circle cx="130" cy="80" r="22" fill="#6a1b9a" stroke="#ce93d8" stroke-width="3"/>' +
        '<path d="M90 70 L110 90 M110 70 L90 90" stroke="#ffe082" stroke-width="3"/>' +
        '<text x="100" y="148" text-anchor="middle" fill="#e1bee7" font-size="11" font-family="system-ui" font-weight="700">dodge · cast · reset</text>' +
        '</svg>';
    },
    hw_beasts: function () {
      return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="200" height="160" fill="#1a1030"/>' +
        '<ellipse cx="100" cy="95" rx="40" ry="22" fill="#6d4c41"/>' +
        '<circle cx="85" cy="70" r="12" fill="#8d6e63"/><circle cx="115" cy="70" r="12" fill="#8d6e63"/>' +
        '<text x="100" y="148" text-anchor="middle" fill="#e1bee7" font-size="11" font-family="system-ui" font-weight="700">feed · brush · rest</text>' +
        '</svg>';
    },
    hw_broom: function () {
      return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="200" height="160" fill="#0d1b2a"/>' +
        '<path d="M30 110 Q100 40 170 70" fill="none" stroke="#90caf9" stroke-width="3" stroke-dasharray="6 4"/>' +
        '<line x1="60" y1="95" x2="140" y2="55" stroke="#a1887f" stroke-width="5"/>' +
        '<circle cx="145" cy="52" r="8" fill="#ffe082"/>' +
        '<text x="100" y="148" text-anchor="middle" fill="#bbdefb" font-size="11" font-family="system-ui" font-weight="700">broom loop</text>' +
        '</svg>';
    },
    hw_story: function () {
      return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="200" height="160" fill="#1a1030"/>' +
        '<rect x="40" y="50" width="50" height="60" rx="4" fill="#5e35b1"/><text x="65" y="85" text-anchor="middle" fill="#fff" font-size="10" font-family="system-ui">story</text>' +
        '<rect x="110" y="50" width="50" height="60" rx="4" fill="#00897b"/><text x="135" y="85" text-anchor="middle" fill="#fff" font-size="10" font-family="system-ui">explore</text>' +
        '<text x="100" y="148" text-anchor="middle" fill="#e1bee7" font-size="11" font-family="system-ui" font-weight="700">pick one night</text>' +
        '</svg>';
    }
  };

  function diagramHtml(id) {
    var fn = DIAGRAMS[id];
    if (!fn) return '';
    try { return fn(); } catch (e) { return ''; }
  }


  function guideStepsFor(card) {
    if (!card) return [];
    var boardEmoji = (GAMES[game] && GAMES[game].emoji) || "🎮";
    if (card.guide && card.guide.length) {
      return card.guide.map(function (g, i) {
        return {
          img: g.img || null,
          diagram: g.diagram || "",
          caption: shortCaption(g.caption || "", 8),
          emoji: g.emoji || boardEmoji || GUIDE_EMOJIS[i % GUIDE_EMOJIS.length],
          color: g.bg || g.color || GUIDE_COLORS[i % GUIDE_COLORS.length]
        };
      });
    }
    return (card.steps || []).map(function (s, i) {
      return {
        img: null,
        diagram: "",
        caption: shortCaption(s, 8),
        emoji: boardEmoji || GUIDE_EMOJIS[i % GUIDE_EMOJIS.length],
        color: GUIDE_COLORS[i % GUIDE_COLORS.length]
      };
    });
  }

  function openGuide(id) {
    guideCardId = id;
    guideIdx = 0;
    guideEnd = false;
    overflowId = null;
    render();
  }

  function closeGuide() {
    guideCardId = null;
    guideIdx = 0;
    guideEnd = false;
    render();
  }

  function renderFire() {
    var chips = [
      { id: "jokic", label: "Jokić" },
      { id: "jones", label: "Chris Jones" },
      { id: "minecraft", label: "Minecraft" },
      { id: "hogwarts", label: "Hogwarts" },
      { id: "search", label: "Search" }
    ];
    var html = '<div class="fire-hero"><div class="fire-kicker">Inspiration</div>' +
      "<h2>Fire</h2>" +
      '<p class="vibe" id="vibeLine">' + esc(VIBES[vibeIdx]) + "</p></div>";
    html += '<div class="fchips">';
    chips.forEach(function (c) {
      html += '<button type="button" class="fchip' + (fireFilter === c.id ? " on" : "") + '" data-ff="' + c.id + '">' + esc(c.label) + "</button>";
    });
    html += "</div>";
    var GP = {
      jokic: { title: "Nikola Jokić", url: "https://grokipedia.com/page/Nikola_Joki%C4%87" },
      jones: { title: "Chris Jones", url: "https://grokipedia.com/page/Chris_Jones" },
      minecraft: { title: "Minecraft", url: "https://grokipedia.com/page/Minecraft" },
      hogwarts: { title: "Hogwarts Legacy", url: "https://grokipedia.com/page/Hogwarts_Legacy" }
    };
    if (fireFilter !== "search" && GP[fireFilter]) {
      var gp = GP[fireFilter];
      html += '<div class="gpedia-card">' +
        '<div class="gpedia-kicker">Grokopedia</div>' +
        '<div class="gpedia-title">' + esc(gp.title) + "</div>" +
        '<p class="gpedia-note">Kid-safe article. Opens in a new tab — then come back here.</p>' +
        '<div class="actions">' +
        '<a class="btnp" href="' + esc(gp.url) + '" target="_blank" rel="noopener noreferrer" data-gp-open="' + esc(gp.url) + '" data-gp-title="' + esc(gp.title) + '">Open article</a>' +
        '<button type="button" class="btns" data-pin-result="' + esc(gp.title) + '" data-pin-url="' + esc(gp.url) + '">Pin to Fire</button>' +
        "</div></div>";
    }
    if (fireFilter === "search") {
      html += '<div class="searchbar">' +
        '<input type="search" id="kidSearch" placeholder="Jokić, Jones, Minecraft, Hogwarts…" enterkeyhint="search" autocomplete="off">' +
        '<button type="button" id="kidSearchGo">Go</button></div>' +
        '<div id="kidSearchOut" class="sres"></div>';
    }
    html += '<div class="spark-grid">';

    var list = SPARKS.filter(function (s) {
      if (fireFilter === "all" || fireFilter === "search") return true;
      return s.tag === fireFilter;
    });
    if (!list.length) {
      html += '<p class="note">No sparks in this lane yet.</p>';
    }
    list.forEach(function (s) {
      var open = openSpark === s.id;
      html += '<article class="spark' + (open ? " open" : "") + '" data-spark="' + esc(s.id) + '">';
      if (s.image) {
        html += '<img class="spark-img" src="' + esc(s.image) + '" alt="" loading="lazy" onerror="this.onerror=null;this.remove();">';
      } else {
        html += '<div class="spark-fallback">' + esc((s.title || '?').charAt(0)) + "</div>";
      }
      html += '<div class="spark-body">';
      if (open) html += '<button type="button" class="spark-x" data-close-spark>Close</button>';
      html += '<div class="spark-tag">' + esc(s.tag) + "</div>";
      html += '<div class="spark-title">' + esc(s.title) + "</div>";
      html += '<p class="spark-why">' + esc(s.why) + "</p>";
      html += '<div class="spark-more">';
      if (s.facts && s.facts.length) {
        html += "<ul class=\"facts\">" + s.facts.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>";
      }
      if (s.youtubeId) {
        html += '<div class="ytwrap"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(s.youtubeId) +
          '" title="video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
      }
      if (s.linkBoard) {
        html += '<button type="button" class="linkboard" data-goto-board="' + esc(s.linkBoard) + '">Open ' +
          esc(s.linkBoard === "minecraft" ? "Minecraft board" : "Hogwarts board") + " →</button>";
      }
      html += '<div class="h" style="margin-top:14px">Send Dad a take</div>' +
        '<textarea id="sparkTake-' + esc(s.id) + '" placeholder="What clicked for you?"></textarea>' +
        '<div class="actions"><button type="button" class="btnp" data-spark-take="' + esc(s.id) + '">Send Dad a take</button></div>';
      html += "</div></div></article>";
    });
    html += "</div>";
    return html;
  }

  function renderPlay() {
    var g = GAMES[game];
    var cards = CARDS[game] || [];
    var html = '<div class="switch">' +
      '<button class="sw ' + (game === "minecraft" ? "on-mc" : "") + '" data-g="minecraft">🟩 Minecraft</button>' +
      '<button class="sw ' + (game === "hogwarts" ? "on-hw" : "") + '" data-g="hogwarts">🏰 Hogwarts</button>' +
      "</div>";
    html += '<div class="hero ' + (game === "minecraft" ? "mc" : "hw") + '">' +
      "<h2>" + g.emoji + " " + esc(g.name) + "</h2>" +
      "<p>" + esc(g.tag) + ". Pick a card. Do the first step tonight. If it is confusing, tell Dad — that is how this board grows.</p></div>";

    cards.forEach(function (c) {
      var on = !!state.done[c.id];
      var emoji = (GAMES[game] && GAMES[game].emoji) || "🎮";
      html += '<article class="card' + (on ? " done" : "") + '" id="' + esc(c.id) + '">' +
        '<div class="card-face">' +
        '<div class="card-top"><div class="ctitle">' + emoji + " " + esc(c.title) + (on ? " · done" : "") + "</div></div>" +
        '<p class="card-vibe">' + esc(c.why || c.vibe || "") + "</p>" +
        '<div class="card-time">⏱ ' + esc(c.mins || "") + (c.vibe ? " · " + esc(c.vibe) : "") + "</div>" +
        '<div class="card-chrome">' +
        '<button type="button" class="card-cta" data-guide="' + esc(c.id) + '">Show me how</button>' +
        '<div class="overflow' + (overflowId === c.id ? " open" : "") + '">' +
        '<button type="button" class="morebtn" data-overflow="' + esc(c.id) + '" aria-label="More">…</button>' +
        '<div class="overflow-menu">' +
        '<button type="button" data-fb="' + esc(c.id) + '" data-tag="ask-dad">Send Dad</button>' +
        '<button type="button" data-fb="' + esc(c.id) + '" data-tag="confusing">Confusing</button>' +
        '<button type="button" data-fb="' + esc(c.id) + '" data-tag="more">Want more like this</button>' +
        "</div></div></div></div></article>";
    });

    html += '<div class="h">Stuck or want a custom card?</div><div class="card">' +
      '<p class="note">Type what you want. Dad is the only person who talks to Grok. Your note waits in Hank for him.</p>' +
      '<textarea id="ask" placeholder="Example: I want a redstone hidden door for my base. Or: I cannot find Field Guide pages in the library."></textarea>' +
      '<div class="actions"><button class="btnp" id="sendAsk">Send to Dad</button></div></div>';
    return html;
  }

  function renderInterests() {
    var html = '<p class="note">Tap what you care about. This is how the board expands later — games, builds, sports, animals, whatever you love.</p>' +
      '<div class="chips">';
    INTERESTS.forEach(function (it) {
      var on = state.interests.indexOf(it.id) >= 0;
      html += '<button class="chip' + (on ? " on" : "") + '" data-int="' + it.id + '">' + esc(it.label) + "</button>";
    });
    html += "</div>" +
      '<div class="h">New subject or game</div><div class="card">' +
      '<input type="text" id="newSub" placeholder="Name the thing you want a board for">' +
      '<div class="actions"><button class="btnp" id="addSub">Add to the maybe list</button></div>' +
      '<p class="note" style="margin-top:8px">Dad reviews these. Nothing goes live until he says so.</p></div>';
    if (state.custom.length) {
      html += '<div class="h">You already asked for</div><div class="card">';
      state.custom.forEach(function (x) {
        html += '<div class="idea">' + esc(x.text) + ' <span class="st">' + new Date(x.ts).toLocaleDateString() + "</span></div>";
      });
      html += "</div>";
    }
    return html;
  }

  function renderIdeas() {
    var html = '<p class="note">Dream builds and discoveries. Short is better.</p><div class="card">' +
      '<input type="text" id="ideaIn" placeholder="Mushroom library. Flying loop over the lake. Hidden base under the barn...">' +
      '<div class="actions"><button class="btnp" id="addIdea">Save idea</button></div></div>';
    html += '<div class="card">';
    if (!state.ideas.length) html += '<p class="note">No ideas yet. Add one.</p>';
    state.ideas.forEach(function (x) {
      html += '<div class="idea"><b>' + esc(x.game || "") + "</b> " + esc(x.text) +
        ' <span class="st">' + new Date(x.ts).toLocaleDateString() + "</span></div>";
    });
    html += "</div>";
    return html;
  }

  function renderInbox() {
    var html = '<p class="note">What you already sent. Dad sees the same notes in Hank\'s capture queue.</p><div class="card">';
    if (!state.notes.length) html += '<p class="note">Nothing sent yet.</p>';
    state.notes.forEach(function (n) {
      html += '<div class="idea"><b>' + esc(n.kind) + "</b> · " + esc(n.game) + "<br>" + esc(n.text) +
        ' <div class="st">' + new Date(n.ts).toLocaleString() + "</div></div>";
    });
    html += "</div>";
    html += '<div id="dadSearchPanel" class="parent" style="display:none">' +
      "<b>From Dagvald's searches</b> (Dad only)" +
      '<div id="dadSearchHist" class="note" style="margin-top:10px">Loading…</div>' +
      '<div class="h">Fire drafts</div><div id="dadDrafts" class="note">Loading…</div>' +
      "</div>";
    return html;
  }


  function renderGuideSheet() {
    if (!guideCardId) return "";
    var card = findCard(guideCardId);
    if (!card) return "";
    var steps = guideStepsFor(card);
    var on = !!state.done[card.id];
    var html = '<div class="guide-sheet" id="guideSheet">';
    html += '<div class="guide-bar"><h2>' + esc(card.title) + "</h2>" +
      '<button type="button" class="guide-x" data-guide-close>Close</button></div>';

    if (guideEnd || !steps.length) {
      html += '<div class="guide-end">' +
        "<h3>Nice work</h3>" +
        "<p>How did this card feel?</p>" +
        '<button type="button" class="btnp" data-done="' + esc(card.id) + '">' + (on ? "Undo done" : "Mark done") + "</button>" +
        '<button type="button" class="btns" data-fb="' + esc(card.id) + '" data-tag="useful" data-guide-close-after>This helped</button>' +
        '<button type="button" class="btns" data-fb="' + esc(card.id) + '" data-tag="confusing" data-guide-close-after>Confusing</button>' +
        '<button type="button" class="btns" data-guide-close>Done</button>' +
        "</div>";
    } else {
      if (guideIdx < 0) guideIdx = 0;
      if (guideIdx >= steps.length) guideIdx = steps.length - 1;
      var step = steps[guideIdx];
      html += '<p class="guide-progress">Step ' + (guideIdx + 1) + " of " + steps.length + "</p>";
      html += '<div class="guide-stage" id="guideStage">';
      html += '<div class="guide-pic' + (step.diagram ? " has-diagram" : "") + '" style="background:' + esc(step.diagram ? "#0f1410" : step.color) + '">';
      if (step.img) {
        html += '<img src="' + esc(step.img) + '" alt="">';
      } else if (step.diagram && diagramHtml(step.diagram)) {
        html += '<div class="diagram">' + diagramHtml(step.diagram) + "</div>";
      } else {
        html += '<div class="ph">' + (step.emoji || "👉") + "<small>Step " + (guideIdx + 1) + "</small></div>";
      }
      html += "</div>";
      html += '<p class="guide-cap">' + esc(step.caption) + "</p>";
      html += "</div>";
      html += '<div class="guide-nav">' +
        '<button type="button" class="back" data-guide-back' + (guideIdx === 0 ? " disabled" : "") + ">Back</button>" +
        '<button type="button" class="next" data-guide-next>' +
        (guideIdx >= steps.length - 1 ? "Finish" : "Next") + "</button></div>";
    }
    html += "</div>";
    return html;
  }

  function render() {
    document.body.className = openSpark && view === "fire" ? "chrome-hide" : "";
    var nav = '<div class="lane">' +
      '<button type="button" class="sw' + (view === "fire" ? " on" : "") + '" data-view="fire">🔥 Fire</button>' +
      '<button type="button" class="sw' + (view === "play" ? " on" : "") + '" data-view="play">Play</button>' +
      '<button type="button" class="sw' + (view === "love" ? " on" : "") + '" data-view="love">I like</button>' +
      '<button type="button" class="sw' + (view === "ideas" ? " on" : "") + '" data-view="ideas">Ideas</button>' +
      '<button type="button" class="sw' + (view === "inbox" ? " on" : "") + '" data-view="inbox">Sent</button></div>';
    var body = view === "fire" ? renderFire()
      : view === "play" ? renderPlay()
      : view === "love" ? renderInterests()
      : view === "ideas" ? renderIdeas()
      : renderInbox();
    document.body.innerHTML = header() + '<div class="wrap">' + nav + body + '</div>' +
      renderGuideSheet() + '<div class="toast" id="toast"></div>';
    showDadExitIfParent();
    bind();
    bindGuide();
    if (view === "fire") startVibeCycle();
    else if (vibeTimer) { clearInterval(vibeTimer); vibeTimer = null; }
    if (view === "inbox") loadDadPlayPanel();
  }

  function bind() {

    var go = document.getElementById("kidSearchGo");
    var sin = document.getElementById("kidSearch");
    if (go) go.onclick = function () { runKidSearch(); };
    if (sin) sin.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); runKidSearch(); } };
    document.querySelectorAll("[data-gp-open]").forEach(function (a) {
      a.addEventListener("click", function () {
        fileNote("grokipedia-open", fireFilter, (a.getAttribute("data-gp-title") || "") + " · " + a.getAttribute("data-gp-open"), {});
      });
    });

    document.querySelectorAll("[data-pin-result]").forEach(function (b) {
      if (b._pinBound) return;
      b._pinBound = true;
      b.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        var topic = (fireFilter === "all" || fireFilter === "search") ? "nba" : fireFilter;
        fetch("/api/play/spark-drafts", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: b.getAttribute("data-pin-result"),
            why: "From Grokopedia — needs Dad approve",
            link: b.getAttribute("data-pin-url"),
            topic: topic,
            q: b.getAttribute("data-pin-result") || "",
            kid: KID,
          }),
        }).then(function (r) { return r.json(); }).then(function (x) {
          toast(x && x.ok ? "Pinned for Dad" : "Pin failed");
        }).catch(function () { toast("Pin failed"); });
      };
    });

    // Topic chips use Grokopedia card only — search runs when user hits Go or Search chip.
    if (view === "fire" && fireFilter === "search") {
      var out = document.getElementById("kidSearchOut");
      if (out && !out.innerHTML) {
        out.innerHTML = '<p class="sempty">Type a allowed topic (Jokić, Jones, Minecraft, Hogwarts).</p>';
      }
    }
    // Prefill from chip topic when Fire filter changes — optional soft search
    document.querySelectorAll("[data-g]").forEach(function (b) {
      b.onclick = function () { game = b.getAttribute("data-g"); view = "play"; openSpark = null; render(); };
    });
    document.querySelectorAll("[data-view]").forEach(function (b) {
      b.onclick = function () {
        view = b.getAttribute("data-view");
        openSpark = null;
        render();
      };
    });
    document.querySelectorAll("[data-ff]").forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        fireFilter = b.getAttribute("data-ff");
        openSpark = null;
        render();
      };
    });
    document.querySelectorAll("[data-spark]").forEach(function (art) {
      art.onclick = function (e) {
        if (e.target.closest("[data-close-spark],[data-spark-take],[data-goto-board],textarea,button,a,iframe")) return;
        var id = art.getAttribute("data-spark");
        openSpark = openSpark === id ? null : id;
        render();
        if (openSpark) {
          var el = document.querySelector('[data-spark="' + openSpark + '"]');
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
    });
    document.querySelectorAll("[data-close-spark]").forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        openSpark = null;
        render();
      };
    });
    document.querySelectorAll("[data-spark-take]").forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        var id = b.getAttribute("data-spark-take");
        var ta = document.getElementById("sparkTake-" + id);
        var t = ta && ta.value.trim();
        if (!t) return toast("Type a take first");
        var spark = SPARKS.filter(function (s) { return s.id === id; })[0];
        var tag = spark ? spark.tag : "spark";
        fileNote("spark-take", tag, t, { spark: id, tag: tag });
        if (ta) ta.value = "";
      };
    });
    document.querySelectorAll("[data-goto-board]").forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        game = b.getAttribute("data-goto-board");
        view = "play";
        openSpark = null;
        render();
      };
    });
    document.querySelectorAll("[data-done]").forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute("data-done");
        if (state.done[id]) delete state.done[id];
        else state.done[id] = Date.now();
        saveState();
        fileNote("progress", game, (state.done[id] ? "Marked done: " : "Undid: ") + id, { card: id });
        render();
      };
    });
    document.querySelectorAll("[data-fb]").forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        var id = b.getAttribute("data-fb");
        var tag = b.getAttribute("data-tag");
        if (tag === "ask-dad") {
          fileNote("ask", game, "Help with card: " + id, { card: id, tag: tag });
        } else {
          fileNote("card-feedback", game, tag + " · " + id, { card: id, tag: tag });
        }
        overflowId = null;
        if (!b.hasAttribute("data-guide-close-after")) render();
      };
    });
    var send = document.getElementById("sendAsk");
    if (send) send.onclick = function () {
      var el = document.getElementById("ask");
      var t = el && el.value.trim();
      if (!t) return toast("Type something first");
      fileNote("ask", game, t, {});
      el.value = "";
    };
    document.querySelectorAll("[data-int]").forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute("data-int");
        var i = state.interests.indexOf(id);
        if (i >= 0) state.interests.splice(i, 1);
        else state.interests.push(id);
        saveState();
        fileNote("interests", "", state.interests.join(", "), { interests: state.interests.slice() });
        render();
      };
    });
    var addSub = document.getElementById("addSub");
    if (addSub) addSub.onclick = function () {
      var el = document.getElementById("newSub");
      var t = el && el.value.trim();
      if (!t) return toast("Name it first");
      state.custom.unshift({ text: t, ts: Date.now() });
      saveState();
      fileNote("new-subject", "", t, {});
      el.value = "";
      render();
    };
    var addIdea = document.getElementById("addIdea");
    if (addIdea) addIdea.onclick = function () {
      var el = document.getElementById("ideaIn");
      var t = el && el.value.trim();
      if (!t) return toast("Add an idea first");
      state.ideas.unshift({ text: t, game: game, ts: Date.now() });
      saveState();
      fileNote("idea", game, t, {});
      el.value = "";
      render();
    };
  }



  function bindGuide() {
    document.querySelectorAll("[data-guide]").forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        openGuide(b.getAttribute("data-guide"));
      };
    });
    document.querySelectorAll("[data-overflow]").forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        var id = b.getAttribute("data-overflow");
        overflowId = overflowId === id ? null : id;
        render();
      };
    });
    document.querySelectorAll("[data-guide-close]").forEach(function (b) {
      b.onclick = function () { closeGuide(); };
    });
    document.querySelectorAll("[data-guide-close-after]").forEach(function (b) {
      b.addEventListener("click", function () {
        setTimeout(closeGuide, 200);
      });
    });
    var back = document.querySelector("[data-guide-back]");
    if (back) back.onclick = function () {
      if (guideIdx > 0) { guideIdx -= 1; guideEnd = false; render(); }
    };
    var next = document.querySelector("[data-guide-next]");
    if (next) next.onclick = function () {
      var card = findCard(guideCardId);
      var steps = guideStepsFor(card);
      if (guideIdx >= steps.length - 1) { guideEnd = true; render(); }
      else { guideIdx += 1; render(); }
    };
    var stage = document.getElementById("guideStage");
    if (stage) {
      stage.ontouchstart = function (e) {
        if (!e.changedTouches || !e.changedTouches.length) return;
        guideTouchX = e.changedTouches[0].clientX;
      };
      stage.ontouchend = function (e) {
        if (guideTouchX == null || !e.changedTouches || !e.changedTouches.length) return;
        var dx = e.changedTouches[0].clientX - guideTouchX;
        guideTouchX = null;
        if (Math.abs(dx) < 48) return;
        var card = findCard(guideCardId);
        var steps = guideStepsFor(card);
        if (dx < 0) {
          if (guideIdx >= steps.length - 1) guideEnd = true;
          else guideIdx += 1;
        } else if (guideIdx > 0) {
          guideIdx -= 1;
          guideEnd = false;
        }
        render();
      };
    }
  }

  var TOPIC_Q = {
    all: "",
    jokic: "Nikola Jokic Nuggets",
    nba: "NBA skills",
    jones: "Chris Jones Chiefs defensive tackle",
    minecraft: "Minecraft Java",
    hogwarts: "Hogwarts Legacy"
  };


  function loadDadPlayPanel() {
    var panel = document.getElementById("dadSearchPanel");
    if (!panel) return;
    fetch("/api/session", { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (sess) {
      if (!sess || !sess.parent) return;
      panel.style.display = "block";
      var histEl = document.getElementById("dadSearchHist");
      var draftEl = document.getElementById("dadDrafts");
      fetch("/api/play/search-history?kid=" + encodeURIComponent(KID), { credentials: "same-origin" })
        .then(function (r) { return r.json(); }).then(function (j) {
          var items = (j && j.items) || [];
          if (!items.length) { histEl.innerHTML = "No searches yet."; return; }
          histEl.innerHTML = items.slice(0, 12).map(function (h) {
            var top = (h.tops && h.tops[0]) || {};
            return '<div class="idea" style="color:#1a2332">' +
              "<b>" + esc(h.q || "") + "</b> · " + esc(h.topic || "") +
              (top.title ? "<br>" + esc(top.title) : "") +
              '<div class="actions" style="margin-top:8px">' +
              '<button type="button" class="btnp" data-make-spark="' + esc(h.q || "") +
              '" data-make-topic="' + esc(h.topic || "nba") +
              '" data-make-title="' + esc((top.title || h.q || "New spark").slice(0, 60)) +
              '" data-make-link="' + esc(top.link || "") +
              '" data-make-why="' + esc("From your search — short spark.") +
              '">Make Fire card</button></div></div>';
          }).join("");
          histEl.querySelectorAll("[data-make-spark]").forEach(function (b) {
            b.onclick = function () {
              fetch("/api/play/spark-drafts", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  kid: KID,
                  q: b.getAttribute("data-make-spark"),
                  topic: b.getAttribute("data-make-topic") || "nba",
                  title: b.getAttribute("data-make-title"),
                  link: b.getAttribute("data-make-link"),
                  why: b.getAttribute("data-make-why"),
                }),
              }).then(function (r) { return r.json(); }).then(function (j) {
                toast(j && j.ok ? "Draft saved — Approve below" : "Could not draft");
                loadDadPlayPanel();
              }).catch(function () { toast("Could not draft"); });
            };
          });
        }).catch(function () { histEl.textContent = "History unavailable."; });
      fetch("/api/play/spark-drafts", { credentials: "same-origin" })
        .then(function (r) { return r.json(); }).then(function (j) {
          var drafts = (j && j.drafts) || [];
          if (!drafts.length) { draftEl.innerHTML = "No drafts waiting."; return; }
          draftEl.innerHTML = drafts.map(function (d) {
            return '<div class="idea" style="color:#1a2332"><b>' + esc(d.title) + "</b><br>" + esc(d.why || "") +
              (d.link ? '<br><a href="' + esc(d.link) + '" target="_blank" rel="noopener">link</a>' : "") +
              '<div class="actions" style="margin-top:8px">' +
              '<button type="button" class="btnp" data-approve-draft="' + esc(d.id) + '">Approve → Fire</button></div></div>';
          }).join("");
          draftEl.querySelectorAll("[data-approve-draft]").forEach(function (b) {
            b.onclick = function () {
              fetch("/api/play/spark-drafts/approve", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: b.getAttribute("data-approve-draft") }),
              }).then(function (r) { return r.json(); }).then(function (j) {
                if (j && j.ok && j.spark) {
                  SPARKS.unshift(j.spark);
                  toast("Live on Fire");
                  loadDadPlayPanel();
                } else toast("Approve failed");
              }).catch(function () { toast("Approve failed"); });
            };
          });
        }).catch(function () { draftEl.textContent = "Drafts unavailable."; });
    }).catch(function () {});
  }

  function runKidSearch(qOverride) {
    var input = document.getElementById("kidSearch");
    var out = document.getElementById("kidSearchOut");
    if (!out) return;
    var TOPIC_Q = { jokic: "Nikola Jokic", jones: "Chris Jones Chiefs", minecraft: "Minecraft", hogwarts: "Hogwarts Legacy" };
    var q = (qOverride != null ? qOverride : (input && input.value || "")).trim();
    var topic = (fireFilter === "all" || fireFilter === "search") ? "" : fireFilter;
    if (!q && !topic) {
      out.innerHTML = '<p class="sempty">Pick a chip or ask Dad.</p>';
      return;
    }
    if (!q && topic) q = TOPIC_Q[topic] || topic;
    out.innerHTML = '<p class="sempty">Searching Grokopedia…</p>';
    var url = "/api/kid-search?kid=" + encodeURIComponent(KID) + "&q=" + encodeURIComponent(q) + (topic ? "&topic=" + encodeURIComponent(topic) : "");
    fetch(url, { credentials: "same-origin" })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) {
        if (!j || !j.ok) {
          out.innerHTML = '<p class="sempty">' + esc((j && j.message) || "Pick a chip or ask Dad.") + "</p>";
          return;
        }
        var rows = j.results || [];
        if (!rows.length) {
          out.innerHTML = '<p class="sempty">Nothing in the allowlist. Pick a chip or ask Dad.</p>';
          return;
        }
        out.innerHTML = rows.map(function (it) {
          return '<div class="srow">' +
            '<div class="stitle">' + esc(it.title) + "</div>" +
            '<div class="ssnip">' + esc(it.snippet || "") + "</div>" +
            '<div class="sact">' +
            '<a class="btnp" href="' + esc(it.link) + '" target="_blank" rel="noopener noreferrer" data-gp-open="' + esc(it.link) + '" data-gp-title="' + esc(it.title) + '">Open article</a>' +
            '<button type="button" class="btns" data-pin-result="' + esc(it.title) + '" data-pin-url="' + esc(it.link) + '">Pin to Fire</button>' +
            "</div></div>";
        }).join("");
        out.querySelectorAll("[data-pin-result]").forEach(function (b) {
          b.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            fetch("/api/play/spark-drafts", {
              method: "POST",
              credentials: "same-origin",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: b.getAttribute("data-pin-result"),
                why: "From Grokopedia — needs Dad approve",
                link: b.getAttribute("data-pin-url"),
                topic: topic || "nba",
                q: q,
                kid: KID,
              }),
            }).then(function (r) { return r.json(); }).then(function (x) {
              toast(x && x.ok ? "Pinned for Dad" : "Pin failed");
            }).catch(function () { toast("Pin failed"); });
          };
        });
        out.querySelectorAll("[data-gp-open]").forEach(function (a) {
          a.addEventListener("click", function () {
            fileNote("grokipedia-open", topic || "search", a.getAttribute("data-gp-title") + " · " + a.getAttribute("data-gp-open"), {});
          });
        });
      })
      .catch(function () {
        out.innerHTML = '<p class="sempty">Search unavailable right now.</p>';
      });
  }

  loadSparkOverlay();
  render();
})();
