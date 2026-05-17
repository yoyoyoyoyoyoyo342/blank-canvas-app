import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { FloFace } from "./FloFace";

export function Onboarding({ userId, firstName }: { userId: string; firstName: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId || !supabase) return;
    let active = true;
    supabase
      .from("user_settings")
      .select("onboarding_complete")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }: { data: { onboarding_complete: boolean } | null }) => {
        if (active && !data?.onboarding_complete) setOpen(true);
      });
    return () => { active = false; };
  }, [userId]);

  async function dismiss() {
    setOpen(false);
    if (!supabase) return;
    await supabase.from("user_settings").upsert(
      { user_id: userId, onboarding_complete: true, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent
        className="max-w-md p-10 border-0 flex flex-col items-center gap-5 text-center"
        style={{ background: "#0f0f0f", color: "#e8dfd4", fontFamily: "Fraunces, serif", fontWeight: 200 }}
      >
        <FloFace size={80} float />
        <p className="text-base leading-relaxed">
          hi {(firstName ?? "").toLowerCase()}. i'm flo. i'll help you start every day without the noise. connect your accounts in settings to get started.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="px-6 py-2 rounded-full text-sm mt-2"
          style={{ background: "#e8dfd4", color: "#0f0f0f", fontFamily: "Fraunces, serif", fontWeight: 200 }}
        >
          let's go
        </button>
      </DialogContent>
    </Dialog>
  );
}