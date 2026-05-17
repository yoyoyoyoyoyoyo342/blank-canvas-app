import { useEffect, useState } from "react";
import { getWeather, type WeatherData } from "@/lib/weather";

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getWeather()
      .then((w) => { if (active) setWeather(w); })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "failed"); });
    return () => { active = false; };
  }, []);

  return { weather, error };
}