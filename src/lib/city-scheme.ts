import { DISTRICTS } from "./districts";

const BOUNDS = (() => {
  const points = DISTRICTS.flatMap((district) => district.ring);
  const lats = points.map((point) => point[0]);
  const lngs = points.map((point) => point[1]);
  return { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLng: Math.min(...lngs), maxLng: Math.max(...lngs) };
})();

export const SCHEME_WIDTH = 320;
const LNG_SCALE = Math.cos((41.72 * Math.PI) / 180);
const SPAN_X = (BOUNDS.maxLng - BOUNDS.minLng) * LNG_SCALE;
const SPAN_Y = BOUNDS.maxLat - BOUNDS.minLat;
export const SCHEME_HEIGHT = Math.round((SCHEME_WIDTH * SPAN_Y) / SPAN_X);

export function projectToScheme(lat: number, lng: number): [number, number] {
  return [
    ((lng - BOUNDS.minLng) * LNG_SCALE * SCHEME_WIDTH) / SPAN_X,
    ((BOUNDS.maxLat - lat) * SCHEME_HEIGHT) / SPAN_Y,
  ];
}

export const SCHEME_RINGS = DISTRICTS.map((district) => ({
  id: district.id,
  points: district.ring
    .map(([lat, lng]) =>
      projectToScheme(lat, lng)
        .map((value) => value.toFixed(1))
        .join(",")
    )
    .join(" "),
}));
