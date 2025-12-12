import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://nerdworktecnologia.github.io";
const DEV_ORIGINS = ["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:8081"];
const origins = [ALLOWED_ORIGIN, ...DEV_ORIGINS].filter(Boolean);

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let pool: Pool | null = null;
let dbReady = false;
const supa = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

async function init() {
  if (dbReady) return;
  if (!DATABASE_URL) {
    dbReady = true;
    return;
  }
  pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await pool.query("CREATE TABLE IF NOT EXISTS arrivals (id TEXT PRIMARY KEY, arrived BOOLEAN NOT NULL DEFAULT false)");
  await pool.query("CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value JSONB NOT NULL)");
  dbReady = true;
}

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = String(req.headers.origin || "");
  const allowed = origins.includes(origin) ? origin : ALLOWED_ORIGIN;
  res.setHeader("Access-Control-Allow-Origin", allowed);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,OPTIONS");
}

type MaybeBody = { body?: unknown };
async function readBody(req: VercelRequest): Promise<Record<string, unknown>> {
  const r = req as VercelRequest & MaybeBody;
  if (typeof r.body !== "undefined") return (r.body || {}) as Record<string, unknown>;
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => { data += String(chunk || ""); });
    req.on("end", () => {
      try { resolve(JSON.parse(data || "{}")); } catch { resolve({}); }
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).send("");

  const q = req.query as { path?: string | string[] };
  const segs = Array.isArray(q.path) ? (q.path as string[]) : (q.path ? [String(q.path)] : []);
  const path = "/" + segs.join("/");

  if (path === "/health" && req.method === "GET") {
    await init();
    return res.json({ ok: true, db: !!DATABASE_URL });
  }

  if (path === "/arrivals" && req.method === "GET") {
    await init();
    try {
      if (pool) {
        const r = await pool.query("SELECT id, arrived FROM arrivals");
        const out: Record<string, boolean> = {};
        for (const row of r.rows) out[row.id] = !!row.arrived;
        return res.json(out);
      }
      if (supa) {
        const { data, error } = await supa.from("arrivals").select("id, arrived");
        if (error) throw error;
        const out: Record<string, boolean> = {};
        for (const row of data || []) out[row.id] = !!row.arrived;
        return res.json(out);
      }
      return res.json({});
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(500).json({ error: "failed", message: msg });
    }
  }

  if (segs[0] === "guests" && segs[2] === "arrived" && req.method === "PUT") {
    const id = segs[1];
    const body = (await readBody(req)) as { arrived?: boolean };
    const arrived = body.arrived;
    if (typeof arrived !== "boolean") return res.status(400).json({ error: "invalid" });
    await init();
    try {
      if (pool) {
        await pool.query(
          "INSERT INTO arrivals (id, arrived) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET arrived = EXCLUDED.arrived",
          [id, arrived]
        );
        return res.json({ ok: true });
      }
      if (supa) {
        const { error } = await supa.from("arrivals").upsert({ id, arrived }, { onConflict: "id" });
        if (error) throw error;
        return res.json({ ok: true });
      }
      return res.status(500).json({ error: "datastore_not_configured" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(500).json({ error: "failed", message: msg });
    }
  }

  if (segs[0] === "store" && segs[1] && req.method === "GET") {
    const key = segs[1];
    await init();
    try {
      if (pool) {
        const r = await pool.query("SELECT value FROM store WHERE key = $1", [key]);
        if (r.rows.length === 0) return res.status(404).json({ error: "not_found" });
        return res.json(r.rows[0].value);
      }
      if (supa) {
        const { data, error } = await supa.from("store").select("value").eq("key", key).limit(1).maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: "not_found" });
        return res.json(data.value);
      }
      return res.status(500).json({ error: "datastore_not_configured" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(500).json({ error: "failed", message: msg });
    }
  }

  if (segs[0] === "store" && segs[1] && req.method === "PUT") {
    const key = segs[1];
    const body = (await readBody(req)) as { value?: unknown };
    const value = body.value;
    await init();
    try {
      if (pool) {
        await pool.query(
          "INSERT INTO store (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
          [key, value]
        );
        return res.json({ ok: true });
      }
      if (supa) {
        const { error } = await supa.from("store").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
        return res.json({ ok: true });
      }
      return res.status(500).json({ error: "datastore_not_configured" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(500).json({ error: "failed", message: msg });
    }
  }

  if (segs[0] === "admin" && segs[1] === "users" && req.method === "POST") {
    if (!supa) return res.status(500).json({ error: "supabase_not_configured" });
    const body = (await readBody(req)) as { email?: string; password?: string; confirm?: boolean; alias?: string };
    const email = String(body.email || "");
    const password = String(body.password || "");
    const confirm = !!body.confirm;
    const alias = body.alias ? String(body.alias) : undefined;
    if (!email || !password) return res.status(400).json({ error: "invalid" });
    try {
      const { data, error } = await supa.auth.admin.createUser({ email, password, email_confirm: confirm });
      if (error) throw error;
      if (alias) {
        await supa.from("user_aliases").upsert({ username: alias, email }, { onConflict: "username" });
      }
      return res.json({ ok: true, user_id: data?.user?.id || null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(500).json({ error: "failed", message: msg });
    }
  }

  if (segs[0] === "alias" && segs[1] && req.method === "GET") {
    if (!supa) return res.status(500).json({ error: "supabase_not_configured" });
    const username = String(segs[1] || "");
    try {
      const { data, error } = await supa
        .from("user_aliases")
        .select("email")
        .eq("username", username)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: "not_found" });
      return res.json({ email: data.email });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(500).json({ error: "failed", message: msg });
    }
  }

  return res.status(404).json({ error: "not_found" });
}

