import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import AuthScreen from "@/pages/auth";
import BriefingScreen from "@/pages/briefing";
import ChatScreen from "@/pages/chat";
import SettingsScreen from "@/pages/settings";
import PrivacyPage from "@/pages/privacy";
import CookiesPage from "@/pages/cookies";
import TermsPage from "@/pages/terms";
import NotFound from "@/pages/not-found";
import PlusScreen from "@/pages/plus";
import AdminScreen from "@/pages/admin";
import LandingPage from "@/pages/landing";
import OnboardingFlow from "@/pages/onboarding-flow";

const queryClient = new QueryClient();

function AuthRedirector({ userId }: { userId: string }) {
  const [location, navigate] = useLocation();
  useEffect(() => {
    if (!supabase || !userId) return;
    if (location !== "/auth") return;
    supabase
      .from("user_settings")
      .select("onboarding_complete")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }: { data: { onboarding_complete: boolean } | null }) => {
        navigate(data?.onboarding_complete ? "/briefing" : "/onboarding");
      });
  }, [userId, location, navigate]);
  return null;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.add("dark");
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen w-full bg-background flex items-center justify-center" />;
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center gap-6 px-6">
        <h1 className="text-5xl font-light italic tracking-tight">flo.</h1>
        <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
          add <span className="text-foreground">VITE_SUPABASE_URL</span> and{" "}
          <span className="text-foreground">VITE_SUPABASE_ANON_KEY</span> to your environment variables to get started.
        </p>
      </div>
    );
  }

  const accessToken = session?.provider_token ?? session?.access_token ?? "";
  const firstName = session?.user.user_metadata.full_name?.split(" ")[0] ?? session?.user.email?.split("@")[0] ?? "there";
  const email = session?.user.email ?? "";
  const userId = session?.user.id ?? "";

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          {session && userId && <AuthRedirector userId={userId} />}
          <Switch>
            <Route path="/privacy" component={PrivacyPage} />
            <Route path="/cookies" component={CookiesPage} />
            <Route path="/terms" component={TermsPage} />
            <Route path="/plus">
              {session ? <PlusScreen accessToken={accessToken} /> : <AuthScreen />}
            </Route>
            <Route path="/admin">
              {session ? <AdminScreen email={email} /> : <AuthScreen />}
            </Route>
            <Route path="/" component={LandingPage} />
            <Route path="/briefing">
              {session ? <BriefingScreen firstName={firstName} accessToken={accessToken} /> : <AuthScreen />}
            </Route>
            <Route path="/onboarding">
              {session && userId ? <OnboardingFlow userId={userId} /> : <AuthScreen />}
            </Route>
            <Route path="/chat">
              {session ? <ChatScreen accessToken={accessToken} firstName={firstName} /> : <AuthScreen />}
            </Route>
            <Route path="/settings">
              {session ? <SettingsScreen accessToken={accessToken} firstName={firstName} email={email} /> : <AuthScreen />}
            </Route>
            <Route path="/auth">
              {session ? <BriefingScreen firstName={firstName} accessToken={accessToken} /> : <AuthScreen />}
            </Route>
            <Route component={NotFound} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
