/* HANK · Castle Fund — kid page (shared by dagvald.html / davikja.html).
   Frictionless loop: kid taps a chore -> Pending -> either parent approves -> balance credits.
   Reads/writes the Worker API (/api/castle*). Kid actions need no password; parent approve does. */
(function () {
  "use strict";

  // ---- Config (mirrors the vault: 40 Projects/Active/Castle Fund) ----
  var CATALOG = [
    { id: "room",   name: "Clean Room",   price: 5,  qty: 1, emoji: "🛏️", steps: "Make bed · clothes away · dirty clothes in hamper" },
    { id: "vac",    name: "Vacuuming",    price: 5,  qty: 1, emoji: "🧹", steps: "Vacuum the floors" },
    { id: "stalls", name: "Clean Stalls", price: 15, qty: 3, emoji: "🐴", steps: "Clean stall · empty water buckets", per: "stall" },
    { id: "mow",    name: "Mow Lawn",     price: 25, qty: 1, emoji: "🌱", steps: "Remove toys/sticks/poop · mow within fence" }
  ];
  var KIDS = {
    Dagvald: { dob: "2015-09-17", reward: "LEGO Hogwarts Castle", goal: 250, seed: 85, theme: "castle", color: "#7c3aed", accent: "#a78bfa" },
    Davikja: { dob: "2017-01-20", reward: "$100 reward (TBD)",    goal: 100,  seed: 0,  theme: "jar",    color: "#db2777", accent: "#f472b6" }
  };

  var KID = window.CASTLE_KID;
  var cfg = KIDS[KID];
  if (!cfg) { document.body.innerHTML = "<p style='padding:24px;font-family:system-ui'>Unknown kid.</p>"; return; }

  var entries = [];        // all entries from the API
  var lastPin = "";        // remembered within an open parent session (cleared on close / reload)
  function money(n) { return "$" + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0).replace(/\.00$/, ""); }
  function mine() { return entries.filter(function (e) { return e.kid === KID; }); }
  function approved() { return mine().filter(function (e) { return e.status === "approved"; }); }
  function pending() { return mine().filter(function (e) { return e.status === "pending"; }); }
  function balance() { var b = cfg.seed; approved().forEach(function (e) { b += e.amount; }); return b; }
  function today() { return new Date().toISOString().slice(0, 10); }
  function usedToday(choreName) {
    return mine().filter(function (e) { return e.chore === choreName && e.day === today() && e.status !== "declined"; }).length;
  }

  // ---- Styles ----
  var css = "" +
    ":root{--ink:#1d2733;--muted:#7c8694;--line:#e7e9ee;--kid:" + cfg.color + ";--accent:" + cfg.accent + "}" +
    "*{box-sizing:border-box}body{margin:0;font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif;color:var(--ink);background:#f5f6f8}" +
    ".wrap{max-width:540px;margin:0 auto;padding:16px 16px 60px}" +
    ".top{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}" +
    ".top a{font-size:13px;color:var(--muted);text-decoration:none}" +
    ".name{font-size:26px;font-weight:800;letter-spacing:-.5px;color:var(--kid)}" +
    ".hero{background:#fff;border:1px solid var(--line);border-radius:20px;padding:18px;margin:10px 0;box-shadow:0 1px 3px rgba(0,0,0,.05)}" +
    ".bal{font-size:40px;font-weight:800;letter-spacing:-1px}" +
    ".sub{color:var(--muted);font-size:14px;margin-top:2px}" +
    ".art{margin:14px 0 4px}" +
    ".mile{display:flex;gap:6px;margin-top:12px}" +
    ".dot{flex:1;height:7px;border-radius:99px;background:#eceef2}.dot.on{background:var(--kid)}" +
    ".h{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);margin:20px 4px 8px}" +
    ".chore{width:100%;text-align:left;background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px 15px;margin-bottom:10px;display:flex;align-items:center;gap:13px;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.04)}" +
    ".chore:active{transform:scale(.99)}.chore[disabled]{opacity:.5}" +
    ".chore .em{font-size:26px}.chore .ct{flex:1}.chore .cn{font-weight:700;font-size:16px}.chore .cs{font-size:12px;color:var(--muted);margin-top:2px}" +
    ".chore .cp{font-weight:800;font-size:17px;color:var(--kid)}" +
    ".row{background:#fff;border:1px solid var(--line);border-radius:12px;padding:11px 13px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;font-size:14px}" +
    ".pill{font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px}" +
    ".pill.p{background:#fff7e6;color:#b7791f}.pill.a{background:#e7f7ee;color:#1f8a4c}" +
    ".empty{color:var(--muted);font-size:13px;padding:6px 4px}" +
    ".btnp{background:var(--kid);color:#fff;border:0;border-radius:10px;padding:8px 14px;font-weight:700;font-size:14px;cursor:pointer}" +
    ".btns{background:#fff;color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:8px 14px;font-weight:600;font-size:14px;cursor:pointer}" +
    ".modal{position:fixed;inset:0;background:rgba(20,25,32,.45);display:none;align-items:flex-end;justify-content:center;z-index:50}" +
    ".modal.on{display:flex}.sheet{background:#f5f6f8;width:100%;max-width:540px;border-radius:20px 20px 0 0;padding:18px 16px 28px;max-height:85vh;overflow:auto}" +
    ".sheet h3{margin:2px 4px 12px}.appr{display:flex;gap:8px}" +
    ".toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#1d2733;color:#fff;padding:10px 16px;border-radius:99px;font-size:14px;opacity:0;transition:.2s;z-index:60;pointer-events:none}" +
    ".toast.on{opacity:1}.spark{animation:pop .5s ease}@keyframes pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1)}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---- Goal art ----
  function castleArt(pct) {
    var h = 150, fillY = h - (h - 12) * pct;
    return '<svg class="art spark" viewBox="0 0 300 150" width="100%" height="150" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><clipPath id="c"><path d="M40 150 V70 h14 V58 h12 v12 h18 V44 h12 v26 h18 V58 h12 v12 h14 V70 h14 v80 Z M150 36 l16 16 h-32 Z"/></clipPath></defs>' +
      '<rect x="36" y="32" width="228" height="118" fill="#eceef2" clip-path="url(#c)"/>' +
      '<rect x="36" y="' + fillY + '" width="228" height="' + (h - fillY) + '" fill="var(--kid)" clip-path="url(#c)"/>' +
      '<path d="M40 150 V70 h14 V58 h12 v12 h18 V44 h12 v26 h18 V58 h12 v12 h14 V70 h14 v80 Z M150 36 l16 16 h-32 Z" fill="none" stroke="var(--kid)" stroke-width="2.5"/>' +
      '<text x="150" y="96" text-anchor="middle" font-size="30" font-weight="800" fill="#fff" style="paint-order:stroke;stroke:var(--kid);stroke-width:4">' + Math.round(pct * 100) + '%</text></svg>';
  }
  function jarArt(bal, goal) {
    var cap = goal || Math.max(50, Math.ceil((bal + 10) / 50) * 50), pct = Math.min(1, bal / cap), h = 150, fillY = h - (h - 20) * pct;
    return '<svg class="art spark" viewBox="0 0 300 150" width="100%" height="150" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><clipPath id="j"><path d="M95 30 h110 v8 a18 18 0 0 1-10 16 v76 a14 14 0 0 1-14 14 h-62 a14 14 0 0 1-14-14 V54 a18 18 0 0 1-10-16 Z"/></clipPath></defs>' +
      '<rect x="90" y="26" width="120" height="124" fill="#eceef2" clip-path="url(#j)"/>' +
      '<rect x="90" y="' + fillY + '" width="120" height="' + (h - fillY) + '" fill="var(--kid)" clip-path="url(#j)"/>' +
      '<path d="M95 30 h110 v8 a18 18 0 0 1-10 16 v76 a14 14 0 0 1-14 14 h-62 a14 14 0 0 1-14-14 V54 a18 18 0 0 1-10-16 Z" fill="none" stroke="var(--kid)" stroke-width="2.5"/>' +
      '<text x="150" y="100" text-anchor="middle" font-size="22" font-weight="800" fill="#fff" style="paint-order:stroke;stroke:var(--kid);stroke-width:4">' + money(bal) + '</text></svg>';
  }

  // ---- Render ----
  function render() {
    var bal = balance(), goal = cfg.goal, pct = goal ? Math.min(1, bal / goal) : 0;
    var pend = pending(), appr = approved().slice().sort(function (a, b) { return (b.decidedTs || b.ts) - (a.decidedTs || a.ts); });
    var html = '<div class="wrap">';
    html += '<div class="top"><a href="castle.html">‹ Castle Fund</a><a href="#" id="parentBtn">🔑 Parent</a></div>';
    html += '<div class="name">' + KID + "'s Castle Fund</div>";

    html += '<div class="hero">';
    html += cfg.theme === "castle" ? castleArt(pct) : jarArt(bal, goal);
    html += '<div class="bal">' + money(bal) + "</div>";
    if (goal) {
      html += '<div class="sub">' + money(bal) + " of " + money(goal) + " · " + cfg.reward + " · " + money(goal - bal) + " to go</div>";
      html += '<div class="mile">';
      for (var m = 1; m <= 5; m++) html += '<div class="dot ' + (pct >= m / 5 ? "on" : "") + '"></div>';
      html += "</div>";
    } else {
      html += '<div class="sub">Bank balance — saving up. Pick a reward anytime!</div>';
    }
    html += "</div>";

    // Chores
    html += '<div class="h">Choose a chore</div>';
    CATALOG.forEach(function (c) {
      var used = usedToday(c.name), left = c.qty - used, done = left <= 0;
      var sub = c.steps + (c.qty > 1 ? "  ·  " + left + " of " + c.qty + " left today" : "");
      html += '<button class="chore" ' + (done ? "disabled" : "") + ' data-chore="' + c.name + '" data-amt="' + c.price + '" data-qty="' + c.qty + '">' +
        '<span class="em">' + c.emoji + "</span>" +
        '<span class="ct"><span class="cn">' + c.name + (done ? " ✓" : "") + "</span><span class=\"cs\">" + sub + "</span></span>" +
        '<span class="cp">' + money(c.price) + (c.per ? "/" + c.per : "") + "</span></button>";
    });

    // Pending
    html += '<div class="h">Waiting on Mom or Dad</div>';
    if (!pend.length) html += '<div class="empty">Nothing waiting. Tap a chore above when you finish it.</div>';
    pend.forEach(function (e) {
      html += '<div class="row"><span>' + e.chore + ' · ' + money(e.amount) + '</span><span class="pill p">pending</span></div>';
    });

    // Recent approved
    html += '<div class="h">Earned</div>';
    if (!appr.length) html += '<div class="empty">No approved chores yet.</div>';
    appr.slice(0, 8).forEach(function (e) {
      html += '<div class="row"><span>' + e.chore + ' · ' + money(e.amount) + '</span><span class="pill a">+ ' + money(e.amount) + '</span></div>';
    });

    html += "</div>"; // wrap
    html += '<div class="modal" id="pm"><div class="sheet"><h3>Approvals — both kids</h3><div id="pmBody"></div>' +
      '<div style="margin-top:14px;text-align:center"><button class="btns" id="pmClose">Close</button></div></div></div>';
    html += '<div class="toast" id="toast"></div>';
    document.getElementById("app").innerHTML = html;

    Array.prototype.forEach.call(document.querySelectorAll(".chore"), function (b) {
      b.addEventListener("click", function () { logChore(b.dataset.chore, +b.dataset.amt, +b.dataset.qty); });
    });
    document.getElementById("parentBtn").addEventListener("click", function (e) { e.preventDefault(); openParent(); });
    document.getElementById("pmClose").addEventListener("click", function () { lastPin = ""; document.getElementById("pm").classList.remove("on"); });
  }

  function toast(msg) {
    var t = document.getElementById("toast"); if (!t) return;
    t.textContent = msg; t.classList.add("on"); setTimeout(function () { t.classList.remove("on"); }, 2200);
  }

  // ---- Actions ----
  function logChore(chore, amt, qty) {
    fetch("/api/castle/log", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kid: KID, chore: chore, amount: amt, qty: qty }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.ok) { toast("✨ Logged! " + chore + " — waiting on Mom/Dad."); return load(); }
        if (j.error === "daily-limit") { toast("That one's done for today 👍"); return load(); }
        toast("Couldn't log — check connection.");
      })
      .catch(function () { toast("Offline — couldn't log right now."); });
  }

  var PINBOX = '<input id="pin" inputmode="numeric" maxlength="4" placeholder="4-digit PIN" ' +
    'style="flex:1;border:1px solid var(--line);border-radius:10px;padding:11px 12px;font-size:16px;letter-spacing:3px">';

  function openParent() {
    document.getElementById("pm").classList.add("on");
    fetch("/api/castle/pinset").then(function (r) { return r.json(); }).then(function (j) {
      var body = document.getElementById("pmBody");
      if (j && j.set === false) {
        // First run — set a PIN.
        body.innerHTML = '<div class="empty" style="margin-bottom:8px">Set a 4-digit parent PIN (one time). You\'ll use it to approve chores.</div>' +
          '<div style="display:flex;gap:8px">' + PINBOX.replace('id="pin"', 'id="newpin"') + '<button class="btnp" id="savepin">Save</button></div>';
        document.getElementById("savepin").addEventListener("click", savePin);
        return;
      }
      var pend = entries.filter(function (e) { return e.status === "pending"; });
      var html = '<div style="display:flex;gap:8px;margin-bottom:12px">' + PINBOX + "</div>";
      if (!pend.length) html += '<div class="empty">No chores waiting for approval. 🎉</div>';
      pend.forEach(function (e) {
        html += '<div class="row"><span><b>' + e.kid + '</b> · ' + e.chore + ' · ' + money(e.amount) + '</span>' +
          '<span class="appr"><button class="btnp" data-k="' + e.key + '" data-act="approve">Approve</button>' +
          '<button class="btns" data-k="' + e.key + '" data-act="decline">No</button></span></div>';
      });
      body.innerHTML = html;
      var pinEl = document.getElementById("pin"); if (pinEl && lastPin) pinEl.value = lastPin;
      Array.prototype.forEach.call(document.querySelectorAll("#pmBody button"), function (b) {
        b.addEventListener("click", function () { decide(b.dataset.k, b.dataset.act); });
      });
    }).catch(function () { toast("Couldn't reach Hank."); });
  }

  function savePin() {
    var pin = (document.getElementById("newpin").value || "").trim();
    if (!/^\d{4}$/.test(pin)) { toast("PIN must be 4 digits."); return; }
    fetch("/api/castle/setpin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: pin }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.ok) { lastPin = pin; toast("PIN set — you can approve now."); openParent(); }
        else if (j.error === "pin-already-set") { toast("A PIN is already set."); openParent(); }
        else { toast("Couldn't set the PIN."); }
      })
      .catch(function () { toast("Offline — couldn't set the PIN."); });
  }

  function decide(entryKey, act) {
    var pinEl = document.getElementById("pin");
    var pin = pinEl ? (pinEl.value || "").trim() : "";
    if (!/^\d{4}$/.test(pin)) { toast("Enter the 4-digit PIN."); return; }
    fetch("/api/castle/" + act, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: entryKey, pin: pin }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.ok) { lastPin = pin; toast(act === "approve" ? "Approved ✓ posted to balance" : "Declined"); return load().then(openParent); }
        if (j.error === "bad-pin") { toast("Wrong PIN — try again."); return; }
        if (j.error === "no-pin-set") { toast("Set a PIN first."); return openParent(); }
        toast("Couldn't update.");
      })
      .catch(function () { toast("Offline — couldn't update."); });
  }

  // ---- Load ----
  function load() {
    return fetch("/api/castle").then(function (r) { return r.json(); }).then(function (j) {
      entries = (j && j.entries) || []; render();
    }).catch(function () { entries = []; render(); toast("Couldn't reach Hank — showing seed only."); });
  }

  var root = document.createElement("div"); root.id = "app"; document.body.appendChild(root);
  load();
})();
