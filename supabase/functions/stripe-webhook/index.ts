import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET")!);
  } catch (e) {
    return new Response(`invalid signature: ${e instanceof Error ? e.message : "err"}`, { status: 400 });
  }
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const setPlan = async (userId: string, plan: "free" | "plus", expires: string | null, customerId?: string) => {
    await admin.from("profiles").update({ plan, plan_expires_at: expires, ...(customerId ? { stripe_customer_id: customerId } : {}) }).eq("user_id", userId);
  };
  const userIdForCustomer = async (customerId: string): Promise<string | null> => {
    const { data } = await admin.from("profiles").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
    return data?.user_id ?? null;
  };
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.metadata?.user_id;
      if (userId && s.customer) await setPlan(userId, "plus", null, String(s.customer));
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id ?? await userIdForCustomer(String(sub.customer));
      if (!userId) break;
      const active = sub.status === "active" || sub.status === "trialing";
      const expires = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
      await setPlan(userId, active ? "plus" : "free", active ? expires : null, String(sub.customer));
      break;
    }
    case "customer.subscription.deleted":
    case "invoice.payment_failed": {
      const obj = event.data.object as { customer?: string; metadata?: { user_id?: string } };
      const userId = obj.metadata?.user_id ?? (obj.customer ? await userIdForCustomer(String(obj.customer)) : null);
      if (userId) await setPlan(userId, "free", null);
      break;
    }
  }
  return new Response("ok", { status: 200 });
});