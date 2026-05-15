import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  useGetTodayBriefing,
  useGetWeather,
  useGetTodayEvents,
  useGetGmailSummaries,
  getGetWeatherQueryKey,
  getGetTodayBriefingQueryKey,
  getGetTodayEventsQueryKey,
  getGetGmailSummariesQueryKey,
} from "@workspace/api-client-react";

interface BriefingScreenProps {
  firstName: string;
  accessToken: string;
}

export default function BriefingScreen({ firstName, accessToken }: BriefingScreenProps) {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
        },
        (error) => {
          console.warn("Geolocation access denied or failed, defaulting to Copenhagen:", error);
          setCoords({ lat: 55.68, lon: 12.57 });
        }
      );
    } else {
      setCoords({ lat: 55.68, lon: 12.57 });
    }
  }, []);

  const { data: briefing, isLoading: briefingLoading, error: briefingError } = useGetTodayBriefing(
    { access_token: accessToken },
    { query: { enabled: !!accessToken, queryKey: getGetTodayBriefingQueryKey({ access_token: accessToken }) } }
  );

  const { data: weather, isLoading: weatherLoading, error: weatherError } = useGetWeather(
    { lat: coords?.lat ?? 55.68, lon: coords?.lon ?? 12.57 },
    { query: { enabled: !!coords, queryKey: getGetWeatherQueryKey({ lat: coords?.lat ?? 55.68, lon: coords?.lon ?? 12.57 }) } }
  );

  const { data: events, isLoading: eventsLoading, error: eventsError } = useGetTodayEvents(
    { access_token: accessToken },
    { query: { enabled: !!accessToken, queryKey: getGetTodayEventsQueryKey({ access_token: accessToken }) } }
  );

  const { data: emails, isLoading: emailsLoading, error: emailsError } = useGetGmailSummaries(
    { access_token: accessToken },
    { query: { enabled: !!accessToken, queryKey: getGetGmailSummariesQueryKey({ access_token: accessToken }) } }
  );

  const handleSignOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
  };

  const today = new Date();

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground font-sans px-6 py-12 md:px-12 md:py-24 max-w-3xl mx-auto flex flex-col space-y-16">
      
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-150 fill-mode-both">
        <h1 className="text-4xl md:text-5xl font-light italic tracking-tight text-primary">
          good morning, {firstName.toLowerCase()}.
        </h1>
        <p className="mt-4 text-muted-foreground text-sm tracking-wide">
          {format(today, "EEEE, MMMM do, yyyy").toLowerCase()}
        </p>
      </div>

      {/* Weather */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300 fill-mode-both">
        {weatherLoading ? (
          <div className="h-6 w-32 bg-muted/20 animate-pulse rounded" />
        ) : weatherError ? (
          <p className="text-sm text-muted-foreground">weather unavailable.</p>
        ) : weather ? (
          <p className="text-lg tracking-wide text-foreground">
            {weather.temperature}° — {weather.condition.toLowerCase()} in {weather.city.toLowerCase()}.
          </p>
        ) : null}
      </div>

      {/* Briefing */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500 fill-mode-both space-y-4">
        {briefingLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted/20 animate-pulse rounded" />
            <div className="h-4 w-5/6 bg-muted/20 animate-pulse rounded" />
            <div className="h-4 w-4/6 bg-muted/20 animate-pulse rounded" />
          </div>
        ) : briefingError ? (
          <p className="text-muted-foreground italic text-sm">briefing unavailable.</p>
        ) : briefing ? (
          <p className="text-xl md:text-2xl leading-relaxed font-light text-foreground/90">
            {briefing.content.toLowerCase()}
          </p>
        ) : null}
      </div>

      {/* Calendar Events */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-700 fill-mode-both space-y-6">
        <h2 className="text-sm text-muted-foreground tracking-widest uppercase">today's rhythm</h2>
        {eventsLoading ? (
          <div className="space-y-4">
            <div className="h-4 w-1/2 bg-muted/20 animate-pulse rounded" />
            <div className="h-4 w-2/3 bg-muted/20 animate-pulse rounded" />
          </div>
        ) : eventsError ? (
          <p className="text-muted-foreground text-sm italic">calendar unavailable.</p>
        ) : events && events.length > 0 ? (
          <ul className="space-y-4">
            {events.map((event) => (
              <li key={event.id} className="flex gap-4 items-baseline">
                <span className="text-muted-foreground text-sm w-20 flex-shrink-0">
                  {event.allDay ? "all day" : event.startTime ? format(new Date(event.startTime), "HH:mm") : ""}
                </span>
                <span className="text-foreground text-base">{event.title.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm italic">a quiet day. no events scheduled.</p>
        )}
      </div>

      {/* Emails */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-1000 fill-mode-both space-y-6">
        <h2 className="text-sm text-muted-foreground tracking-widest uppercase">inbox notes</h2>
        {emailsLoading ? (
           <div className="space-y-4">
           <div className="h-4 w-full bg-muted/20 animate-pulse rounded" />
           <div className="h-4 w-4/5 bg-muted/20 animate-pulse rounded" />
         </div>
        ) : emailsError ? (
          <p className="text-muted-foreground text-sm italic">inbox unavailable.</p>
        ) : emails && emails.length > 0 ? (
          <ul className="space-y-6">
            {emails.map((email) => (
              <li key={email.id} className="space-y-1">
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">{email.from.toLowerCase()}: </span>
                  {email.subject.toLowerCase()}
                </p>
                <p className="text-sm text-accent leading-relaxed">
                  {email.summary.toLowerCase()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm italic">no new summaries.</p>
        )}
      </div>

      {/* Footer */}
      <div className="pt-24 pb-8 animate-in fade-in duration-1000 delay-1000 fill-mode-both flex justify-between items-center">
        <div className="text-xl font-light italic text-muted-foreground">flo.</div>
        <button 
          onClick={handleSignOut}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          sign out
        </button>
      </div>
    </div>
  );
}
