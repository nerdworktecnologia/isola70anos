import express from "express";
import cors from "cors";
import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://nerdworktecnologia.github.io";
const DEV_ORIGINS = ["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:8081"];
const origins = [ALLOWED_ORIGIN, ...DEV_ORIGINS].filter(Boolean);
app.use(cors({ origin: origins }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let dbReady = false;
let pool = null;
let memory = new Map();
let memoryStore = new Map();
let supa = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function init() {
  if (!DATABASE_URL) {
    dbReady = true;
    return;
  }
  pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await pool.query(
    "CREATE TABLE IF NOT EXISTS arrivals (id TEXT PRIMARY KEY, arrived BOOLEAN NOT NULL DEFAULT false)"
  );
  await pool.query(
    "CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value JSONB NOT NULL)"
  );
  dbReady = true;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, db: !!DATABASE_URL });
});

app.get("/api/arrivals", async (_req, res) => {
  if (!dbReady) await init();
  try {
    if (pool) {
      const r = await pool.query("SELECT id, arrived FROM arrivals");
      const out = {};
      for (const row of r.rows) out[row.id] = !!row.arrived;
      return res.json(out);
    }
    if (supa) {
      const { data, error } = await supa.from("arrivals").select("id, arrived");
      if (error) throw error;
      const out = {};
      for (const row of data || []) out[row.id] = !!row.arrived;
      return res.json(out);
    }
    const out = {};
    for (const [id, arrived] of memory.entries()) out[id] = !!arrived;
    return res.json(out);
  } catch (e) {
    return res.status(500).json({ error: "failed", message: String(e?.message || e) });
  }
});

app.put("/api/guests/:id/arrived", async (req, res) => {
  const { id } = req.params;
  const { arrived } = req.body || {};
  if (typeof arrived !== "boolean") return res.status(400).json({ error: "invalid" });
  if (!dbReady) await init();
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
    memory.set(id, arrived);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "failed", message: String(e?.message || e) });
  }
});

app.get("/api/store/:key", async (req, res) => {
  const { key } = req.params;
  if (!dbReady) await init();
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
    if (!memoryStore.has(key)) return res.status(404).json({ error: "not_found" });
    return res.json(memoryStore.get(key));
  } catch (e) {
    return res.status(500).json({ error: "failed", message: String(e?.message || e) });
  }
});

app.put("/api/store/:key", async (req, res) => {
  const { key } = req.params;
  const { value } = req.body || {};
  if (!dbReady) await init();
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
    memoryStore.set(key, value);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "failed", message: String(e?.message || e) });
  }
});

app.post("/api/admin/users", async (req, res) => {
  if (!supa) return res.status(500).json({ error: "supabase_not_configured" });
  const { email, password, confirm, alias } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "invalid" });
  try {
    const { data, error } = await supa.auth.admin.createUser({
      email,
      password,
      email_confirm: !!confirm,
    });
    if (error) throw error;
    if (alias) {
      await supa.from("user_aliases").upsert({ username: alias, email }, { onConflict: "username" });
    }
    return res.json({ ok: true, user_id: data?.user?.id || null });
  } catch (e) {
    return res.status(500).json({ error: "failed", message: String(e?.message || e) });
  }
});

app.get("/api/alias/:username", async (req, res) => {
  if (!supa) return res.status(500).json({ error: "supabase_not_configured" });
  const { username } = req.params;
  try {
    const { data, error } = await supa
      .from("user_aliases")
      .select("email")
      .eq("username", String(username || ""))
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "not_found" });
    return res.json({ email: data.email });
  } catch (e) {
    return res.status(500).json({ error: "failed", message: String(e?.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

