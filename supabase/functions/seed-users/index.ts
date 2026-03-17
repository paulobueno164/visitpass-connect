import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: any[] = [];

  // Create admin user
  const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
    email: "admin@portal.com",
    password: "admin123456",
    email_confirm: true,
    user_metadata: { full_name: "Administrador do Sistema" },
  });
  results.push({ user: "admin@portal.com", error: adminError?.message || null, id: adminData?.user?.id });

  if (adminData?.user) {
    // Assign admin role (trigger already created 'citizen' role, add 'admin' and 'analyst')
    await supabase.from("user_roles").insert([
      { user_id: adminData.user.id, role: "admin" },
      { user_id: adminData.user.id, role: "analyst" },
    ]);

    // Get first municipality and assign
    const { data: munis } = await supabase.from("municipalities").select("id").limit(5);
    if (munis && munis.length > 0) {
      const assignments = munis.map((m) => ({ user_id: adminData.user!.id, municipality_id: m.id }));
      await supabase.from("analyst_municipalities").insert(assignments);
    }
  }

  // Create citizen user
  const { data: citizenData, error: citizenError } = await supabase.auth.admin.createUser({
    email: "cidadao@portal.com",
    password: "cidadao123456",
    email_confirm: true,
    user_metadata: { full_name: "Maria da Silva" },
  });
  results.push({ user: "cidadao@portal.com", error: citizenError?.message || null, id: citizenData?.user?.id });

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
