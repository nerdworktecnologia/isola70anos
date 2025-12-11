import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL
  || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
  || (typeof localStorage !== "undefined" ? localStorage.getItem("supabase.url") || "" : "");
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  || (typeof localStorage !== "undefined" ? localStorage.getItem("supabase.key") || "" : "");

export const supabase = url && key ? createClient(url, key) : null;
