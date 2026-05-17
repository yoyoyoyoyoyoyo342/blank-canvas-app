import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Plan = "free" | "plus";

export function usePlan(userId: string | undefined) {
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !supabase) { setLoading(false); return; }
    let active = true;
    const timeout = setTimeout(() => {
      if (active) setLoading(false);
    }, 3000);
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("plan")
          .eq("user_id", userId)
          .maybeSingle() as { data: { plan: string } | null };
        if (active) setPlan((data?.plan as Plan) ?? "free");
      } finally {
        clearTimeout(timeout);
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; clearTimeout(timeout); };
  }, [userId]);

  return { plan, isPlus: plan === "plus", loading };
}

export function useIsAdmin(email: string | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email || !supabase) { setLoading(false); return; }
    let active = true;
    const timeout = setTimeout(() => {
      if (active) setLoading(false);
    }, 3000);
    (async () => {
      try {
        const { data } = await supabase
          .from("admins")
          .select("email")
          .eq("email", email)
          .maybeSingle() as { data: { email: string } | null };
        if (active) setIsAdmin(!!data);
      } finally {
        clearTimeout(timeout);
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; clearTimeout(timeout); };
  }, [email]);

  return { isAdmin, loading };
}