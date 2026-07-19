// HANK Worker — serves the static app + a small password-gated API backed by KV.
// Password is the Cloudflare secret HANK_PASSWORD (set in the dashboard). KV binding = STATE.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Hank-Key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function sha256hex(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// Castle Fund: one KV snapshot (castle:bundle) — avoids prefix list() on every read (free tier = 1000 lists/day).
const CASTLE_BUNDLE_KEY = "castle:bundle";

function emptyCastleBundle() {
  return { v: 0, entries: [], catalogs: {}, configs: {}, wishlists: {} };
}

function castleBundleResponse(bundle) {
  const entries = [...bundle.entries].sort((a, b) => (b.ts || 0) - (a.ts || 0));
  return { ok: true, v: bundle.v || 0, entries, catalogs: bundle.catalogs || {}, configs: bundle.configs || {}, wishlists: bundle.wishlists || {} };
}

async function migrateCastleBundle(env) {
  const bundle = emptyCastleBundle();
  const el = await env.STATE.list({ prefix: "castle:e:" });
  for (const k of el.keys) {
    const v = await env.STATE.get(k.name);
    if (v) bundle.entries.push({ key: k.name, ...JSON.parse(v) });
  }
  const cl = await env.STATE.list({ prefix: "castle:cat:" });
  for (const k of cl.keys) {
    const v = await env.STATE.get(k.name);
    if (v) bundle.catalogs[k.name.slice(11)] = JSON.parse(v);
  }
  const gl = await env.STATE.list({ prefix: "castle:cfg:" });
  for (const k of gl.keys) {
    const v = await env.STATE.get(k.name);
    if (v) bundle.configs[k.name.slice(11)] = JSON.parse(v);
  }
  const wl = await env.STATE.list({ prefix: "castle:wish:" });
  for (const k of wl.keys) {
    const v = await env.STATE.get(k.name);
    if (v) bundle.wishlists[k.name.slice(12)] = JSON.parse(v);
  }
  bundle.v = 1;
  await env.STATE.put(CASTLE_BUNDLE_KEY, JSON.stringify(bundle));
  return bundle;
}

async function loadCastleBundle(env) {
  const raw = await env.STATE.get(CASTLE_BUNDLE_KEY);
  if (raw) return JSON.parse(raw);
  try {
    return await migrateCastleBundle(env);
  } catch (e) {
    return null;
  }
}

const castleMissing = () => json({ ok: false, error: "castle-bundle-missing", hint: "POST /api/castle/seed-bundle (loop key) or wait for KV list quota reset" }, 503);

async function saveCastleBundle(env, bundle) {
  bundle.v = (bundle.v || 0) + 1;
  await env.STATE.put(CASTLE_BUNDLE_KEY, JSON.stringify(bundle));
  return bundle;
}

async function persistCastleEntry(env, bundle, key, entry) {
  const row = { ...entry, key };
  const i = bundle.entries.findIndex((e) => e.key === key);
  if (i >= 0) bundle.entries[i] = row;
  else bundle.entries.push(row);
  await env.STATE.put(key, JSON.stringify(entry));
  await saveCastleBundle(env, bundle);
  return row;
}

function choreUsedCount(bundle, kid, chore, day, once) {
  let used = 0;
  for (const e of bundle.entries) {
    if (e.kid !== kid || e.chore !== chore || e.status === "declined") continue;
    if (once ? e.once : e.day === day) used++;
  }
  return used;
}

function bucketsForCfg(configs, kid, amt) {
  let al = { save: 0, spend: 100, give: 0 };
  const cf = configs[kid];
  if (cf && cf.alloc) al = cf.alloc;
  const save = Math.round(amt * (al.save || 0)) / 100;
  const give = Math.round(amt * (al.give || 0)) / 100;
  const spend = Math.round((amt - save - give) * 100) / 100;
  return { save, spend, give };
}

// Capture queue: one KV snapshot — avoids list() on GET /api/answers (same free-tier limit as Castle).
const CAPTURE_BUNDLE_KEY = "capture:bundle";

function emptyCaptureBundle() {
  return { v: 0, answers: [], chat: [] };
}

async function migrateCaptureBundle(env) {
  const bundle = emptyCaptureBundle();
  const al = await env.STATE.list({ prefix: "ans:" });
  for (const k of al.keys) {
    const v = await env.STATE.get(k.name);
    if (v) bundle.answers.push({ key: k.name, ...JSON.parse(v) });
  }
  const cl = await env.STATE.list({ prefix: "chat:" });
  for (const k of cl.keys) {
    const v = await env.STATE.get(k.name);
    if (v) bundle.chat.push({ key: k.name, ...JSON.parse(v) });
  }
  bundle.v = 1;
  await env.STATE.put(CAPTURE_BUNDLE_KEY, JSON.stringify(bundle));
  return bundle;
}

async function loadCaptureBundle(env) {
  const raw = await env.STATE.get(CAPTURE_BUNDLE_KEY);
  if (raw) return JSON.parse(raw);
  try {
    return await migrateCaptureBundle(env);
  } catch (e) {
    return emptyCaptureBundle();
  }
}

async function saveCaptureBundle(env, bundle) {
  bundle.v = (bundle.v || 0) + 1;
  await env.STATE.put(CAPTURE_BUNDLE_KEY, JSON.stringify(bundle));
  return bundle;
}
function getCookie(request, name) {
  const h = request.headers.get("Cookie") || "";
  for (const c of h.split(";")) {
    const i = c.indexOf("=");
    if (i > -1 && c.slice(0, i).trim() === name) return c.slice(i + 1).trim();
  }
  return "";
}
function loginPage(toPath, wrong) {
  const to = encodeURIComponent(toPath || "/");
  const body = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HANK — sign in</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;background:#f6f7f3;color:#1c2419;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
.card{background:#fff;border:1px solid #e4e7df;border-radius:14px;padding:28px;max-width:340px;width:90%;box-shadow:0 6px 24px rgba(0,0,0,.06)}
h1{font-size:20px;margin:0 0 4px;color:#367C2B}p{color:#6b7464;font-size:14px;margin:0 0 18px}
input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #cfd6c8;border-radius:9px;font-size:16px;margin-bottom:12px}
button{width:100%;padding:12px;border:0;border-radius:9px;background:#367C2B;color:#fff;font-size:16px;font-weight:600}
.err{color:#d24b3e;font-size:13px;margin:-6px 0 12px}</style></head>
<body><form class="card" method="POST" action="/__login?to=${to}">
<h1>HANK</h1><p>Home &amp; Ranch. Enter the family password to continue.</p>
${wrong ? '<div class="err">Wrong password — try again.</div>' : ""}
<input type="password" name="pw" placeholder="Password" autofocus autocomplete="current-password">
<button type="submit">Enter</button></form></body></html>`;
  return new Response(body, { status: wrong ? 401 : 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    // Family password gate (protects pages + manuals + kids' data). Cookie lasts 30 days per device.
    const gateToken = env.HANK_PASSWORD ? await sha256hex("hankgate:" + env.HANK_PASSWORD) : "";
    const siteAuthed = !env.HANK_PASSWORD || getCookie(request, "hank_site") === gateToken;

    if (url.pathname === "/__login" && request.method === "POST") {
      const form = await request.formData().catch(() => null);
      const pw = form ? String(form.get("pw") || "") : "";
      const to = url.searchParams.get("to") || "/";
      const dest = to.startsWith("/") ? to : "/";
      if (env.HANK_PASSWORD && pw === env.HANK_PASSWORD) {
        return new Response(null, { status: 302, headers: {
          "Set-Cookie": `hank_site=${gateToken}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
          "Location": dest,
        } });
      }
      return loginPage(dest, true);
    }

    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url, siteAuthed);

    // static app + manuals — require the family password
    if (!siteAuthed) return loginPage(url.pathname + url.search, false);
    return env.ASSETS.fetch(request);
  },
};

async function handleApi(request, env, url, siteAuthed) {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  const provided = request.headers.get("X-Hank-Key") || url.searchParams.get("key") || "";
  const expected = env.HANK_PASSWORD || "";
  const configured = expected.length > 0;
  const authed = configured && provided === expected;
  // Castle data is readable/writable by the loop (key) OR a signed-in family device (site cookie), never anonymously.
  const familyOrLoop = authed || !!siteAuthed;
  const kv = !!env.STATE;

  // Health/check-connection — safe to call without auth; reports what's working.
  if (url.pathname === "/api/health") {
    return json({
      ok: true,
      passwordSetInCloudflare: configured,
      passwordMatches: authed,
      kvConnected: kv,
      xaiApiKeySet: !!(env.XAI_API_KEY && String(env.XAI_API_KEY).length > 0),
      time: new Date().toISOString(),
    });
  }

  // ---- Castle Fund (kids' chore→reward) ----
  // Read state + log a chore require a signed-in family device (site cookie) or the loop key — never anonymous
  // (this keeps the kids' names/balances private). Parent approve/decline are additionally gated by the 4-digit PIN.

  // Read-only token (2026-07-02): lets the autonomous loop (which can't send auth headers) sync Castle data
  // via GET /api/castle?rt=<token>. Scope = this ONE read endpoint. It can never approve, log, edit, or read
  // anything else, and it is NOT the family password. Stored in KV (castle:readtoken).
  // Set/rotate: POST /api/castle/readtoken from a signed-in family device or with the HANK key.
  if (url.pathname === "/api/castle/readtoken" && request.method === "POST") {
    if (!familyOrLoop) return json({ ok: false, error: "auth" }, 401);
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const b = await request.json().catch(() => ({}));
    const token = (typeof b.token === "string" && b.token.length >= 24)
      ? b.token
      : [...crypto.getRandomValues(new Uint8Array(24))].map((x) => x.toString(16).padStart(2, "0")).join("");
    await env.STATE.put("castle:readtoken", token);
    return json({ ok: true, token });
  }

  // Loop-only: seed bundle without KV list() — use when list quota exhausted or first deploy.
  if (url.pathname === "/api/castle/seed-bundle" && request.method === "POST") {
    if (!authed) return json({ ok: false, error: "auth" }, 401);
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const b = await request.json().catch(() => ({}));
    const bundle = {
      v: Number(b.v) || 1,
      entries: Array.isArray(b.entries) ? b.entries : [],
      catalogs: (b.catalogs && typeof b.catalogs === "object") ? b.catalogs : {},
      configs: (b.configs && typeof b.configs === "object") ? b.configs : {},
      wishlists: (b.wishlists && typeof b.wishlists === "object") ? b.wishlists : {},
    };
    await env.STATE.put(CASTLE_BUNDLE_KEY, JSON.stringify(bundle));
    return json({ ok: true, seeded: true, v: bundle.v, entries: bundle.entries.length });
  }

  if (url.pathname === "/api/castle" && request.method === "GET") {
    let rtOk = false;
    const rt = url.searchParams.get("rt") || "";
    if (rt && kv) { const saved = await env.STATE.get("castle:readtoken"); rtOk = !!saved && rt === saved; }
    if (!familyOrLoop && !rtOk) return json({ ok: false, error: "auth" }, 401);
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const bundle = await loadCastleBundle(env);
    if (!bundle) return castleMissing();
    const clientV = parseInt(url.searchParams.get("v") || "0", 10);
    if (clientV > 0 && clientV === bundle.v) return json({ ok: true, unchanged: true, v: bundle.v });
    return json(castleBundleResponse(bundle));
  }
  if (url.pathname === "/api/castle/log" && request.method === "POST") {
    if (!familyOrLoop) return json({ ok: false, error: "auth" }, 401);
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const b = await request.json().catch(() => ({}));
    if (!b.kid || !b.chore) return json({ ok: false, error: "missing-fields" }, 400);
    const day = (typeof b.day === "string" && b.day) ? b.day : new Date().toISOString().slice(0, 10);
    const once = !!b.once;
    const qty = Number(b.qty) || 1;
    const bundle = await loadCastleBundle(env);
    if (!bundle) return castleMissing();
    const used = choreUsedCount(bundle, b.kid, b.chore, day, once);
    if (used >= (once ? 1 : qty)) return json({ ok: false, error: once ? "once-done" : "daily-limit", used }, 409);
    const id = "castle:e:" + Date.now() + ":" + Math.random().toString(36).slice(2, 7);
    const entry = { kid: b.kid, chore: b.chore, amount: Number(b.amount) || 0, status: "pending", ts: Date.now(), day, once };
    const row = await persistCastleEntry(env, bundle, id, entry);
    return json({ ok: true, id, entry: row, v: bundle.v });
  }
  // Is a parent PIN set yet?
  if (url.pathname === "/api/castle/pinset" && request.method === "GET") {
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const p = await env.STATE.get("castle:pin");
    return json({ ok: true, set: !!p });
  }
  // Set the PIN once (first run). Won't overwrite an existing PIN.
  if (url.pathname === "/api/castle/setpin" && request.method === "POST") {
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const b = await request.json().catch(() => ({}));
    const pin = String(b.pin || "");
    if (!/^\d{4}$/.test(pin)) return json({ ok: false, error: "bad-pin-format" }, 400);
    if (await env.STATE.get("castle:pin")) return json({ ok: false, error: "pin-already-set" }, 409);
    await env.STATE.put("castle:pin", pin);
    return json({ ok: true, set: true });
  }
  async function pinOkFor(b) { const sp = await env.STATE.get("castle:pin"); return authed || (sp && String(b.pin || "") === sp); }
  function newCastleEntry(kid, chore, amount, extra) {
    return Object.assign({ kid, chore, amount, status: "approved", approver: "parent", ts: Date.now(), day: new Date().toISOString().slice(0, 10) }, extra || {});
  }

  // Parent decision — gated by the 4-digit PIN. Approving splits an earning into buckets.
  if ((url.pathname === "/api/castle/approve" || url.pathname === "/api/castle/decline") && request.method === "POST") {
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const b = await request.json().catch(() => ({}));
    const savedPin = await env.STATE.get("castle:pin");
    if (!savedPin) return json({ ok: false, error: "no-pin-set" }, 409);
    if (String(b.pin || "") !== savedPin && !authed) return json({ ok: false, error: "bad-pin" }, 401);
    const bundle = await loadCastleBundle(env);
    if (!bundle) return castleMissing();
    const hit = bundle.entries.find((e) => e.key === b.key);
    if (!hit) return json({ ok: false, error: "not-found" }, 404);
    const e = { ...hit };
    delete e.key;
    e.status = url.pathname.endsWith("approve") ? "approved" : "declined";
    e.approver = "parent";
    e.decidedTs = Date.now();
    if (b.note) e.note = b.note;
    if (e.status === "approved" && !e.buckets && (e.amount || 0) > 0 && e.kind !== "interest") {
      e.buckets = bucketsForCfg(bundle.configs, e.kid, e.amount);
    }
    const row = await persistCastleEntry(env, bundle, b.key, e);
    return json({ ok: true, entry: row, v: bundle.v });
  }

  // Manual deduction / penalty (PIN) — negative entry against the Spend bucket.
  if (url.pathname === "/api/castle/deduct" && request.method === "POST") {
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const b = await request.json().catch(() => ({}));
    if (!(await pinOkFor(b))) return json({ ok: false, error: "bad-pin" }, 401);
    const amt = Math.abs(Number(b.amount) || 0);
    if (!b.kid || !amt) return json({ ok: false, error: "missing-fields" }, 400);
    const bundle = await loadCastleBundle(env);
    if (!bundle) return castleMissing();
    const id = "castle:e:" + Date.now() + ":" + Math.random().toString(36).slice(2, 7);
    const entry = newCastleEntry(b.kid, "Deduction" + (b.reason ? ": " + b.reason : ""), -amt, { kind: "deduction", buckets: { save: 0, spend: -amt, give: 0 } });
    const row = await persistCastleEntry(env, bundle, id, entry);
    return json({ ok: true, entry: row, v: bundle.v });
  }

  // Parent sets a kid's wishlist array (PIN): [{id,name,price,url,goal,purchased}]
  if (url.pathname === "/api/castle/wishlist" && request.method === "POST") {
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const b = await request.json().catch(() => ({}));
    if (!(await pinOkFor(b))) return json({ ok: false, error: "bad-pin" }, 401);
    if (!b.kid || !Array.isArray(b.wishlist)) return json({ ok: false, error: "missing-fields" }, 400);
    const bundle = await loadCastleBundle(env);
    if (!bundle) return castleMissing();
    bundle.wishlists[b.kid] = b.wishlist;
    await env.STATE.put("castle:wish:" + b.kid, JSON.stringify(b.wishlist));
    await saveCastleBundle(env, bundle);
    return json({ ok: true, v: bundle.v });
  }

  // Kid stars one wishlist item as the active goal (no PIN — low-stakes).
  if (url.pathname === "/api/castle/star" && request.method === "POST") {
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const b = await request.json().catch(() => ({}));
    const bundle = await loadCastleBundle(env);
    if (!bundle) return castleMissing();
    const arr = bundle.wishlists[b.kid];
    if (!arr) return json({ ok: false, error: "no-wishlist" }, 404);
    arr.forEach((it) => { it.goal = (it.id === b.id && !it.purchased); });
    await env.STATE.put("castle:wish:" + b.kid, JSON.stringify(arr));
    await saveCastleBundle(env, bundle);
    return json({ ok: true, wishlist: arr, v: bundle.v });
  }

  // Parent marks a wishlist item purchased (PIN) — negative Spend entry + flag it.
  if (url.pathname === "/api/castle/purchase" && request.method === "POST") {
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const b = await request.json().catch(() => ({}));
    if (!(await pinOkFor(b))) return json({ ok: false, error: "bad-pin" }, 401);
    const bundle = await loadCastleBundle(env);
    if (!bundle) return castleMissing();
    const arr = bundle.wishlists[b.kid];
    if (!arr) return json({ ok: false, error: "no-wishlist" }, 404);
    const it = arr.find((x) => x.id === b.id);
    if (!it) return json({ ok: false, error: "not-found" }, 404);
    const price = Number(it.price) || 0;
    const id = "castle:e:" + Date.now() + ":" + Math.random().toString(36).slice(2, 7);
    const entry = newCastleEntry(b.kid, "Bought: " + it.name, -price, { kind: "purchase", buckets: { save: 0, spend: -price, give: 0 } });
    it.purchased = true; it.goal = false;
    const row = await persistCastleEntry(env, bundle, id, entry);
    await env.STATE.put("castle:wish:" + b.kid, JSON.stringify(arr));
    return json({ ok: true, entry: row, v: bundle.v });
  }

  // Parent edits the chore list or settings (goal/reward/interest) — PIN-gated, or loop key (authed) for operator directives.
  if ((url.pathname === "/api/castle/catalog" || url.pathname === "/api/castle/config") && request.method === "POST") {
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const b = await request.json().catch(() => ({}));
    const savedPin = await env.STATE.get("castle:pin");
    if (!savedPin && !authed) return json({ ok: false, error: "no-pin-set" }, 409);
    if (!authed && String(b.pin || "") !== savedPin) return json({ ok: false, error: "bad-pin" }, 401);
    if (!b.kid) return json({ ok: false, error: "missing-kid" }, 400);
    const bundle = await loadCastleBundle(env);
    if (!bundle) return castleMissing();
    if (url.pathname.endsWith("catalog")) {
      if (!Array.isArray(b.catalog)) return json({ ok: false, error: "missing-catalog" }, 400);
      bundle.catalogs[b.kid] = b.catalog;
      await env.STATE.put("castle:cat:" + b.kid, JSON.stringify(b.catalog));
    } else {
      if (typeof b.config !== "object" || !b.config) return json({ ok: false, error: "missing-config" }, 400);
      bundle.configs[b.kid] = b.config;
      await env.STATE.put("castle:cfg:" + b.kid, JSON.stringify(b.config));
    }
    await saveCastleBundle(env, bundle);
    return json({ ok: true, v: bundle.v });
  }

  // Parent-paid interest. Authorized by the parent PIN (in-app, no loop needed) OR the HANK password (loop).
  // Idempotent per kid+period so repeated calls in a month don't double-credit.
  if (url.pathname === "/api/castle/accrue" && request.method === "POST") {
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const b = await request.json().catch(() => ({}));
    const savedPin = await env.STATE.get("castle:pin");
    const pinOk = savedPin && String(b.pin || "") === savedPin;
    if (!authed && !pinOk) return json({ ok: false, error: "bad-pin" }, 401);
    if (!b.kid || b.amount == null || !b.period) return json({ ok: false, error: "missing-fields" }, 400);
    const bundle = await loadCastleBundle(env);
    if (!bundle) return castleMissing();
    if (bundle.entries.some((e) => e.kind === "interest" && e.kid === b.kid && e.period === b.period)) {
      return json({ ok: true, skipped: "already-accrued", v: bundle.v });
    }
    const id = "castle:e:" + Date.now() + ":" + Math.random().toString(36).slice(2, 7);
    const entry = { kid: b.kid, chore: "Interest · " + b.period, amount: Number(b.amount) || 0, status: "approved", approver: "Bank of Mom & Dad", kind: "interest", period: b.period, ts: Date.now(), day: new Date().toISOString().slice(0, 10) };
    const row = await persistCastleEntry(env, bundle, id, entry);
    return json({ ok: true, entry: row, v: bundle.v });
  }

  // Everything below requires the correct HANK password (chat + tap-to-answer).
  if (!authed) return json({ ok: false, error: configured ? "wrong-password" : "no-password-set" }, 401);
  if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);

  // Save a tapped answer / captured input.
  if (url.pathname === "/api/answer" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const id = "ans:" + Date.now() + ":" + Math.random().toString(36).slice(2, 7);
    const row = { ...body, ts: Date.now() };
    await env.STATE.put(id, JSON.stringify(row));
    const bundle = await loadCaptureBundle(env);
    bundle.answers.push({ key: id, ...row });
    await saveCaptureBundle(env, bundle);
    return json({ ok: true, stored: id });
  }

  // In-app Hank chat — xAI Grok API; context bundle = system prompt (refreshed on deploy).
  if (url.pathname === "/api/chat" && request.method === "POST") {
    if (!env.XAI_API_KEY) return json({ ok: false, error: "no-xai-key" }, 400);
    const body = await request.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
    if (!messages.length) return json({ ok: false, error: "no-messages" }, 400);
    let system = "You are HANK, Darren's home & ranch assistant. Be true and honest, answer-first, concise.";
    try {
      const c = await env.ASSETS.fetch(new Request(new URL("/hank-context.md", request.url)));
      if (c.ok) system = await c.text();
    } catch (e) {}
    try {
      const last = messages[messages.length - 1];
      if (last && last.role === "user") {
        const id = "chat:" + Date.now();
        const row = { text: last.content, ts: Date.now() };
        await env.STATE.put(id, JSON.stringify(row));
        const cb = await loadCaptureBundle(env);
        cb.chat.push({ key: id, ...row });
        await saveCaptureBundle(env, cb);
      }
    } catch (e) {}
    const xaiMessages = [{ role: "system", content: system }, ...messages.filter((m) => m && m.role && m.content)];
    let aj;
    try {
      const ar = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: "Bearer " + env.XAI_API_KEY, "content-type": "application/json" },
        body: JSON.stringify({
          model: "grok-4-fast-non-reasoning",
          messages: xaiMessages,
          max_completion_tokens: 1024,
          temperature: 0.3,
        }),
      });
      aj = await ar.json();
      if (!ar.ok) return json({ ok: false, error: "xai-error", detail: aj }, 502);
    } catch (e) {
      return json({ ok: false, error: "xai-fetch-failed" }, 502);
    }
    const reply =
      (aj.choices && aj.choices[0] && aj.choices[0].message && aj.choices[0].message.content) || "(no reply)";
    return json({ ok: true, reply });
  }

  // List pending captures (the daily loop reads + clears these): tapped answers (ans:) AND in-app chat turns (chat:).
  if (url.pathname === "/api/answers" && request.method === "GET") {
    const bundle = await loadCaptureBundle(env);
    const answers = bundle.answers || [];
    const chat = bundle.chat || [];
    return json({ ok: true, count: answers.length + chat.length, answers, chat, v: bundle.v || 0 });
  }

  // Clear captures (used by the loop after ingesting): a single key, or ALL ans: + chat:.
  if (url.pathname === "/api/clear" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const bundle = await loadCaptureBundle(env);
    if (body.key) {
      await env.STATE.delete(body.key);
      bundle.answers = bundle.answers.filter((r) => r.key !== body.key);
      bundle.chat = bundle.chat.filter((r) => r.key !== body.key);
      await saveCaptureBundle(env, bundle);
      return json({ ok: true, cleared: body.key });
    }
    const n = (bundle.answers || []).length + (bundle.chat || []).length;
    bundle.answers = [];
    bundle.chat = [];
    await saveCaptureBundle(env, bundle);
    return json({ ok: true, clearedAll: n });
  }

  return json({ ok: false, error: "not-found" }, 404);
}
