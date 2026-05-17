import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Plan = "free" | "plus";

export function usePlan(userId: string | undefined) {
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !supabase) { setLoading(false); return; }
    let active = true;
    supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }: { data: { plan: string } | null }) => {
        if (active) {
          setPlan((data?.plan as Plan) ?? "free");
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, [userId]);

  return { plan, isPlus: plan === "plus", loading };
}

export function useIsAdmin(email: string | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email || !supabase) { setLoading(false); return; }
    let active = true;
    supabase
      .from("admins")
      .select("email")
      .eq("email", email)
      .maybeSingle()
      .then(({ data }: { data: { email: string } | null }) => {
        if (active) {
          setIsAdmin(!!data);
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, [email]);

  return { isAdmin, loading };
}