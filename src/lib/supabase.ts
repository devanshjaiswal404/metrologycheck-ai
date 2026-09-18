import { createClient } from "@supabase/supabase-js";

// Manually configured external Supabase project.
const SUPABASE_URL = "https://yujrpdubbpoblpltnjob.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1anJwZHViYnBvYmxwbHRuam9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTMwNzksImV4cCI6MjEwNTI4OTA3OX0.L5cUshhZPYQwyosmoBb2pJx9GyGFbtvvKldiiU4MLGE";

export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
