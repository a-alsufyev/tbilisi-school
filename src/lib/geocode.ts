export type GeocodePoint = { lat: number; lng: number };

function withCity(address: string): string {
  const lower = address.toLowerCase();
  if (lower.includes("tbilisi") || lower.includes("тбилиси") || address.includes("თბილისი")) {
    return address;
  }
  return `${address}, Tbilisi`;
}

function finitePoint(lat: number, lng: number): GeocodePoint | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

async function geocodeYandex(address: string): Promise<GeocodePoint | null> {
  const key = process.env.YANDEX_MAPS_API_KEY || "";
  if (!key) return null;
  const url = new URL("https://geocode-maps.yandex.ru/1.x/");
  url.searchParams.set("apikey", key);
  url.searchParams.set("geocode", address);
  url.searchParams.set("format", "json");
  url.searchParams.set("results", "1");
  url.searchParams.set("lang", "ru_RU");
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  const body = (await response.json()) as {
    response?: {
      GeoObjectCollection?: {
        featureMember?: Array<{ GeoObject?: { Point?: { pos?: string } } }>;
      };
    };
  };
  const pos = body.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos;
  if (!pos) return null;
  const [lngRaw, latRaw] = pos.split(" ");
  return finitePoint(Number(latRaw), Number(lngRaw));
}

async function geocodeNominatim(address: string): Promise<GeocodePoint | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "ge");
  url.searchParams.set("q", address);
  const response = await fetch(url, {
    headers: { "User-Agent": "TbilisiSchools/0.1 (school address geocoder)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  const body = (await response.json()) as Array<{ lat?: string; lon?: string }>;
  const first = body[0];
  if (!first) return null;
  return finitePoint(Number(first.lat), Number(first.lon));
}

export async function geocodeAddress(address: string): Promise<GeocodePoint | null> {
  const query = withCity(address.trim());
  if (!query) return null;
  try {
    const yandex = await geocodeYandex(query);
    if (yandex) return yandex;
  } catch (error) {
    console.error("Yandex geocoder failed:", error);
  }
  try {
    return await geocodeNominatim(query);
  } catch (error) {
    console.error("Nominatim geocoder failed:", error);
    return null;
  }
}
