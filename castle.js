/* HANK · Castle Fund — kid page (shared by dagvald.html / davikja.html).
   Loop: kid taps a chore -> Pending -> either parent approves with a 4-digit PIN -> balance credits.
   Financial literacy: full transaction history, parent-paid interest (FamZoo-style), savings-growth chart.
   Per-kid chore lists + goal/interest are editable by a parent (PIN-gated) and stored in KV via the Worker. */
(function () {
  "use strict";

  // ---- Defaults (mirror the vault: 40 Projects/Active/Castle Fund). KV overrides these when a parent edits. ----
  var DEFAULT_CAT = {
    Dagvald: [
      { id: "room",   name: "Clean Room",   price: 5,  qty: 1, emoji: "🛏️", steps: "Make bed · clean floor · vacuum" },
      { id: "stalls", name: "Clean Stalls", price: 10, qty: 3, emoji: "🐴", per: "stall", steps: "Clean stall · empty water buckets" },
      { id: "mow",    name: "Mow Lawn",     price: 25, qty: 1, emoji: "🌱", steps: "Remove toys, sticks, poop · mow backyard within fence" }
    ],
    Davikja: [
      { id: "sunroom",   name: "Vacuum Sunroom",        price: 5,  qty: 1, emoji: "🧹", steps: "Put away shoes · items off floor · vacuum sunroom" },
      { id: "mainfloor", name: "Vacuum Main Floor",     price: 10, qty: 1, emoji: "🧹", steps: "Pick up floor · vacuum floor" },
      { id: "basement",  name: "Pickup Basement",       price: 10, qty: 1, emoji: "🧺", steps: "Pick up floor · vacuum" },
      { id: "litters",   name: "Sweep & Cycle Litters", price: 10, qty: 1, emoji: "🐈", steps: "Cycle litters · sweep · replace bags" }
    ]
  };
  var BASE = {
    Dagvald: { dob: "2015-09-17", reward: "LEGO Hogwarts Castle", goal: 250, seed: 85, interestPct: 5, interestOn: false, theme: "castle", color: "#7c3aed" },
    Davikja: { dob: "2017-01-20", reward: "$100 reward (TBD)",    goal: 100, seed: 20, interestPct: 5, interestOn: false, theme: "jar",    color: "#db2777" }
  };

  var KID = window.CASTLE_KID;
  if (!BASE[KID]) { document.body.innerHTML = "<p style='padding:24px;font-family:system-ui'>Unknown kid.</p>"; return; }

  var entries = [], apiCat = {}, apiCfg = {}, lastPin = "", editCat = null;
  function cfg() { var o = {}; var b = BASE[KID]; for (var k in b) o[k] = b[k]; var a = apiCfg[KID] || {}; for (var k2 in a) o[k2] = a[k2]; return o; }
  function catalog() { return (apiCat[KID] && apiCat[KID].length) ? apiCat[KID] : DEFAULT_CAT[KID]; }
  function money(n) { var s = (n < 0 ? "-" : "") + "$" + Math.abs(Math.round(n * 100) / 100).toFixed(Math.abs(n) % 1 ? 2 : 0); return s.replace(/\.00$/, ""); }
  function mine() { return entries.filter(function (e) { return e.kid === KID; }); }
  function approved() { return mine().filter(function (e) { return e.status === "approved"; }); }
  function pending() { return mine().filter(function (e) { return e.status === "pending"; }); }
  function balance() { var b = cfg().seed; approved().forEach(function (e) { b += e.amount; }); return b; }
  function today() { return new Date().toISOString().slice(0, 10); }
  function usedToday(name) { return mine().filter(function (e) { return e.chore === name && e.day === today() && e.status !== "declined"; }).length; }
  function monthlyContribution() {
    var earn = approved().filter(function (e) { return e.kind !== "interest"; });
    if (!earn.length) return 40;
    var first = Math.min.apply(null, earn.map(function (e) { return e.ts; }));
    var months = Math.max(0.5, (Date.now() - first) / 2592e6);
    return Math.max(10, Math.round(earn.reduce(function (s, e) { return s + e.amount; }, 0) / months));
  }

  // ---- Styles ----
  var css = "" +
    ":root{--ink:#1d2733;--muted:#7c8694;--line:#e7e9ee;--kid:" + BASE[KID].color + "}" +
    "*{box-sizing:border-box}body{margin:0;font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif;color:var(--ink);background:#f5f6f8}" +
    ".chead{background:linear-gradient(135deg,#367C2B,#2a5f22);color:#fff;padding:calc(14px + env(safe-area-inset-top)) 16px 0}" +
    ".cbar{display:flex;align-items:center;justify-content:space-between;gap:10px}.chead h1{margin:0;font-size:19px;font-weight:700}" +
    ".csub{margin:2px 0 0;opacity:.85;font-size:12.5px}" +
    ".pbtn{background:rgba(255,255,255,.18);border:0;color:#fff;font-size:13px;font-weight:600;padding:8px 12px;border-radius:10px;cursor:pointer}" +
    ".tabs{display:flex;gap:6px;margin-top:12px}.tab{color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:9px 14px;border-radius:10px 10px 0 0;opacity:.72}.tab.active{background:#f5f6f8;color:#367C2B;opacity:1}" +
    ".wrap{max-width:540px;margin:0 auto;padding:16px 16px 60px}" +
    ".hero{background:#fff;border:1px solid var(--line);border-radius:20px;padding:18px;margin:10px 0;box-shadow:0 1px 3px rgba(0,0,0,.05)}" +
    ".bal{font-size:40px;font-weight:800;letter-spacing:-1px}.sub{color:var(--muted);font-size:14px;margin-top:2px}" +
    ".art{margin:10px 0 2px}.mile{display:flex;gap:6px;margin-top:12px}.dot{flex:1;height:7px;border-radius:99px;background:#eceef2}.dot.on{background:var(--kid)}" +
    ".card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px;margin:10px 0;box-shadow:0 1px 2px rgba(0,0,0,.04)}" +
    ".h{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);margin:20px 4px 8px}" +
    ".cap{font-size:12px;color:var(--muted);margin:6px 2px 0;line-height:1.45}" +
    ".chore{width:100%;text-align:left;background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px 15px;margin-bottom:10px;display:flex;align-items:center;gap:13px;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.04)}" +
    ".chore:active{transform:scale(.99)}.chore[disabled]{opacity:.5}.chore .em{font-size:26px}.chore .ct{flex:1}.chore .cn{font-weight:700;font-size:16px}.chore .cs{font-size:12px;color:var(--muted);margin-top:2px}.chore .cp{font-weight:800;font-size:17px;color:var(--kid)}" +
    ".row{border-top:1px solid var(--line);padding:9px 2px;display:flex;justify-content:space-between;align-items:center;font-size:14px;gap:10px}.row:first-child{border-top:0}" +
    ".rl{flex:1}.rd{font-size:11.5px;color:var(--muted)}.ra{font-weight:700;white-space:nowrap}.pos{color:#1f8a4c}.neg{color:#b23b3b}.run{font-size:11.5px;color:var(--muted);white-space:nowrap}" +
    ".pill{font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px}.pill.p{background:#fff7e6;color:#b7791f}.pill.d{background:#f1f1f1;color:#888}" +
    ".empty{color:var(--muted);font-size:13px;padding:6px 4px}" +
    ".btnp{background:var(--kid);color:#fff;border:0;border-radius:10px;padding:9px 14px;font-weight:700;font-size:14px;cursor:pointer}" +
    ".btns{background:#fff;color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:9px 14px;font-weight:600;font-size:14px;cursor:pointer}" +
    ".appr{display:flex;gap:8px}.modal{position:fixed;inset:0;background:rgba(20,25,32,.45);display:none;align-items:flex-end;justify-content:center;z-index:50}.modal.on{display:flex}" +
    ".sheet{background:#f5f6f8;width:100%;max-width:540px;border-radius:20px 20px 0 0;padding:16px 16px 28px;max-height:88vh;overflow:auto}.sheet h3{margin:2px 4px 10px}.h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);margin:18px 2px 8px}" +
    ".inp{border:1px solid var(--line);border-radius:10px;padding:10px 11px;font-size:15px;background:#fff;width:100%}" +
    ".crow{display:grid;grid-template-columns:1fr 66px 46px 30px;gap:6px;margin-bottom:6px;align-items:center}.crow .full{grid-column:1/-1}.cdel{background:#fff;border:1px solid var(--line);border-radius:8px;font-size:14px;cursor:pointer;height:38px}" +
    ".lab{font-size:13px;color:var(--muted);margin:8px 2px 4px;display:block}" +
    ".toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#1d2733;color:#fff;padding:10px 16px;border-radius:99px;font-size:14px;opacity:0;transition:.2s;z-index:60;pointer-events:none}.toast.on{opacity:1}" +
    ".spark{animation:pop .5s ease}@keyframes pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1)}}";
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

  // ---- Savings growth chart (teaches compounding) ----
  function growthChart() {
    var months = 6, r = (cfg().interestPct || 0) / 100, c = monthlyContribution();
    var wI = balance(), nI = balance(), pts = [], max = Math.max(1, balance());
    for (var m = 0; m <= months; m++) { if (m > 0) { wI = wI * (1 + r) + c; nI = nI + c; } pts.push({ m: m, w: wI, n: nI }); if (wI > max) max = wI; }
    max = max * 1.12;
    var W = 300, H = 132, pL = 4, pR = 4, pT = 8, pB = 18, iw = W - pL - pR, ih = H - pT - pB;
    function X(m) { return pL + iw * (m / months); }
    function Y(v) { return pT + ih * (1 - v / max); }
    function line(key) { return pts.map(function (p, i) { return (i ? "L" : "M") + X(p.m).toFixed(1) + " " + Y(p[key]).toFixed(1); }).join(" "); }
    var area = line("w") + " L " + X(months).toFixed(1) + " " + Y(0).toFixed(1) + " L " + X(0).toFixed(1) + " " + Y(0).toFixed(1) + " Z";
    var svg = '<svg class="art" viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="' + area + '" fill="var(--kid)" opacity="0.10"/>' +
      '<path d="' + line("n") + '" fill="none" stroke="#b4b2a9" stroke-width="2" stroke-dasharray="4 4"/>' +
      '<path d="' + line("w") + '" fill="none" stroke="var(--kid)" stroke-width="2.5"/>' +
      '<circle cx="' + X(months).toFixed(1) + '" cy="' + Y(pts[months].w).toFixed(1) + '" r="4" fill="var(--kid)"/>';
    for (var t = 0; t <= months; t += 2) svg += '<text x="' + X(t).toFixed(1) + '" y="' + (H - 5) + '" font-size="10" fill="#9aa291" text-anchor="' + (t === 0 ? "start" : t === months ? "end" : "middle") + '">' + (t === 0 ? "now" : t + "mo") + '</text>';
    svg += '</svg>';
    return svg + '<div class="cap"><b style="color:var(--kid)">' + money(pts[months].w) + '</b> in 6 months if you save about ' + money(c) + '/month' + (r > 0 ? ' — the solid line is with Bank of Mom &amp; Dad interest (' + cfg().interestPct + '%/mo), the dotted line is without. That gap is the power of saving.' : '. Turn on interest in parent settings to grow it faster.') + '</div>';
  }

  // ---- Render ----
  function render() {
    var C = cfg(), bal = balance(), goal = C.goal, pct = goal ? Math.min(1, bal / goal) : 0;
    var pend = pending();
    var html = '<header class="chead"><div class="cbar"><h1>HANK · ' + KID + '</h1>' +
      '<button id="parentBtn" class="pbtn">🔑 Parent</button></div>' +
      '<p class="csub">Castle Fund — chores &amp; reward</p>' +
      '<div class="tabs"><a class="tab" href="./">Equipment</a><a class="tab" href="projects.html">Projects</a><a class="tab active" href="castle.html">Kids</a></div></header>';
    html += '<div class="wrap">';

    html += '<div class="hero">';
    html += C.theme === "castle" ? castleArt(pct) : jarArt(bal, goal);
    html += '<div class="bal">' + money(bal) + "</div>";
    if (goal) {
      html += '<div class="sub">' + money(bal) + " of " + money(goal) + " · " + C.reward + " · " + money(goal - bal) + " to go</div>";
      html += '<div class="mile">';
      for (var m = 1; m <= 5; m++) html += '<div class="dot ' + (pct >= m / 5 ? "on" : "") + '"></div>';
      html += "</div>";
    } else { html += '<div class="sub">Bank balance — saving up.</div>'; }
    html += "</div>";

    // Growth chart
    html += '<div class="h">If you keep saving</div><div class="card">' + growthChart() + "</div>";

    // Chores
    html += '<div class="h">Choose a chore</div>';
    catalog().forEach(function (c) {
      var used = usedToday(c.name), left = (c.qty || 1) - used, done = left <= 0;
      var sub = (c.steps || "") + ((c.qty || 1) > 1 ? "  ·  " + left + " of " + c.qty + " left today" : "");
      html += '<button class="chore" ' + (done ? "disabled" : "") + ' data-chore="' + esc(c.name) + '" data-amt="' + c.price + '" data-qty="' + (c.qty || 1) + '">' +
        '<span class="em">' + (c.emoji || "✅") + "</span>" +
        '<span class="ct"><span class="cn">' + esc(c.name) + (done ? " ✓" : "") + '</span><span class="cs">' + esc(sub) + "</span></span>" +
        '<span class="cp">' + money(c.price) + (c.per ? "/" + c.per : "") + "</span></button>";
    });

    // Pending
    html += '<div class="h">Waiting on Mom or Dad</div>';
    if (!pend.length) html += '<div class="empty">Nothing waiting. Tap a chore above when you finish it.</div>';
    else { html += '<div class="card">'; pend.forEach(function (e) { html += '<div class="row"><span class="rl">' + esc(e.chore) + '</span><span class="ra">' + money(e.amount) + '</span><span class="pill p">pending</span></div>'; }); html += "</div>"; }

    // History with running balance
    html += '<div class="h">History</div><div class="card">' + historyRows() + "</div>";

    html += "</div>";
    html += '<div class="modal" id="pm"><div class="sheet"><h3>Parent</h3><div id="pmBody"></div>' +
      '<div style="margin-top:14px;text-align:center"><button class="btns" id="pmClose">Close</button></div></div></div>';
    html += '<div class="toast" id="toast"></div>';
    document.getElementById("app").innerHTML = html;

    Array.prototype.forEach.call(document.querySelectorAll(".chore"), function (b) {
      b.addEventListener("click", function () { logChore(b.dataset.chore, +b.dataset.amt, +b.dataset.qty); });
    });
    document.getElementById("parentBtn").addEventListener("click", function () { openParent(); });
    document.getElementById("pmClose").addEventListener("click", function () { lastPin = ""; editCat = null; document.getElementById("pm").classList.remove("on"); });
  }

  function historyRows() {
    var hist = mine().slice().sort(function (a, b) { return a.ts - b.ts; });
    var run = cfg().seed, out = [];
    out.push({ label: "Starting balance", date: "", amount: cfg().seed, status: "approved", run: cfg().seed, seed: true });
    hist.forEach(function (e) { if (e.status === "approved") run += e.amount; out.push({ label: e.chore, date: new Date(e.ts).toLocaleDateString(), amount: e.amount, status: e.status, run: run, interest: e.kind === "interest" }); });
    out.reverse();
    if (out.length === 1) return '<div class="empty">No activity yet — earned chores and interest will show here with a running balance.</div>';
    return out.map(function (r) {
      var amt = (r.amount >= 0 ? "+" : "") + money(r.amount);
      var right = r.status === "approved" ? '<span class="ra ' + (r.amount < 0 ? "neg" : "pos") + '">' + amt + '</span><span class="run">' + money(r.run) + '</span>'
        : r.status === "declined" ? '<span class="pill d">declined</span>' : '<span class="pill p">pending</span>';
      return '<div class="row"><span class="rl">' + esc(r.label) + (r.interest ? " 🏦" : "") + '<div class="rd">' + (r.seed ? "seed" : r.date) + '</div></span>' + right + "</div>";
    }).join("");
  }

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function toast(msg) { var t = document.getElementById("toast"); if (!t) return; t.textContent = msg; t.classList.add("on"); setTimeout(function () { t.classList.remove("on"); }, 2200); }

  // ---- Kid action ----
  function logChore(chore, amt, qty) {
    fetch("/api/castle/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kid: KID, chore: chore, amount: amt, qty: qty }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.ok) { toast("✨ Logged! " + chore + " — waiting on Mom/Dad."); return load(); }
        if (j.error === "daily-limit") { toast("That one's done for today 👍"); return load(); }
        toast("Couldn't log — check connection.");
      }).catch(function () { toast("Offline — couldn't log right now."); });
  }

  // ---- Parent sheet: PIN -> approvals + manage chores + settings ----
  var PINBOX = '<input id="pin" class="inp" inputmode="numeric" maxlength="4" placeholder="4-digit PIN" style="letter-spacing:3px">';
  function getPin() { var el = document.getElementById("pin"); return el ? (el.value || "").trim() : lastPin; }

  function openParent() {
    document.getElementById("pm").classList.add("on");
    fetch("/api/castle/pinset").then(function (r) { return r.json(); }).then(function (j) {
      var body = document.getElementById("pmBody");
      if (j && j.set === false) {
        body.innerHTML = '<div class="empty" style="margin-bottom:8px">Set a 4-digit parent PIN (one time). You\'ll use it to approve chores and edit the list.</div>' +
          '<div style="display:flex;gap:8px">' + PINBOX.replace('id="pin"', 'id="newpin"') + '<button class="btnp" id="savepin">Save</button></div>';
        document.getElementById("savepin").addEventListener("click", savePin);
        return;
      }
      var C = cfg();
      var pend = entries.filter(function (e) { return e.status === "pending"; });
      var h = '<label class="lab">Parent PIN</label>' + PINBOX;
      // Approvals
      h += '<div class="h2">Approvals — both kids</div>';
      if (!pend.length) h += '<div class="empty">Nothing waiting. 🎉</div>';
      pend.forEach(function (e) {
        h += '<div class="row"><span class="rl"><b>' + esc(e.kid) + '</b> · ' + esc(e.chore) + ' · ' + money(e.amount) + '</span>' +
          '<span class="appr"><button class="btnp" data-k="' + e.key + '" data-act="approve">Approve</button><button class="btns" data-k="' + e.key + '" data-act="decline">No</button></span></div>';
      });
      // Manage chores (this kid)
      h += '<div class="h2">' + KID + "'s chores</div><div id=\"catRows\"></div>" +
        '<div style="display:flex;gap:8px;margin-top:6px"><button class="btns" id="addChore">+ Add chore</button><button class="btnp" id="saveCat">Save chores</button></div>';
      // Settings
      h += '<div class="h2">' + KID + "'s goal &amp; interest</div>" +
        '<label class="lab">Reward</label><input id="setReward" class="inp" value="' + esc(C.reward || "") + '">' +
        '<label class="lab">Goal $</label><input id="setGoal" class="inp" type="number" value="' + (C.goal || 0) + '">' +
        '<label class="lab">Interest %/month (Bank of Mom &amp; Dad)</label><input id="setInt" class="inp" type="number" value="' + (C.interestPct || 0) + '">' +
        '<label class="lab" style="display:flex;align-items:center;gap:8px;margin-top:8px"><input type="checkbox" id="setIntOn" ' + (C.interestOn ? "checked" : "") + '> Actually pay interest each month</label>' +
        '<button class="btnp" id="saveSet" style="margin-top:10px">Save goal &amp; interest</button>';
      body.innerHTML = h;
      var pinEl = document.getElementById("pin"); if (pinEl && lastPin) pinEl.value = lastPin;
      Array.prototype.forEach.call(document.querySelectorAll("#pmBody [data-act]"), function (b) { b.addEventListener("click", function () { decide(b.dataset.k, b.dataset.act); }); });
      editCat = catalog().map(function (c) { return { name: c.name, price: c.price, qty: c.qty || 1, steps: c.steps || "", emoji: c.emoji || "", per: c.per || "" }; });
      renderCatRows();
      document.getElementById("addChore").addEventListener("click", function () { syncCat(); editCat.push({ name: "", price: 5, qty: 1, steps: "", emoji: "✅", per: "" }); renderCatRows(); });
      document.getElementById("saveCat").addEventListener("click", saveCat);
      document.getElementById("saveSet").addEventListener("click", saveSettings);
    }).catch(function () { toast("Couldn't reach Hank."); });
  }

  function renderCatRows() {
    var html = editCat.map(function (c, i) {
      return '<div class="crow" data-i="' + i + '">' +
        '<input class="inp f-name" placeholder="Chore" value="' + esc(c.name) + '">' +
        '<input class="inp f-price" type="number" placeholder="$" value="' + c.price + '">' +
        '<input class="inp f-qty" type="number" placeholder="x" value="' + c.qty + '">' +
        '<button class="cdel" data-i="' + i + '">✕</button>' +
        '<input class="inp full f-steps" placeholder="Instructions" value="' + esc(c.steps) + '"></div>';
    }).join("");
    var box = document.getElementById("catRows"); box.innerHTML = html;
    Array.prototype.forEach.call(box.querySelectorAll(".cdel"), function (b) { b.addEventListener("click", function () { syncCat(); editCat.splice(+b.dataset.i, 1); renderCatRows(); }); });
  }
  function syncCat() {
    var rows = document.querySelectorAll("#catRows .crow");
    editCat = Array.prototype.map.call(rows, function (r) {
      return { name: r.querySelector(".f-name").value.trim(), price: Number(r.querySelector(".f-price").value) || 0,
        qty: Number(r.querySelector(".f-qty").value) || 1, steps: r.querySelector(".f-steps").value.trim(), emoji: "✅", per: "" };
    }).filter(function (c) { return c.name; });
  }
  function saveCat() {
    var pin = getPin(); if (!/^\d{4}$/.test(pin)) { toast("Enter the 4-digit PIN."); return; }
    syncCat(); lastPin = pin;
    fetch("/api/castle/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kid: KID, pin: pin, catalog: editCat }) })
      .then(function (r) { return r.json(); }).then(function (j) {
        if (j.ok) { toast("Chores saved."); return load().then(openParent); }
        if (j.error === "bad-pin") { toast("Wrong PIN."); return; }
        toast("Couldn't save chores.");
      }).catch(function () { toast("Offline — couldn't save."); });
  }
  function saveSettings() {
    var pin = getPin(); if (!/^\d{4}$/.test(pin)) { toast("Enter the 4-digit PIN."); return; }
    lastPin = pin;
    var conf = { goal: Number(document.getElementById("setGoal").value) || 0, reward: document.getElementById("setReward").value.trim(),
      interestPct: Number(document.getElementById("setInt").value) || 0, interestOn: document.getElementById("setIntOn").checked };
    fetch("/api/castle/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kid: KID, pin: pin, config: conf }) })
      .then(function (r) { return r.json(); }).then(function (j) {
        if (j.ok) { toast("Goal & interest saved."); return load().then(function () { return maybeAccrue(pin); }).then(load).then(openParent); }
        if (j.error === "bad-pin") { toast("Wrong PIN."); return; }
        toast("Couldn't save settings.");
      }).catch(function () { toast("Offline — couldn't save."); });
  }
  function savePin() {
    var pin = (document.getElementById("newpin").value || "").trim();
    if (!/^\d{4}$/.test(pin)) { toast("PIN must be 4 digits."); return; }
    fetch("/api/castle/setpin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: pin }) })
      .then(function (r) { return r.json(); }).then(function (j) {
        if (j.ok) { lastPin = pin; toast("PIN set — you can approve now."); openParent(); }
        else if (j.error === "pin-already-set") { toast("A PIN is already set."); openParent(); }
        else { toast("Couldn't set the PIN."); }
      }).catch(function () { toast("Offline — couldn't set the PIN."); });
  }
  function decide(entryKey, act) {
    var pin = getPin(); if (!/^\d{4}$/.test(pin)) { toast("Enter the 4-digit PIN."); return; }
    fetch("/api/castle/" + act, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: entryKey, pin: pin }) })
      .then(function (r) { return r.json(); }).then(function (j) {
        if (j.ok) { lastPin = pin; toast(act === "approve" ? "Approved ✓ posted to balance" : "Declined"); return maybeAccrue(pin).then(load).then(openParent); }
        if (j.error === "bad-pin") { toast("Wrong PIN — try again."); return; }
        if (j.error === "no-pin-set") { toast("Set a PIN first."); return openParent(); }
        toast("Couldn't update.");
      }).catch(function () { toast("Offline — couldn't update."); });
  }

  // Parent-paid interest, applied in-app while a parent is active (no loop/password needed).
  // Idempotent per kid+month (the Worker skips a period already credited).
  function balanceOf(kid) {
    var c = {}; var bs = BASE[kid]; for (var k in bs) c[k] = bs[k]; var a = apiCfg[kid] || {}; for (var k2 in a) c[k2] = a[k2];
    var bal = c.seed; entries.forEach(function (e) { if (e.kid === kid && e.status === "approved") bal += e.amount; });
    return { bal: bal, c: c };
  }
  function maybeAccrue(pin) {
    var period = new Date().toISOString().slice(0, 7), jobs = [];
    Object.keys(BASE).forEach(function (kid) {
      var o = balanceOf(kid);
      if (!o.c.interestOn) return;
      if (entries.some(function (e) { return e.kid === kid && e.kind === "interest" && e.period === period; })) return;
      var amt = Math.round(o.bal * (o.c.interestPct || 0) / 100 * 100) / 100;
      if (amt <= 0) return;
      jobs.push(fetch("/api/castle/accrue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kid: kid, amount: amt, period: period, pin: pin }) }).catch(function () {}));
    });
    return Promise.all(jobs);
  }

  // ---- Load ----
  function load() {
    return fetch("/api/castle").then(function (r) { return r.json(); }).then(function (j) {
      entries = (j && j.entries) || []; apiCat = (j && j.catalogs) || {}; apiCfg = (j && j.configs) || {}; render();
    }).catch(function () { entries = []; render(); toast("Couldn't reach Hank — showing defaults."); });
  }
  var root = document.createElement("div"); root.id = "app"; document.body.appendChild(root);
  load();
})();
