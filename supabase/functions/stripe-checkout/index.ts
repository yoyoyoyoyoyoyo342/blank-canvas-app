import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "missing auth" }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: userData } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    const user = userData.user;
    if (!user?.email) return json({ error: "unauthorized" }, 401);
    const { plan } = (await req.json()) as { plan: "monthly" | "yearly" };
    if (plan !== "monthly" && plan !== "yearly") return json({ error: "invalid plan" }, 400);
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id ?? (await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } })).id;
    const price = plan === "monthly"
      ? { currency: "eur", product_data: { name: "flo. plus monthly" }, unit_amount: 400, recurring: { interval: "month" as const } }
      : { currency: "eur", product_data: { name: "flo. plus yearly" }, unit_amount: 3600, recurring: { interval: "year" as const } };
    const origin = req.headers.get("origin") ?? "https://flo.localilabs.com";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price_data: price, quantity: 1 }],
      success_url: `${origin}/?upgraded=1`,
      cancel_url: `${origin}/plus?canceled=1`,
      metadata: { user_id: user.id, plan },
      subscription_data: { metadata: { user_id: user.id, plan } },
    });
    return json({ url: session.url });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}