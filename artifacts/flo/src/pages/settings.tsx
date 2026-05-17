import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSettings,
  useUpdateSettings,
  useGetSchedules,
  useCreateScheduleEntry,
  useRemoveScheduleEntry,
  useConnectCalDav,
  useConnectAula,
  getGetSettingsQueryKey,
  getGetSchedulesQueryKey,
} from "@workspace/api-client-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import BottomNav from "@/components/bottom-nav";
import Footer from "@/components/footer";
import { AppPasswordGuide } from "@/components/AppPasswordGuide";

interface SettingsScreenProps {
  accessToken: string;
  firstName: string;
  email: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SettingsScreen({ accessToken, firstName, email }: SettingsScreenProps) {
  const queryClient = useQueryClient();
  const [scheduleTab, setScheduleTab] = useState<"school" | "upload" | "manual">("manual");
  const [cityInput, setCityInput] = useState("");
  const [cityStatus, setCityStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [caldavEmail, setCaldavEmail] = useState("");
  const [caldavPassword, setCaldavPassword] = useState("");
  const [caldavStatus, setCaldavStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [aulaUsername, setAulaUsername] = useState("");
  const [aulaPassword, setAulaPassword] = useState("");
  const [aulaStatus, setAulaStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [newEntry, setNewEntry] = useState({ day_of_week: "Monday", start_time: "", end_time: "", subject: "", room: "" });
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");

  const { data: settings } = useGetSettings(
    { access_token: accessToken },
    { query: { queryKey: getGetSettingsQueryKey({ access_token: accessToken }) } }
  );

  const { data: schedules } = useGetSchedules(
    { access_token: accessToken },
    { query: { queryKey: getGetSchedulesQueryKey({ access_token: accessToken }) } }
  );

  const updateSettings = useUpdateSettings();
  const createEntry = useCreateScheduleEntry();
  const removeEntry = useRemoveScheduleEntry();
  const connectCalDav = useConnectCalDav();
  const connectAula = useConnectAula();

  const saveCity = async () => {
    if (!cityInput.trim()) return;
    setCityStatus("saving");
    await updateSettings.mutateAsync({
      params: { access_token: accessToken },
      data: { city_override: cityInput.trim() },
    });
    queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey({ access_token: accessToken }) });
    setCityStatus("saved");
    setTimeout(() => setCityStatus("idle"), 2000);
  };

  const clearCity = async () => {
    await updateSettings.mutateAsync({ params: { access_token: accessToken }, data: { city_override: null } });
    queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey({ access_token: accessToken }) });
    setCityInput("");
  };

  const handleCalDavConnect = async () => {
    if (!caldavEmail || !caldavPassword) return;
    setCaldavStatus("saving");
    try {
      await connectCalDav.mutateAsync({
        params: { access_token: accessToken },
        data: { icloud_email: caldavEmail, app_password: caldavPassword },
      });
      setCaldavStatus("saved");
      queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey({ access_token: accessToken }) });
    } catch {
      setCaldavStatus("error");
    }
    setTimeout(() => setCaldavStatus("idle"), 3000);
  };

  const handleAulaConnect = async () => {
    if (!aulaUsername || !aulaPassword) return;
    setAulaStatus("saving");
    try {
      await connectAula.mutateAsync({
        params: { access_token: accessToken },
        data: { username: aulaUsername, password: aulaPassword },
      });
      setAulaStatus("saved");
      queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey({ access_token: accessToken }) });
    } catch {
      setAulaStatus("error");
    }
    setTimeout(() => setAulaStatus("idle"), 3000);
  };

  const handleDisconnect = async (provider: string) => {
    await fetch(`/api/settings/connections/${provider}?access_token=${encodeURIComponent(accessToken)}`, {
      method: "DELETE",
    });
    queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey({ access_token: accessToken }) });
  };

  const handleSpotifyConnect = async () => {
    const resp = await fetch(`/api/spotify/secure-connect-url?access_token=${encodeURIComponent(accessToken)}`);
    if (!resp.ok) return;
    const { url } = await resp.json() as { url: string };
    window.location.href = url;
  };

  const handleAddEntry = async () => {
    if (!newEntry.start_time || !newEntry.end_time || !newEntry.subject) return;
    await createEntry.mutateAsync({
      params: { access_token: accessToken },
      data: {
        day_of_week: newEntry.day_of_week,
        start_time: newEntry.start_time,
        end_time: newEntry.end_time,
        subject: newEntry.subject,
        room: newEntry.room || null,
      },
    });
    setNewEntry({ day_of_week: "Monday", start_time: "", end_time: "", subject: "", room: "" });
    queryClient.invalidateQueries({ queryKey: getGetSchedulesQueryKey({ access_token: accessToken }) });
  };

  const handleDeleteEntry = async (id: string) => {
    await removeEntry.mutateAsync({ params: { access_token: accessToken, id } });
    queryClient.invalidateQueries({ queryKey: getGetSchedulesQueryKey({ access_token: accessToken }) });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus("uploading");
    const form = new FormData();
    form.append("file", file);
    try {
      const resp = await fetch(`/api/schedules/import?access_token=${encodeURIComponent(accessToken)}`, {
        method: "POST",
        body: form,
      });
      if (!resp.ok) throw new Error();
      setUploadStatus("done");
      queryClient.invalidateQueries({ queryKey: getGetSchedulesQueryKey({ access_token: accessToken }) });
    } catch {
      setUploadStatus("error");
    }
    setTimeout(() => setUploadStatus("idle"), 3000);
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
  };

  const inputClass = "w-full bg-transparent border-b border-border/30 focus:border-accent/50 outline-none text-sm text-foreground placeholder:text-muted-foreground/40 py-2 transition-colors";
  const labelClass = "text-xs text-muted-foreground tracking-widest uppercase mb-1 block";
  const sectionClass = "space-y-4 pb-10 border-b border-border/10 last:border-0";

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-32">
      <div className="max-w-2xl mx-auto px-6 pt-12 space-y-12">
        <div>
          <h1 className="text-4xl font-light italic tracking-tight text-primary">settings.</h1>
        </div>

        {/* Connected Accounts */}
        <section className={sectionClass}>
          <h2 className="text-xs text-muted-foreground tracking-widest uppercase">connected accounts</h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Google</p>
                <p className="text-xs text-muted-foreground">calendar · gmail</p>
              </div>
              <span className="text-xs text-accent tracking-wide">connected</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Apple Calendar</p>
                  <p className="text-xs text-muted-foreground">caldav · reminders</p>
                </div>
                {settings?.caldav_connected ? (
                  <button onClick={() => handleDisconnect("caldav")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    disconnect
                  </button>
                ) : null}
              </div>
              {!settings?.caldav_connected && (
                <div className="space-y-2 pl-0">
                  <input placeholder="iCloud email" value={caldavEmail} onChange={(e) => setCaldavEmail(e.target.value)} className={inputClass} />
                  <input placeholder="app-specific password" type="password" value={caldavPassword} onChange={(e) => setCaldavPassword(e.target.value)} className={inputClass} />
                  <AppPasswordGuide />
                  <button
                    onClick={handleCalDavConnect}
                    disabled={caldavStatus === "saving"}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide disabled:opacity-50"
                  >
                    {caldavStatus === "saving" ? "connecting..." : caldavStatus === "saved" ? "connected." : caldavStatus === "error" ? "failed. try again." : "connect apple calendar →"}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Aula</p>
                  <p className="text-xs text-muted-foreground">school messages · schedule</p>
                </div>
                {settings?.aula_connected ? (
                  <button onClick={() => handleDisconnect("aula")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    disconnect
                  </button>
                ) : null}
              </div>
              {!settings?.aula_connected && (
                <div className="space-y-2">
                  <input placeholder="UNI-login username" value={aulaUsername} onChange={(e) => setAulaUsername(e.target.value)} className={inputClass} />
                  <input placeholder="password" type="password" value={aulaPassword} onChange={(e) => setAulaPassword(e.target.value)} className={inputClass} />
                  <button
                    onClick={handleAulaConnect}
                    disabled={aulaStatus === "saving"}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide disabled:opacity-50"
                  >
                    {aulaStatus === "saving" ? "connecting..." : aulaStatus === "saved" ? "connected." : aulaStatus === "error" ? "failed. try again." : "connect aula →"}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Spotify</p>
                <p className="text-xs text-muted-foreground">soundtrack for your day</p>
              </div>
              {settings?.spotify_connected ? (
                <button onClick={() => handleDisconnect("spotify")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  disconnect
                </button>
              ) : (
                <button onClick={handleSpotifyConnect} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  connect →
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className={sectionClass}>
          <h2 className="text-xs text-muted-foreground tracking-widest uppercase">schedule</h2>

          <div className="flex gap-4 border-b border-border/10 pb-4">
            {(["school", "upload", "manual"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setScheduleTab(tab)}
                className={`text-xs tracking-wide transition-colors ${scheduleTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"}`}
              >
                {tab === "school" ? "from school app" : tab === "upload" ? "upload file" : "manual entry"}
              </button>
            ))}
          </div>

          {scheduleTab === "school" && (
            <div className="space-y-3">
              {settings?.aula_connected ? (
                <p className="text-sm text-muted-foreground">your Aula schedule is pulled automatically on the briefing screen.</p>
              ) : (
                <p className="text-sm text-muted-foreground">connect Aula above to pull your schedule automatically.</p>
              )}
            </div>
          )}

          {scheduleTab === "upload" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">upload a PDF or CSV of your timetable. flo. will extract the schedule automatically.</p>
              <label className="block">
                <span className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide cursor-pointer">
                  {uploadStatus === "uploading" ? "processing..." : uploadStatus === "done" ? "imported." : uploadStatus === "error" ? "failed. try again." : "choose file →"}
                </span>
                <input type="file" accept=".pdf,.csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}

          {scheduleTab === "manual" && (
            <div className="space-y-6">
              {(schedules ?? []).length > 0 && (
                <ul className="space-y-3">
                  {(schedules ?? []).map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground w-24 text-xs">{entry.day_of_week.slice(0, 3).toLowerCase()}</span>
                      <span className="text-muted-foreground text-xs w-24">{entry.start_time}–{entry.end_time}</span>
                      <span className="flex-1 text-foreground">{entry.subject}</span>
                      {entry.room && <span className="text-muted-foreground text-xs mr-4">{entry.room}</span>}
                      <button onClick={() => handleDeleteEntry(entry.id)} className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors">✕</button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="space-y-3">
                <label className={labelClass}>add class</label>
                <select value={newEntry.day_of_week} onChange={(e) => setNewEntry((p) => ({ ...p, day_of_week: e.target.value }))} className={inputClass + " bg-background"}>
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <div className="flex gap-3">
                  <input type="time" placeholder="start" value={newEntry.start_time} onChange={(e) => setNewEntry((p) => ({ ...p, start_time: e.target.value }))} className={inputClass} />
                  <input type="time" placeholder="end" value={newEntry.end_time} onChange={(e) => setNewEntry((p) => ({ ...p, end_time: e.target.value }))} className={inputClass} />
                </div>
                <input placeholder="subject" value={newEntry.subject} onChange={(e) => setNewEntry((p) => ({ ...p, subject: e.target.value }))} className={inputClass} />
                <input placeholder="room (optional)" value={newEntry.room} onChange={(e) => setNewEntry((p) => ({ ...p, room: e.target.value }))} className={inputClass} />
                <button onClick={handleAddEntry} className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide">
                  add class →
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Location */}
        <section className={sectionClass}>
          <h2 className="text-xs text-muted-foreground tracking-widest uppercase">location</h2>
          <p className="text-sm text-muted-foreground">
            {settings?.city_override
              ? <>weather set to <span className="text-foreground">{settings.city_override}</span>. <button onClick={clearCity} className="underline hover:text-foreground transition-colors">use device location</button></>
              : "using device GPS. set a city override below."}
          </p>
          <div className="flex gap-3 items-end">
            <input
              placeholder="e.g. Copenhagen"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveCity()}
              className={inputClass + " flex-1"}
            />
            <button onClick={saveCity} disabled={cityStatus === "saving"} className="text-xs text-muted-foreground hover:text-foreground transition-colors pb-2">
              {cityStatus === "saving" ? "saving..." : cityStatus === "saved" ? "saved." : "save"}
            </button>
          </div>
        </section>

        {/* Account */}
        <section className={sectionClass}>
          <h2 className="text-xs text-muted-foreground tracking-widest uppercase">account</h2>
          <div className="space-y-2">
            <p className="text-sm text-foreground">{firstName}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          <button onClick={handleSignOut} className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide">
            sign out →
          </button>
        </section>

        <Footer />
      </div>

      <BottomNav accessToken={accessToken} />
    </div>
  );
}
