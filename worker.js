// HANK Worker — serves the static app + a small password-gated API backed by KV.
// Password is the Cloudflare secret HANK_PASSWORD (set in the dashboard). KV binding = STATE.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Hank-Key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    // everything else = the static app (index.html, projects.html, etc.)
    return env.ASSETS.fetch(request);
  },
};

async function handleApi(request, env, url) {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  const provided = request.headers.get("X-Hank-Key") || url.searchParams.get("key") || "";
  const expected = env.HANK_PASSWORD || "";
  const configured = expected.length > 0;
  const authed = configured && provided === expected;
  const kv = !!env.STATE;

  // Health/check-connection — safe to call without auth; reports what's working.
  if (url.pathname === "/api/health") {
    return json({
      ok: true,
      passwordSetInCloudflare: configured,
      passwordMatches: authed,
      kvConnected: kv,
      time: new Date().toISOString(),
    });
  }

  // ---- Castle Fund (kids' chore→reward) ----
  // Kid actions (read state, log a chore) need NO login — a logged chore is only "pending" and
  // moves no money. Parent approve/decline are gated by a simple 4-digit PIN (set once, stored in KV).
  if (url.pathname === "/api/castle" && request.method === "GET") {
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const list = await env.STATE.list({ prefix: "castle:e:" });
    const entries = [];
    for (const k of list.keys) { const v = await env.STATE.get(k.name); if (v) entries.push({ key: k.name, ...JSON.parse(v) }); }
    entries.sort((a, b) => b.ts - a.ts);
    const catalogs = {};
    const cl = await env.STATE.list({ prefix: "castle:cat:" });
    for (const k of cl.keys) { const v = await env.STATE.get(k.name); if (v) catalogs[k.name.slice(11)] = JSON.parse(v); }
    const configs = {};
    const gl = await env.STATE.list({ prefix: "castle:cfg:" });
    for (const k of gl.keys) { const v = await env.STATE.get(k.name); if (v) configs[k.name.slice(11)] = JSON.parse(v); }
    return json({ ok: true, entries, catalogs, configs });
  }
  if (url.pathname === "/api/castle/log" && request.method === "POST") {
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const b = await request.json().catch(() => ({}));
    if (!b.kid || !b.chore) return json({ ok: false, error: "missing-fields" }, 400);
    const day = new Date().toISOString().slice(0, 10);
    const qty = Number(b.qty) || 1;
    const list = await env.STATE.list({ prefix: "castle:e:" });
    let used = 0;
    for (const k of list.keys) { const v = await env.STATE.get(k.name); if (!v) continue; const e = JSON.parse(v); if (e.kid === b.kid && e.chore === b.chore && e.day === day && e.status !== "declined") used++; }
    if (used >= qty) return json({ ok: false, error: "daily-limit", used, qty }, 409);
    const id = "castle:e:" + Date.now() + ":" + Math.random().toString(36).slice(2, 7);
    const entry = { kid: b.kid, chore: b.chore, amount: Number(b.amount) || 0, status: "pending", ts: Date.now(), day };
    await env.STATE.put(id, JSON.stringify(entry));
    return json({ ok: true, id, entry });
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
  // Parent decision — gated by the 4-digit PIN. Either parent may approve.
  if ((url.pathname === "/api/castle/approve" || url.pathname === "/api/castle/decline") && request.method === "POST") {
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const b = await request.json().catch(() => ({}));
    const savedPin = await env.STATE.get("castle:pin");
    if (!savedPin) return json({ ok: false, error: "no-pin-set" }, 409);
    if (String(b.pin || "") !== savedPin) return json({ ok: false, error: "bad-pin" }, 401);
    const v = b.key ? await env.STATE.get(b.key) : null;
    if (!v) return json({ ok: false, error: "not-found" }, 404);
    const e = JSON.parse(v);
    e.status = url.pathname.endsWith("approve") ? "approved" : "declined";
    e.approver = "parent";
    e.decidedTs = Date.now();
    if (b.note) e.note = b.note;
    await env.STATE.put(b.key, JSON.stringify(e));
    return json({ ok: true, entry: e });
  }

  // Parent edits the chore list or settings (goal/reward/interest) — PIN-gated.
  if ((url.pathname === "/api/castle/catalog" || url.pathname === "/api/castle/config") && request.method === "POST") {
    if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);
    const b = await request.json().catch(() => ({}));
    const savedPin = await env.STATE.get("castle:pin");
    if (!savedPin) return json({ ok: false, error: "no-pin-set" }, 409);
    if (String(b.pin || "") !== savedPin) return json({ ok: false, error: "bad-pin" }, 401);
    if (!b.kid) return json({ ok: false, error: "missing-kid" }, 400);
    if (url.pathname.endsWith("catalog")) {
      if (!Array.isArray(b.catalog)) return json({ ok: false, error: "missing-catalog" }, 400);
      await env.STATE.put("castle:cat:" + b.kid, JSON.stringify(b.catalog));
    } else {
      if (typeof b.config !== "object" || !b.config) return json({ ok: false, error: "missing-config" }, 400);
      await env.STATE.put("castle:cfg:" + b.kid, JSON.stringify(b.config));
    }
    return json({ ok: true });
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
    const list = await env.STATE.list({ prefix: "castle:e:" });
    for (const k of list.keys) { const v = await env.STATE.get(k.name); if (!v) continue; const e = JSON.parse(v); if (e.kind === "interest" && e.kid === b.kid && e.period === b.period) return json({ ok: true, skipped: "already-accrued" }); }
    const id = "castle:e:" + Date.now() + ":" + Math.random().toString(36).slice(2, 7);
    const entry = { kid: b.kid, chore: "Interest · " + b.period, amount: Number(b.amount) || 0, status: "approved", approver: "Bank of Mom & Dad", kind: "interest", period: b.period, ts: Date.now(), day: new Date().toISOString().slice(0, 10) };
    await env.STATE.put(id, JSON.stringify(entry));
    return json({ ok: true, entry });
  }

  // Everything below requires the correct HANK password (chat + tap-to-answer).
  if (!authed) return json({ ok: false, error: configured ? "wrong-password" : "no-password-set" }, 401);
  if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);

  // Save a tapped answer / captured input.
  if (url.pathname === "/api/answer" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const id = "ans:" + Date.now() + ":" + Math.random().toString(36).slice(2, 7);
    await env.STATE.put(id, JSON.stringify({ ...body, ts: Date.now() }));
    return json({ ok: true, stored: id });
  }

  // In-app Hank chat — calls the Anthropic API with the context bundle as the system prompt.
  if (url.pathname === "/api/chat" && request.method === "POST") {
    if (!env.ANTHROPIC_API_KEY) return json({ ok: false, error: "no-anthropic-key" }, 400);
    const body = await request.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
    if (!messages.length) return json({ ok: false, error: "no-messages" }, 400);
    // load the context bundle (refreshed by the loop on each deploy)
    let system = "You are HANK, Darren's home & ranch assistant. Be true and honest, answer-first, concise.";
    try {
      const c = await env.ASSETS.fetch(new Request(new URL("/hank-context.md", request.url)));
      if (c.ok) system = await c.text();
    } catch (e) {}
    // log Darren's latest turn so the daily loop can file any action items
    try {
      const last = messages[messages.length - 1];
      if (last && last.role === "user") await env.STATE.put("chat:" + Date.now(), JSON.stringify({ text: last.content, ts: Date.now() }));
    } catch (e) {}
    let aj;
    try {
      const ar = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1024, system, messages }),
      });
      aj = await ar.json();
      if (!ar.ok) return json({ ok: false, error: "anthropic-error", detail: aj }, 502);
    } catch (e) {
      return json({ ok: false, error: "anthropic-fetch-failed" }, 502);
    }
    const reply = (aj.content && aj.content[0] && aj.content[0].text) || "(no reply)";
    return json({ ok: true, reply });
  }

  // List pending answers (the daily loop reads + clears these).
  if (url.pathname === "/api/answers" && request.method === "GET") {
    const list = await env.STATE.list({ prefix: "ans:" });
    const answers = [];
    for (const k of list.keys) {
      const v = await env.STATE.get(k.name);
      if (v) answers.push({ key: k.name, ...JSON.parse(v) });
    }
    return json({ ok: true, count: answers.length, answers });
  }

  // Clear one or all answers (used by the loop after ingesting).
  if (url.pathname === "/api/clear" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    if (body.key) { await env.STATE.delete(body.key); return json({ ok: true, cleared: body.key }); }
    const list = await env.STATE.list({ prefix: "ans:" });
    for (const k of list.keys) await env.STATE.delete(k.name);
    return json({ ok: true, clearedAll: list.keys.length });
  }

  return json({ ok: false, error: "not-found" }, 404);
}
