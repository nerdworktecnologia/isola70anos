const base = import.meta.env.VITE_API_URL || "";
import { supabase } from "./supabase";

const url = (path: string) => (base ? `${base}${path}` : path);

function readLocalArrivals(): Record<string, boolean> {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem("isola.arrivals") : null;
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? (data as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeLocalArrivals(map: Record<string, boolean>): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("isola.arrivals", JSON.stringify(map));
    }
  } catch { /* noop */ }
}

export async function getArrivals(): Promise<Record<string, boolean>> {
  try {
    if (supabase) {
      const { data, error } = await supabase.from("arrivals").select("id, arrived");
      if (error) throw error;
      const out: Record<string, boolean> = {};
      for (const row of data || []) out[row.id] = !!row.arrived;
      if (Object.keys(out).length) writeLocalArrivals(out);
      return out;
    }
  } catch { /* noop */ }
  try {
    const res = await fetch(url("/api/arrivals"));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const out = (await res.json()) as Record<string, boolean>;
    if (out && Object.keys(out).length) writeLocalArrivals(out);
    return out;
  } catch {
    return readLocalArrivals();
  }
}

export async function setArrived(id: string, arrived: boolean): Promise<void> {
  let ok = false;
  try {
    if (supabase) {
      const { error } = await supabase.from("arrivals").upsert({ id, arrived }, { onConflict: "id" });
      if (error) throw error;
      ok = true;
    } else {
      const res = await fetch(url(`/api/guests/${id}/arrived`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arrived }),
      });
      ok = res.ok;
    }
  } catch { /* noop */ }
  const current = readLocalArrivals();
  current[id] = arrived;
  writeLocalArrivals(current);
}

export async function getStore<T>(key: string): Promise<T | null> {
  try {
    if (supabase) {
      const { data, error } = await supabase.from("store").select("value").eq("key", key).limit(1).maybeSingle();
      if (error) return null;
      return (data?.value as T) ?? null;
    }
    const res = await fetch(url(`/api/store/${encodeURIComponent(key)}`));
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function setStore<T>(key: string, value: T): Promise<boolean> {
  try {
    if (supabase) {
      const { error } = await supabase.from("store").upsert({ key, value }, { onConflict: "key" });
      if (error) return false;
      return true;
    }
    const res = await fetch(url(`/api/store/${encodeURIComponent(key)}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function adminCreateUser(email: string, password: string, alias?: string, confirm: boolean = true): Promise<{ ok: boolean; message?: string }> {
  try {
    if (base) {
      const res = await fetch(url("/api/admin/users"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, alias, confirm }),
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, message: data?.message };
    }
    if (supabase) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return { ok: false, message: error.message };
      const username = String(alias || email.split("@")[0] || "");
      if (username) {
        try {
          await supabase.from("user_aliases").upsert({ username, email }, { onConflict: "username" });
        } catch { /* noop */ }
      }
      return { ok: true, message: confirm ? "Usuário criado. Verifique o e-mail." : "Usuário criado." };
    }
    const res = await fetch(url("/api/admin/users"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, alias, confirm }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, message: data?.message };
  } catch {
    return { ok: false };
  }
}

export async function resolveAlias(username: string): Promise<string | null> {
  try {
    const res = await fetch(url(`/api/alias/${encodeURIComponent(username)}`));
    if (!res.ok) return null;
    const data = await res.json();
    return String(data?.email || "") || null;
  } catch {
    return null;
  }
}
