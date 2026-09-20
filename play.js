/* HANK · Play — Dagvald's game board (Minecraft Java + Hogwarts Legacy).
   Kid uses cards + checkoffs + "tell Dad" notes. Parent is the only Grok operator.
   Notes POST to /api/answer (capture queue) and save locally. Does not touch Castle money. */
(function () {
  "use strict";

  var KID = window.PLAY_KID || "Dagvald";
  var LS = "hank.play." + KID;
  var state = loadState();

  var GAMES = window.PLAY_DATA.GAMES;
  var INTERESTS = window.PLAY_DATA.INTERESTS;
  var CARDS = window.PLAY_DATA.CARDS;

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
    ":root{--ink:#1b241c;--muted:#6b756c;--line:#d7e0d6;--paper:#f3f6f1;--mc:#3d8c3a;--hw:#8a5a12}" +
    "*{box-sizing:border-box}body{margin:0;font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif;color:var(--ink);background:#e7eee4}" +
    ".chead{background:linear-gradient(160deg,#1f4a2c 0%,#163422 55%,#3a2a12 100%);color:#fff;padding:calc(14px + env(safe-area-inset-top)) 16px 0}" +
    ".cbar{display:flex;align-items:center;justify-content:space-between;gap:10px}" +
    ".chead h1{margin:0;font-size:19px;font-weight:800;letter-spacing:-.3px}" +
    ".csub{margin:4px 0 0;opacity:.88;font-size:12.5px}" +
    ".backchip{display:inline-flex;text-decoration:none;color:#fff;font-size:13px;font-weight:800;padding:7px 12px;border-radius:999px;background:rgba(255,255,255,.16)}" +
    ".tabs{display:flex;gap:6px;margin-top:12px;overflow:auto}" +
    ".tab{color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:9px 12px;border-radius:10px 10px 0 0;opacity:.72;white-space:nowrap}" +
    ".tab.active{background:var(--paper);color:#1f4a2c;opacity:1}" +
    ".wrap{max-width:560px;margin:0 auto;padding:14px 14px 80px}" +
    ".hero{border-radius:22px;padding:16px 16px 14px;margin:8px 0 14px;color:#143018;position:relative;overflow:hidden}" +
    ".hero.mc{background:radial-gradient(120% 80% at 100% 0%,#b7e38a 0%,#7bc36a 40%,#4e9a4a 100%)}" +
    ".hero.hw{background:radial-gradient(120% 80% at 0% 0%,#f3d48a 0%,#c9923d 45%,#7a4314 100%);color:#2a1a08}" +
    ".hero h2{margin:0;font-size:26px;letter-spacing:-.6px}" +
    ".hero p{margin:6px 0 0;font-size:13.5px;line-height:1.45;opacity:.92}" +
    ".switch{display:flex;gap:8px;margin:0 0 12px}" +
    ".sw{flex:1;border:0;border-radius:14px;padding:12px 10px;font-weight:800;font-size:14px;cursor:pointer}" +
    ".sw.on-mc{background:#3d8c3a;color:#fff}" +
    ".sw.on-hw{background:#8a5a12;color:#fff}" +
    ".sw.off{background:#fff;color:#314036;border:1px solid var(--line)}" +
    ".card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px;margin:0 0 12px;box-shadow:0 1px 3px rgba(20,40,20,.05)}" +
    ".ctitle{font-weight:800;font-size:17px}" +
    ".meta{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 8px}" +
    ".pill{font-size:11px;font-weight:700;padding:3px 8px;border-radius:99px;background:#eef3ea;color:#3d5340}" +
    ".why{font-size:13.5px;line-height:1.45;margin:0 0 8px}" +
    ".steps{margin:0;padding:0 0 0 18px}" +
    ".steps li{margin:0 0 6px;font-size:14px;line-height:1.4}" +
    ".pack{font-size:12.5px;color:var(--muted);margin:8px 0 0}" +
    ".actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}" +
    ".btnp{background:#1f4a2c;color:#fff;border:0;border-radius:11px;padding:9px 12px;font-weight:800;font-size:13px;cursor:pointer}" +
    ".btns{background:#fff;color:var(--ink);border:1px solid var(--line);border-radius:11px;padding:9px 12px;font-weight:700;font-size:13px;cursor:pointer}" +
    ".done{outline:2px solid #3d8c3a;background:#f3fbf1}" +
    ".h{font-size:12px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--muted);margin:18px 4px 8px}" +
    ".chips{display:flex;flex-wrap:wrap;gap:8px}" +
    ".chip{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 12px;font-weight:700;font-size:13px;cursor:pointer}" +
    ".chip.on{background:#1f4a2c;color:#fff;border-color:#1f4a2c}" +
    "textarea,input[type=text]{width:100%;border:1px solid var(--line);border-radius:12px;padding:10px 12px;font:inherit;font-size:15px}" +
    "textarea{min-height:88px;resize:vertical}" +
    ".note{font-size:13px;color:var(--muted);line-height:1.45}" +
    ".toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#142016;color:#fff;padding:10px 16px;border-radius:99px;font-size:14px;opacity:0;transition:.2s;z-index:60;pointer-events:none}.toast.on{opacity:1}" +
    ".idea{border-top:1px solid var(--line);padding:10px 0;font-size:14px}" +
    ".idea:first-child{border-top:0}" +
    ".st{font-size:11px;color:var(--muted)}" +
    ".parent{font-size:12.5px;background:#fff8e8;border:1px solid #ead9a8;border-radius:14px;padding:12px;line-height:1.45;color:#5a4714}";

  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  var game = "minecraft";
  var view = "play";

  function header() {
    return '<header class="chead"><div class="cbar"><div><a class="backchip" href="kids.html">← Kids</a> <h1 style="display:inline;margin-left:6px">Play</h1></div>' +
      '<a id="dadExit" class="backchip" href="./" style="display:none">Dad · HANK home</a></div>' +
      '<p class="csub">Your board · Dad runs Grok · you build and explore</p>' +
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

  function renderPlay() {
    var g = GAMES[game];
    var cards = CARDS[game] || [];
    var html = '<div class="switch">' +
      '<button class="sw ' + (game === "minecraft" ? "on-mc" : "off") + '" data-g="minecraft">🟩 Minecraft</button>' +
      '<button class="sw ' + (game === "hogwarts" ? "on-hw" : "off") + '" data-g="hogwarts">🏰 Hogwarts</button>' +
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
    html += "</div>" +
      '<div class="parent"><b>Parents:</b> notes POST to <code>/api/answer</code> with <code>source: play</code>. ' +
      "Grok loop already reads that queue. You are the only Grok user. He never logs into Grok. " +
      "Do not paste copyrighted walkthroughs into cards — keep original plans. Expand worlds only after he asks.</div>";
    return html;
  }

  function render() {
    var nav = '<div class="switch" style="margin-top:10px">' +
      '<button class="sw ' + (view === "play" ? "on-mc" : "off") + '" data-view="play">Boards</button>' +
      '<button class="sw ' + (view === "love" ? "on-mc" : "off") + '" data-view="love">I like</button>' +
      '<button class="sw ' + (view === "ideas" ? "on-mc" : "off") + '" data-view="ideas">Ideas</button>' +
      '<button class="sw ' + (view === "inbox" ? "on-mc" : "off") + '" data-view="inbox">Sent</button></div>';
    var body = view === "play" ? renderPlay() : view === "love" ? renderInterests() : view === "ideas" ? renderIdeas() : renderInbox();
    document.body.innerHTML = header() + '<div class="wrap">' + nav + body + '</div><div class="toast" id="toast"></div>';
    showDadExitIfParent();
    bind();
  }

  function bind() {
    document.querySelectorAll("[data-g]").forEach(function (b) {
      b.onclick = function () { game = b.getAttribute("data-g"); view = "play"; render(); };
    });
    document.querySelectorAll("[data-view]").forEach(function (b) {
      b.onclick = function () { view = b.getAttribute("data-view"); render(); };
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

  render();
})();
/* BLANK-FIX-2026-09-19 */
