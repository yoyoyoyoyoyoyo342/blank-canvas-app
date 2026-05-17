export interface WeatherData {
  temperature: number;
  condition: string;
  city: string;
  lat: number;
  lon: number;
}

export const FALLBACK_LOCATION = { lat: 55.68, lon: 12.57 };

export function getBrowserLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(FALLBACK_LOCATION);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(FALLBACK_LOCATION),
      { timeout: 5000, maximumAge: 600000 }
    );
  });
}

interface RainzResponse {
  current?: {
    temperature?: number;
    temp?: number;
    condition?: string;
    weather?: string;
    description?: string;
  };
  location?: { name?: string; city?: string };
  city?: string;
  temperature?: number;
  condition?: string;
  name?: string;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const res = await fetch(`https://nebcijfipngfaraueqdz.supabase.co/functions/v1/weather?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error(`Rainz API ${res.status}`);
  const data = ((await res.json()) ?? {}) as RainzResponse;
  const temp =
    data.current?.temperature ??
    data.current?.temp ??
    data.temperature ??
    0;
  const condition =
    data.current?.condition ??
    data.current?.weather ??
    data.current?.description ??
    data.condition ??
    "clear";
  const city = data.location?.name ?? data.location?.city ?? data.city ?? data.name ?? "your area";
  return { temperature: Math.round(temp ?? 0), condition: String(condition ?? "").toLowerCase(), city: String(city ?? "").toLowerCase(), lat, lon };
}

export async function getWeather(): Promise<WeatherData> {
  const loc = await getBrowserLocation();
  return fetchWeather(loc.lat, loc.lon);
}