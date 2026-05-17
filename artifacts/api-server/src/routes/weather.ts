import { Router } from "express";
import { GetWeatherQueryParams } from "@workspace/api-zod";

const router = Router();

interface RainzWeatherResponse {
  temperature?: number;
  temp?: number;
  condition?: string;
  description?: string;
  weather?: Array<{ description: string; icon: string }>;
  main?: { temp: number };
  name?: string;
  city?: string;
  sys?: { country: string };
}

router.get("/weather", async (req, res) => {
  const parsed = GetWeatherQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing lat and lon parameters" });
    return;
  }

  const { lat, lon } = parsed.data;

  try {
    const response = await fetch(
      `https://rainz.net/api/weather?lat=${lat}&lon=${lon}`
    );

    if (!response.ok) {
      throw new Error(`Weather API responded with ${response.status}`);
    }

    const data = (await response.json()) as RainzWeatherResponse;

    const temperature =
      data.temperature ?? data.temp ?? data.main?.temp ?? 0;
    const condition =
      data.condition ??
      data.description ??
      data.weather?.[0]?.description ??
      "Unknown";
    const city = data.city ?? data.name ?? "Unknown";
    const icon = data.weather?.[0]?.icon ?? null;

    res.json({
      temperature: Math.round(temperature),
      condition,
      city,
      icon,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

export default router;
