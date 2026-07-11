import { createServerFn } from "@tanstack/react-start";

const ADMIN_EMAIL = "admin@plx.com";
const ADMIN_PASSWORD = "xlp102030";

export const ensureAdminUser = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Check if user already exists
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;

  const existing = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);
  if (existing) return { ok: true as const, created: false };

  const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });
  if (createErr) throw createErr;

  return { ok: true as const, created: true };
});