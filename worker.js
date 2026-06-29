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
