import { districtAt, type DistrictId } from "./districts";
import { parseCoordinates } from "./school-filters";
import type { School } from "../types";

export function schoolDistrictId(school: School): DistrictId | null {
  const point = parseCoordinates(school.coordinates);
  return point ? districtAt(point.lat, point.lng) : null;
}

/** Candidates for a school cover: its own photo first, then its district photo. */
export function schoolPhotos(school: School): string[] {
  const district = schoolDistrictId(school);
  return district ? [schoolPhotoUrl(school.slug), districtPhotoUrl(district)] : [schoolPhotoUrl(school.slug)];
}

/**
 * Photos are optional. Drop files into `public/` and they are picked up automatically:
 *   public/schools/<school-slug>.jpg   cover for one school
 *   public/districts/<district-id>.jpg cover for a district (also the fallback for its schools)
 * Without a file, a generated gradient cover is shown.
 */
export function schoolPhotoUrl(slug: string): string {
  return `/schools/${encodeURIComponent(slug)}.jpg`;
}

export function districtPhotoUrl(id: DistrictId): string {
  return `/districts/${id}.jpg`;
}

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function coverGradient(seed: string): string {
  const hash = hashString(seed);
  const hue = hash % 360;
  const shift = 35 + (hash % 40);
  return `linear-gradient(135deg, hsl(${hue} 62% 46%), hsl(${(hue + shift) % 360} 68% 34%))`;
}

export function coverAngle(seed: string): number {
  return hashString(`angle:${seed}`) % 360;
}

export function initialsOf(name: string): string {
  const words = name.split(/[^\p{L}\p{N}]+/u).filter((word) => /\p{L}/u.test(word));
  const letters = words.slice(0, 2).map((word) => Array.from(word)[0]);
  return letters.join("").toUpperCase();
}
