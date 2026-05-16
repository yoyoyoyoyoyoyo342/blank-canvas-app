import { Router } from "express";
import { GeocodeCityQueryParams } from "@workspace/api-zod";

const router = Router();

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  name: string;
  address?: { city?: string; town?: string; village?: string; county?: string };
}

router.get("/geocode", async (req, res) => {
  const parsed = GeocodeCityQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Missing city parameter" }); return; }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(parsed.data.city)}&format=json&limit=1`,
      { headers: { "User-Agent": "flo-app/1.0" } }
    );

    if (!response.ok) throw new Error("Geocode API error");

    const results = (await response.json()) as NominatimResult[];
    if (!results.length) { res.status(404).json({ error: "City not found" }); return; }

    const result = results[0];
    const city =
      result.address?.city ??
      result.address?.town ??
      result.address?.village ??
      result.name ??
      parsed.data.city;

    res.json({
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      city,
    });
  } catch {
    res.status(500).json({ error: "Failed to geocode city" });
  }
});

export default router;
