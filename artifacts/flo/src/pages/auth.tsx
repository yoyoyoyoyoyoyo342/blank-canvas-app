import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly",
      },
    });
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background text-foreground font-sans">
      <div className="text-center space-y-8 animate-in fade-in duration-1000">
        <div>
          <h1 className="text-6xl font-light tracking-tight">flo.</h1>
          <p className="mt-4 text-muted-foreground italic text-sm tracking-wide">
            your day, without the noise
          </p>
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="px-6 py-2 border border-muted hover:border-accent hover:text-accent transition-colors duration-300 rounded-none text-sm tracking-wide disabled:opacity-50"
        >
          {loading ? "connecting..." : "continue with Google"}
        </button>
      </div>
    </div>
  );
}
