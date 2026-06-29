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

  // Everything below requires the correct password.
  if (!authed) return json({ ok: false, error: configured ? "wrong-password" : "no-password-set" }, 401);
  if (!kv) return json({ ok: false, error: "kv-not-bound" }, 500);

  // Save a tapped answer / captured input.
  if (url.pathname === "/api/answer" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const id = "ans:" + Date.now() + ":" + Math.random().toString(36).slice(2, 7);
    await env.STATE.put(id, JSON.stringify({ ...body, ts: Date.now() }));
    return json({ ok: true, stored: id });
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
