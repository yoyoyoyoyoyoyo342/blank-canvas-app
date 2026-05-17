import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useIsAdmin } from "@/hooks/use-plan";
import { Spinner } from "@/components/ui/spinner";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";

interface ProfileRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  plan: string;
  created_at: string;
  last_active_at: string | null;
}

export default function AdminScreen({ email }: { email: string }) {
  const [, navigate] = useLocation();
  const { isAdmin, loading } = useIsAdmin(email);
  const [tab, setTab] = useState<"overview" | "users" | "connections">("overview");

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/");
  }, [loading, isAdmin, navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/");
  }

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0f0f" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-6" style={{ background: "#0f0f0f", color: "#e8dfd4", fontFamily: "Fraunces, serif", fontWeight: 200 }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <span className="text-sm">flo. admin</span>
          <button onClick={signOut} className="text-xs" style={{ color: "#8a8a8a" }}>sign out</button>
        </div>

        <nav className="flex gap-6 mb-8 text-sm">
          {(["overview", "users", "connections"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ color: tab === t ? "#e8dfd4" : "#3a3a3a" }}>
              {t}
            </button>
          ))}
        </nav>

        {tab === "overview" && <Overview />}
        {tab === "users" && <UsersTab />}
        {tab === "connections" && <ConnectionsTab />}
      </div>
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState<{ total: number; plus: number; recent: ProfileRow[]; daily: { day: string; count: number }[] }>({
    total: 0, plus: 0, recent: [], daily: [],
  });

  useEffect(() => {
    (async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name, plan, created_at, last_active_at")
        .order("created_at", { ascending: false }) as { data: ProfileRow[] | null };
      const rows = profiles ?? [];
      const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
      const daily: { day: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 3600 * 1000);
        const label = d.toLocaleDateString("en-GB", { weekday: "short" }).toLowerCase();
        const count = rows.filter((r) => {
          const t = new Date(r.created_at).getTime();
          return t >= sevenDaysAgo && new Date(r.created_at).toDateString() === d.toDateString();
        }).length;
        daily.push({ day: label, count });
      }
      setStats({
        total: rows.length,
        plus: rows.filter((r) => r.plan === "plus").length,
        recent: rows.slice(0, 10),
        daily,
      });
    })();
  }, []);

  const revenue = stats.plus * 4;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="total users" value={stats.total} />
        <Stat label="plus subscribers" value={stats.plus} />
        <Stat label="signups last 7d" value={stats.daily.reduce((a, b) => a + b.count, 0)} />
        <Stat label="monthly revenue" value={`€${revenue}`} />
      </div>

      <div className="rounded-2xl p-6" style={{ background: "#1a1a1a" }}>
        <h3 className="italic mb-4 text-sm">signups, last 7 days</h3>
        <div style={{ height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={stats.daily}>
              <XAxis dataKey="day" tick={{ fill: "#8a8a8a", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#222" }} contentStyle={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }} />
              <Bar dataKey="count" fill="#4a5e6e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl p-6" style={{ background: "#1a1a1a" }}>
        <h3 className="italic mb-4 text-sm">last 10 signups</h3>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: "#6a6a6a" }}>
              <th className="text-left pb-2">name</th>
              <th className="text-left pb-2">email</th>
              <th className="text-left pb-2">plan</th>
              <th className="text-left pb-2">joined</th>
            </tr>
          </thead>
          <tbody>
            {stats.recent.map((r) => (
              <tr key={r.user_id}>
                <td className="py-2">{r.full_name ?? "—"}</td>
                <td className="py-2" style={{ color: "#8a8a8a" }}>{r.email}</td>
                <td className="py-2">{r.plan}</td>
                <td className="py-2" style={{ color: "#8a8a8a" }}>{new Date(r.created_at).toLocaleDateString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#1a1a1a" }}>
      <p className="text-xs italic" style={{ color: "#8a8a8a" }}>{label}</p>
      <p className="text-3xl mt-2">{value}</p>
    </div>
  );
}

function UsersTab() {
  const [all, setAll] = useState<ProfileRow[]>([]);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "free" | "plus">("all");
  const pageSize = 20;

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, email, full_name, plan, created_at, last_active_at")
        .order("created_at", { ascending: false }) as { data: ProfileRow[] | null };
      setAll(data ?? []);
    })();
  }, []);

  const filtered = useMemo(() => {
    return all.filter((r) => {
      if (filter !== "all" && r.plan !== filter) return false;
      if (q && !(`${r.full_name ?? ""} ${r.email ?? ""}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [all, filter, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice(page * pageSize, page * pageSize + pageSize);

  async function setPlan(userId: string, plan: "free" | "plus") {
    await supabase.from("profiles").update({ plan, plan_expires_at: null }).eq("user_id", userId);
    setAll((prev) => prev.map((r) => (r.user_id === userId ? { ...r, plan } : r)));
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(0); }}
          placeholder="search by name or email"
          className="px-3 py-2 rounded-lg text-sm flex-1"
          style={{ background: "#1a1a1a", color: "#e8dfd4", border: "1px solid #2a2a2a" }}
        />
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value as "all" | "free" | "plus"); setPage(0); }}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: "#1a1a1a", color: "#e8dfd4", border: "1px solid #2a2a2a" }}
        >
          <option value="all">all</option>
          <option value="free">free</option>
          <option value="plus">plus</option>
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#1a1a1a" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: "#6a6a6a" }}>
              <th className="text-left p-3">name</th>
              <th className="text-left p-3">email</th>
              <th className="text-left p-3">plan</th>
              <th className="text-left p-3">joined</th>
              <th className="text-left p-3">last active</th>
              <th className="text-left p-3"></th>
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={r.user_id} style={{ borderTop: "1px solid #2a2a2a" }}>
                <td className="p-3">{r.full_name ?? "—"}</td>
                <td className="p-3" style={{ color: "#8a8a8a" }}>{r.email}</td>
                <td className="p-3">{r.plan}</td>
                <td className="p-3" style={{ color: "#8a8a8a" }}>{new Date(r.created_at).toLocaleDateString("en-GB")}</td>
                <td className="p-3" style={{ color: "#8a8a8a" }}>{r.last_active_at ? new Date(r.last_active_at).toLocaleDateString("en-GB") : "—"}</td>
                <td className="p-3">
                  {r.plan === "plus" ? (
                    <button onClick={() => setPlan(r.user_id, "free")} className="text-xs" style={{ color: "#c4906b" }}>downgrade</button>
                  ) : (
                    <button onClick={() => setPlan(r.user_id, "plus")} className="text-xs" style={{ color: "#7a9e7e" }}>grant plus</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: "#8a8a8a" }}>
        <span>page {page + 1} of {pages}</span>
        <div className="flex gap-3">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-30">prev</button>
          <button disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-30">next</button>
        </div>
      </div>
    </div>
  );
}

function ConnectionsTab() {
  const [counts, setCounts] = useState<{ google: number; apple: number; aula: number; spotify: number }>({
    google: 0, apple: 0, aula: 0, spotify: 0,
  });

  useEffect(() => {
    (async () => {
      const [profiles, caldav, aula, spotify] = await Promise.all([
        supabase.from("profiles").select("user_id", { count: "exact", head: true }),
        supabase.from("caldav_connections").select("user_id", { count: "exact", head: true }),
        supabase.from("aula_connections").select("user_id", { count: "exact", head: true }),
        supabase.from("spotify_connections").select("user_id", { count: "exact", head: true }),
      ]);
      setCounts({
        google: profiles.count ?? 0,
        apple: caldav.count ?? 0,
        aula: aula.count ?? 0,
        spotify: spotify.count ?? 0,
      });
    })();
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Stat label="google connected" value={counts.google} />
      <Stat label="apple connected" value={counts.apple} />
      <Stat label="aula connected" value={counts.aula} />
      <Stat label="spotify connected" value={counts.spotify} />
    </div>
  );
}