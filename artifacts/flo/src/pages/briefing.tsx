import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  useGetTodayBriefing,
  useGetWeather,
  useGetTodayEvents,
  useGetGmailSummaries,
  useGetCalDavEvents,
  useGetCalDavReminders,
  useGetAulaData,
  useGetSchedules,
  useGetSpotifyRecommendation,
  useGetSettings,
  useGeocodeCity,
  getGetWeatherQueryKey,
  getGetTodayBriefingQueryKey,
  getGetTodayEventsQueryKey,
  getGetGmailSummariesQueryKey,
  getGetCalDavEventsQueryKey,
  getGetCalDavRemindersQueryKey,
  getGetAulaDataQueryKey,
  getGetSchedulesQueryKey,
  getGetSpotifyRecommendationQueryKey,
  getGetSettingsQueryKey,
  getGeocodeCityQueryKey,
} from "@workspace/api-client-react";
import BottomNav from "@/components/bottom-nav";
import Footer from "@/components/footer";
import { FloFace } from "@/components/FloFace";
import { useWeather } from "@/hooks/use-weather";

interface BriefingScreenProps {
  firstName: string;
  accessToken: string;
}

const todayName = format(new Date(), "EEEE");

export default function BriefingScreen({ firstName, accessToken }: BriefingScreenProps) {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const { weather: liveWeather } = useWeather();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setCoords({ lat: 55.68, lon: 12.57 })
      );
    } else {
      setCoords({ lat: 55.68, lon: 12.57 });
    }
  }, []);

  const { data: settings } = useGetSettings(
    { access_token: accessToken },
    { query: { enabled: !!accessToken, queryKey: getGetSettingsQueryKey({ access_token: accessToken }) } }
  );

  const cityOverride = settings?.city_override ?? null;

  const { data: geocoded } = useGeocodeCity(
    { city: cityOverride ?? "" },
    { query: { enabled: !!cityOverride, queryKey: getGeocodeCityQueryKey({ city: cityOverride ?? "" }) } }
  );

  const weatherCoords = cityOverride && geocoded
    ? { lat: geocoded.lat, lon: geocoded.lon }
    : coords;

  const { data: briefing, isLoading: briefingLoading } = useGetTodayBriefing(
    { access_token: accessToken },
    { query: { enabled: !!accessToken, queryKey: getGetTodayBriefingQueryKey({ access_token: accessToken }) } }
  );

  const { data: weather, isLoading: weatherLoading } = useGetWeather(
    { lat: weatherCoords?.lat ?? 55.68, lon: weatherCoords?.lon ?? 12.57 },
    { query: { enabled: !!weatherCoords, queryKey: getGetWeatherQueryKey({ lat: weatherCoords?.lat ?? 55.68, lon: weatherCoords?.lon ?? 12.57 }) } }
  );

  const { data: googleEvents } = useGetTodayEvents(
    { access_token: accessToken },
    { query: { enabled: !!accessToken, queryKey: getGetTodayEventsQueryKey({ access_token: accessToken }) } }
  );

  const { data: appleEvents } = useGetCalDavEvents(
    { access_token: accessToken },
    { query: { enabled: !!accessToken && !!settings?.caldav_connected, queryKey: getGetCalDavEventsQueryKey({ access_token: accessToken }) } }
  );

  const { data: reminders } = useGetCalDavReminders(
    { access_token: accessToken },
    { query: { enabled: !!accessToken && !!settings?.caldav_connected, queryKey: getGetCalDavRemindersQueryKey({ access_token: accessToken }) } }
  );

  const { data: emails, isLoading: emailsLoading } = useGetGmailSummaries(
    { access_token: accessToken },
    { query: { enabled: !!accessToken, queryKey: getGetGmailSummariesQueryKey({ access_token: accessToken }) } }
  );

  const { data: aulaData } = useGetAulaData(
    { access_token: accessToken },
    { query: { enabled: !!accessToken && !!settings?.aula_connected, queryKey: getGetAulaDataQueryKey({ access_token: accessToken }) } }
  );

  const { data: schedules } = useGetSchedules(
    { access_token: accessToken },
    { query: { enabled: !!accessToken, queryKey: getGetSchedulesQueryKey({ access_token: accessToken }) } }
  );

  const { data: spotify } = useGetSpotifyRecommendation(
    { access_token: accessToken },
    { query: { enabled: !!accessToken && !!settings?.spotify_connected, queryKey: getGetSpotifyRecommendationQueryKey({ access_token: accessToken }) } }
  );

  const allEvents = [
    ...(Array.isArray(googleEvents) ? googleEvents : []),
    ...(Array.isArray(appleEvents) ? appleEvents : []),
    ...(Array.isArray(aulaData?.schedule) ? aulaData!.schedule : []).map((e) => ({
      id: e.id,
      title: `${e.title} (${e.childName})`,
      startTime: e.startTime,
      endTime: e.endTime,
      allDay: false,
      location: null,
      source: "aula" as const,
    })),
  ].sort((a, b) => {
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  const todaySchedule = (Array.isArray(schedules) ? schedules : []).filter(
    (s) => s.day_of_week.toLowerCase() === todayName.toLowerCase()
  );

  const today = new Date();

  const handleSignOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground font-sans px-6 py-12 md:px-12 md:py-24 max-w-3xl mx-auto flex flex-col space-y-16 pb-32">

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-150 fill-mode-both">
        <div className="flex items-center gap-4">
          <FloFace size={56} float />
          <h1 className="text-4xl md:text-5xl font-light italic tracking-tight text-primary">
            good morning, {firstName.toLowerCase()}.
          </h1>
        </div>
        {liveWeather && (
          <p className="mt-2 text-sm text-muted-foreground">
            {liveWeather.temperature}° · {liveWeather.condition.toLowerCase()} in {liveWeather.city.toLowerCase()}.
          </p>
        )}
        <p className="mt-4 text-muted-foreground text-sm tracking-wide">
          {format(today, "EEEE, MMMM do, yyyy").toLowerCase()}
        </p>
      </div>

      {/* Weather */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300 fill-mode-both">
        {weatherLoading ? (
          <div className="h-6 w-32 bg-muted/20 animate-pulse rounded" />
        ) : weather ? (
          <p className="text-lg tracking-wide text-foreground">
            {weather.temperature}° — {weather.condition.toLowerCase()} in {weather.city.toLowerCase()}.
          </p>
        ) : liveWeather ? (
          <p className="text-lg tracking-wide text-foreground">
            {liveWeather.temperature}° — {liveWeather.condition.toLowerCase()} in {liveWeather.city.toLowerCase()}.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">weather unavailable.</p>
        )}
      </div>

      {/* Briefing */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500 fill-mode-both space-y-4">
        {briefingLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted/20 animate-pulse rounded" />
            <div className="h-4 w-5/6 bg-muted/20 animate-pulse rounded" />
            <div className="h-4 w-4/6 bg-muted/20 animate-pulse rounded" />
          </div>
        ) : briefing ? (
          <p className="text-xl md:text-2xl leading-relaxed font-light text-foreground/90">
            {briefing.content.toLowerCase()}
          </p>
        ) : null}
      </div>

      {/* Calendar Events */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-700 fill-mode-both space-y-6">
        <h2 className="text-sm text-muted-foreground tracking-widest uppercase">today's rhythm</h2>
          {allEvents.length > 0 ? (
          <ul className="space-y-4">
            {allEvents.map((event) => (
              <li key={event.id} className="flex gap-4 items-baseline">
                <span className="text-muted-foreground text-sm w-20 flex-shrink-0">
                  {event.allDay ? "all day" : event.startTime ? format(new Date(event.startTime), "HH:mm") : ""}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-foreground text-base">{event.title.toLowerCase()}</span>
                  {"source" in event && event.source === "apple" && (
                    <span className="ml-2 text-xs text-muted-foreground/50">apple</span>
                  )}
                  {"source" in event && event.source === "aula" && (
                    <span className="ml-2 text-xs text-muted-foreground/50">aula</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm italic">a quiet day. no events scheduled.</p>
        )}
      </div>

      {/* Today's Schedule (from manual/imported) */}
      {todaySchedule.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-700 fill-mode-both space-y-6">
          <h2 className="text-sm text-muted-foreground tracking-widest uppercase">classes today</h2>
          <ul className="space-y-4">
            {todaySchedule.map((entry) => (
              <li key={entry.id} className="flex gap-4 items-baseline">
                <span className="text-muted-foreground text-sm w-20 flex-shrink-0">{entry.start_time}</span>
                <span className="text-foreground text-base">{entry.subject.toLowerCase()}</span>
                {entry.room && <span className="text-muted-foreground text-sm">{entry.room}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Apple Reminders */}
      {(Array.isArray(reminders) ? reminders : []).length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-800 fill-mode-both space-y-6">
          <h2 className="text-sm text-muted-foreground tracking-widest uppercase">reminders</h2>
          <ul className="space-y-3">
            {(Array.isArray(reminders) ? reminders : []).slice(0, 5).map((r) => (
              <li key={r.id} className="flex gap-4 items-baseline">
                <span className="text-muted-foreground text-sm w-20 flex-shrink-0">
                  {r.dueDate ? format(new Date(r.dueDate), "HH:mm") : "any time"}
                </span>
                <span className="text-foreground text-sm">{r.title.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Aula Messages */}
      {settings?.aula_connected && (Array.isArray(aulaData?.messages) ? aulaData!.messages : []).length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-900 fill-mode-both space-y-6">
          <h2 className="text-sm text-muted-foreground tracking-widest uppercase">aula.</h2>
          <ul className="space-y-5">
            {(Array.isArray(aulaData?.messages) ? aulaData!.messages : []).slice(0, 3).map((msg) => (
              <li key={msg.id} className="space-y-1">
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">{msg.sender.toLowerCase()}: </span>
                  {msg.subject.toLowerCase()}
                </p>
                {msg.preview && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{msg.preview.toLowerCase()}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Emails */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-1000 fill-mode-both space-y-6">
        <h2 className="text-sm text-muted-foreground tracking-widest uppercase">inbox notes</h2>
        {emailsLoading ? (
          <div className="space-y-4">
            <div className="h-4 w-full bg-muted/20 animate-pulse rounded" />
            <div className="h-4 w-4/5 bg-muted/20 animate-pulse rounded" />
          </div>
        ) : (Array.isArray(emails) ? emails : []).length > 0 ? (
          <ul className="space-y-6">
            {(Array.isArray(emails) ? emails : []).map((email) => (
              <li key={email.id} className="space-y-1">
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">{email.from.toLowerCase()}: </span>
                  {email.subject.toLowerCase()}
                </p>
                <p className="text-sm text-accent leading-relaxed">{email.summary.toLowerCase()}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm italic">no new summaries.</p>
        )}
      </div>

      {/* Spotify */}
      {settings?.spotify_connected && spotify && (Array.isArray(spotify.playlists) ? spotify.playlists : []).length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-1000 fill-mode-both space-y-6">
          <h2 className="text-sm text-muted-foreground tracking-widest uppercase">soundtrack for today</h2>
          {spotify.context && (
            <p className="text-sm text-muted-foreground italic">{spotify.context.toLowerCase()}</p>
          )}
          <ul className="space-y-4">
            {(Array.isArray(spotify.playlists) ? spotify.playlists : []).map((pl) => (
              <li key={pl.id}>
                <a
                  href={pl.uri.startsWith("spotify:") ? `https://open.spotify.com/playlist/${pl.id}` : pl.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-baseline gap-3"
                >
                  <span className="text-foreground text-sm group-hover:text-accent transition-colors">{pl.name.toLowerCase()}</span>
                  <span className="text-muted-foreground text-xs">↗</span>
                </a>
                <p className="text-xs text-muted-foreground mt-1">{pl.reason.toLowerCase()}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="pt-24 pb-8 animate-in fade-in duration-1000 delay-1000 fill-mode-both flex justify-between items-center">
        <div className="text-xl font-light italic text-muted-foreground">flo.</div>
        <button onClick={handleSignOut} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          sign out
        </button>
      </div>

      <Footer />

      <BottomNav accessToken={accessToken} />
    </div>
  );
}
