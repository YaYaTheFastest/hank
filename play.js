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
    ".spark-img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#1a2218}" +
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
    ".ctitle{font-weight:800;font-size:17px}" +
    ".meta{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 8px}" +
    ".pill{font-size:11px;font-weight:700;padding:3px 8px;border-radius:99px;background:#1e2a20;color:#a8bda6}" +
    ".why{font-size:13.5px;line-height:1.45;margin:0 0 8px;color:#c5d4c2}" +
    ".steps{margin:0;padding:0 0 0 18px}" +
    ".steps li{margin:0 0 6px;font-size:14px;line-height:1.4}" +
    ".pack{font-size:12.5px;color:var(--muted);margin:8px 0 0}" +
    ".actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}" +
    ".btnp{background:var(--lime);color:#0b0f0c;border:0;border-radius:11px;padding:11px 14px;font-weight:900;font-size:13px;cursor:pointer}" +
    ".btns{background:#1e2a20;color:var(--ink);border:1px solid #2a382c;border-radius:11px;padding:11px 14px;font-weight:700;font-size:13px;cursor:pointer}" +
    ".done{outline:2px solid var(--lime);background:#142018}" +
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
    ".searchbar{display:flex;gap:8px;margin:0 0 12px}.searchbar input{flex:1;border:0;border-radius:14px;padding:14px 14px;font:inherit;font-size:16px;font-weight:700;background:#151b16;color:#f2f7ef}.searchbar button{border:0;border-radius:14px;padding:14px 16px;font-weight:900;background:var(--neon);color:#0b0f0c;cursor:pointer}.sres{display:flex;flex-direction:column;gap:10px;margin:0 0 16px}.sres a{display:block;background:#151b16;border:1px solid #243028;border-radius:16px;padding:14px;text-decoration:none;color:#f2f7ef}.sres .stitle{font-weight:900;font-size:15px;margin:0 0 4px}.sres .ssnip{font-size:13px;color:#9aa89c;line-height:1.35}.sres .sact{margin-top:8px}.sempty{font-size:13px;color:#9aa89c;padding:8px 2px 14px}";

  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);
  var theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.setAttribute("content", "#0b0f0c");

  var game = "minecraft";
  var view = "fire";
  var fireFilter = "all";
  var openSpark = null;
  var vibeIdx = 0;
  var vibeTimer = null;

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

  function renderFire() {
    var chips = [
      { id: "all", label: "Fire" },
      { id: "jokic", label: "Jokić" },
      { id: "nba", label: "NBA" },
      { id: "jones", label: "DT / Jones" },
      { id: "minecraft", label: "Minecraft" },
      { id: "hogwarts", label: "Hogwarts" }
    ];
    var html = '<div class="fire-hero"><div class="fire-kicker">Inspiration</div>' +
      "<h2>Fire</h2>" +
      '<p class="vibe" id="vibeLine">' + esc(VIBES[vibeIdx]) + "</p></div>";
    html += '<div class="fchips">';
    chips.forEach(function (c) {
      html += '<button type="button" class="fchip' + (fireFilter === c.id ? " on" : "") + '" data-ff="' + c.id + '">' + esc(c.label) + "</button>";
    });
    html += "</div>";
    html += '<div class="searchbar">' +
      '<input type="search" id="kidSearch" placeholder="Search paused — Fire cards below" enterkeyhint="search" autocomplete="off">' +
      '<button type="button" id="kidSearchGo">Go</button></div>' +
      '<div id="kidSearchOut" class="sres"></div>' +
      '<div class="spark-grid">';

    var list = SPARKS.filter(function (s) {
      return fireFilter === "all" || s.tag === fireFilter;
    });
    if (!list.length) {
      html += '<p class="note">No sparks in this lane yet.</p>';
    }
    list.forEach(function (s) {
      var open = openSpark === s.id;
      html += '<article class="spark' + (open ? " open" : "") + '" data-spark="' + esc(s.id) + '">';
      if (s.image) {
        html += '<img class="spark-img" src="' + esc(s.image) + '" alt="" loading="lazy">';
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
      html += '<article class="card' + (on ? " done" : "") + '" id="' + c.id + '">' +
        '<div class="ctitle">' + esc(c.title) + (on ? " · done" : "") + "</div>" +
        '<div class="meta"><span class="pill">' + esc(c.vibe) + '</span><span class="pill">' + esc(c.mins) + "</span></div>" +
        '<p class="why">' + esc(c.why) + "</p>" +
        "<ol class=\"steps\">" + c.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>" +
        '<p class="pack"><b>Bring:</b> ' + esc(c.pack) + "<br><b>After that:</b> " + esc(c.next) + "</p>" +
        '<div class="actions">' +
        '<button class="btnp" data-done="' + c.id + '">' + (on ? "Undo done" : "Mark done") + "</button>" +
        '<button class="btns" data-fb="' + c.id + '" data-tag="useful">This helped</button>' +
        '<button class="btns" data-fb="' + c.id + '" data-tag="confusing">Confusing</button>' +
        '<button class="btns" data-fb="' + c.id + '" data-tag="more">Want more like this</button>' +
        "</div></article>";
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
    document.body.innerHTML = header() + '<div class="wrap">' + nav + body + '</div><div class="toast" id="toast"></div>';
    showDadExitIfParent();
    bind();
    if (view === "fire") startVibeCycle();
    else if (vibeTimer) { clearInterval(vibeTimer); vibeTimer = null; }
    if (view === "inbox") loadDadPlayPanel();
  }

  function bind() {

    var go = document.getElementById("kidSearchGo");
    var sin = document.getElementById("kidSearch");
    if (go) go.onclick = function () { runKidSearch(); };
    if (sin) sin.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); runKidSearch(); } };
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
      b.onclick = function () {
        var id = b.getAttribute("data-fb");
        var tag = b.getAttribute("data-tag");
        fileNote("card-feedback", game, tag + " · " + id, { card: id, tag: tag });
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
    out.innerHTML = '<p class="sempty">Google search retired. Fire cards still work. Grokopedia coming.</p>';
    return;
    var q = (qOverride != null ? qOverride : (input && input.value || "")).trim();
    var topic = fireFilter === "all" ? "" : fireFilter;
    if (!q && !topic) {
      out.innerHTML = '<p class="sempty">Pick a chip or type a search.</p>';
      return;
    }
    if (!q && topic) q = TOPIC_Q[topic] || topic;
    out.innerHTML = '<p class="sempty">Searching…</p>';
    var url = "/api/kid-search?kid=" + encodeURIComponent(KID) + "&q=" + encodeURIComponent(q) + (topic ? "&topic=" + encodeURIComponent(topic) : "");
    fetch(url, { credentials: "same-origin" })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) {
        if (!j || j.error === "search-not-connected") {
          out.innerHTML = '<p class="sempty">Google search retired. Fire cards still work. Grokopedia coming.</p>';
          return;
        }
        if (!j.ok) {
          out.innerHTML = '<p class="sempty">' + esc(j.message || "Search unavailable") + "</p>";
          return;
        }
        var rows = j.results || [];
        if (!rows.length) {
          out.innerHTML = '<p class="sempty">No results. Try another word.</p>';
          return;
        }
        out.innerHTML = rows.map(function (it) {
          return '<a href="' + esc(it.link) + '" target="_blank" rel="noopener noreferrer">' +
            '<div class="stitle">' + esc(it.title) + "</div>" +
            '<div class="ssnip">' + esc(it.snippet) + "</div>" +
            '<div class="sact"><button type="button" class="btns" data-send-result="' + esc(it.title) + '" data-send-url="' + esc(it.link) + '">Send to Dad</button></div>' +
            "</a>";
        }).join("");
        out.querySelectorAll("[data-send-result]").forEach(function (b) {
          b.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            fileNote("search-share", fireFilter, b.getAttribute("data-send-result") + " · " + b.getAttribute("data-send-url"), {});
          };
        });
      })
      .catch(function () {
        out.innerHTML = '<p class="sempty">Search unavailable right now.</p>';
      });
  }

  loadSparkOverlay();
  render();
})();
