import { useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { FloFace } from "@/components/FloFace";

const FEATURES = [
  "apple calendar + reminders",
  "aula for multiple children",
  "spotify daily soundtrack",
  "real-time nudges throughout the day",
  "multiple child profiles",
  "deeper ai memory",
  "custom mcps (coming soon)",
];

export default function PlusScreen({ accessToken }: { accessToken: string }) {
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: "monthly" | "yearly") {
    setLoading(plan);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: { plan },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (error) throw error;
      const url = (data as { url?: string })?.url;
      if (!url) throw new Error("no checkout url returned");
      window.location.href = url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "checkout failed");
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen px-6 py-12" style={{ background: "#0f0f0f", color: "#e8dfd4" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-xs" style={{ color: "#8a8a8a", fontFamily: "Fraunces, serif", fontWeight: 200 }}>
          ← back
        </Link>

        <div className="flex flex-col items-center gap-4 mt-10 mb-12">
          <FloFace size={60} float />
          <h1 className="text-5xl text-center" style={{ fontFamily: "Fraunces, serif", fontWeight: 200 }}>
            flo. plus
          </h1>
          <p className="text-center" style={{ color: "#8a8a8a", fontFamily: "Fraunces, serif", fontWeight: 200 }}>
            everything flo. can do, fully unlocked.
          </p>
        </div>

        <ul className="space-y-3 mb-12 max-w-md mx-auto">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-3" style={{ fontFamily: "Fraunces, serif", fontWeight: 200 }}>
              <span style={{ color: "#4a5e6e" }}>·</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <PriceCard
            title="monthly"
            price="€4"
            unit="/month"
            onClick={() => startCheckout("monthly")}
            loading={loading === "monthly"}
          />
          <PriceCard
            title="yearly"
            price="€36"
            unit="/year"
            note="€3/month"
            badge="save 25%"
            onClick={() => startCheckout("yearly")}
            loading={loading === "yearly"}
          />
        </div>

        {error && (
          <p className="text-center mt-6 text-sm" style={{ color: "#c4906b" }}>{error}</p>
        )}
      </div>
    </div>
  );
}

function PriceCard({ title, price, unit, note, badge, onClick, loading }: {
  title: string; price: string; unit: string; note?: string; badge?: string;
  onClick: () => void; loading: boolean;
}) {
  return (
    <div className="relative p-6 rounded-2xl flex flex-col gap-4" style={{ background: "#1a1a1a", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
      {badge && (
        <span
          className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full"
          style={{ background: "#4a5e6e", color: "#e8dfd4", fontFamily: "Fraunces, serif", fontWeight: 200 }}
        >
          {badge}
        </span>
      )}
      <h3 className="lowercase" style={{ fontFamily: "Fraunces, serif", fontWeight: 200, color: "#8a8a8a" }}>{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 200 }}>{price}</span>
        <span style={{ color: "#8a8a8a", fontFamily: "Fraunces, serif", fontWeight: 200 }}>{unit}</span>
      </div>
      {note && <p className="text-xs" style={{ color: "#6a6a6a" }}>{note}</p>}
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="mt-2 py-2 rounded-full text-sm disabled:opacity-50"
        style={{ background: "#e8dfd4", color: "#0f0f0f", fontFamily: "Fraunces, serif", fontWeight: 200 }}
      >
        {loading ? "loading..." : "get flo. plus"}
      </button>
    </div>
  );
}