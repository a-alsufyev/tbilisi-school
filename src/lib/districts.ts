/**
 * Simplified outlines of Tbilisi's ten districts.
 * A school on a border can fall into the neighboring district.
 * Settlements outside these outlines (Tskneti village, Mtskheta) stay unassigned.
 * Rings are [latitude, longitude].
 */

export const DISTRICT_IDS = [
  "saburtalo",
  "vake",
  "mtatsminda",
  "krtsanisi",
  "isani",
  "samgori",
  "chughureti",
  "didube",
  "nadzaladevi",
  "gldani",
] as const;

export type DistrictId = (typeof DISTRICT_IDS)[number];

export type DistrictLabels = { en: string; ru: string; ge: string; de: string };

type Ring = ReadonlyArray<readonly [number, number]>;

export const DISTRICT_LABELS: Record<DistrictId, DistrictLabels> = {
  saburtalo: { en: "Saburtalo", ru: "Сабуртало", ge: "საბურთალო", de: "Saburtalo" },
  vake: { en: "Vake", ru: "Ваке", ge: "ვაკე", de: "Wake" },
  mtatsminda: { en: "Mtatsminda", ru: "Мтацминда", ge: "მთაწმინდა", de: "Mtazminda" },
  krtsanisi: { en: "Krtsanisi", ru: "Крцаниси", ge: "კრწანისი", de: "Krzanisi" },
  isani: { en: "Isani", ru: "Исани", ge: "ისანი", de: "Isani" },
  samgori: { en: "Samgori", ru: "Самгори", ge: "სამგორი", de: "Samgori" },
  chughureti: { en: "Chughureti", ru: "Чугурети", ge: "ჩუღურეთი", de: "Tschughureti" },
  didube: { en: "Didube", ru: "Дидубе", ge: "დიდუბე", de: "Didube" },
  nadzaladevi: { en: "Nadzaladevi", ru: "Надзаладеви", ge: "ნაძალადევი", de: "Nadsaladewi" },
  gldani: { en: "Gldani", ru: "Глдани", ge: "გლდანი", de: "Gldani" },
};

const ALIASES: Record<string, DistrictId> = {
  saburtalo: "saburtalo",
  сабуртало: "saburtalo",
  საბურთალო: "saburtalo",
  საბურთალოს: "saburtalo",
  vake: "vake",
  ваке: "vake",
  ვაკე: "vake",
  ვაკის: "vake",
  wake: "vake",
  mtatsminda: "mtatsminda",
  мтацминда: "mtatsminda",
  მთაწმინდა: "mtatsminda",
  mtazminda: "mtatsminda",
  krtsanisi: "krtsanisi",
  крцаниси: "krtsanisi",
  კრწანისი: "krtsanisi",
  krzanisi: "krtsanisi",
  isani: "isani",
  исани: "isani",
  ისანი: "isani",
  samgori: "samgori",
  самгори: "samgori",
  სამგორი: "samgori",
  chughureti: "chughureti",
  чугурети: "chughureti",
  ჩუღურეთი: "chughureti",
  tschughureti: "chughureti",
  chugureti: "chughureti",
  didube: "didube",
  дидубе: "didube",
  დიდუბე: "didube",
  nadzaladevi: "nadzaladevi",
  надзаладеви: "nadzaladevi",
  ნაძალადევი: "nadzaladevi",
  nadsaladewi: "nadzaladevi",
  gldani: "gldani",
  глдани: "gldani",
  გლდანი: "gldani",
  "старый город": "mtatsminda",
  "старом городе": "mtatsminda",
  "старого города": "mtatsminda",
  "old town": "mtatsminda",
  altstadt: "mtatsminda",
  "ძველი თბილისი": "mtatsminda",
  "ძველი ქალაქი": "mtatsminda",
};

export const DISTRICTS: { id: DistrictId; ring: Ring }[] = [
  {
    id: "saburtalo",
    ring: [
      [41.716, 44.68],
      [41.716, 44.772],
      [41.74, 44.785],
      [41.78, 44.792],
      [41.828, 44.788],
      [41.832, 44.73],
      [41.8, 44.685],
      [41.75, 44.672],
    ],
  },
  {
    id: "vake",
    ring: [
      [41.695, 44.7],
      [41.716, 44.69],
      [41.716, 44.772],
      [41.705, 44.79],
      [41.692, 44.775],
      [41.688, 44.73],
    ],
  },
  {
    id: "gldani",
    ring: [
      [41.748, 44.798],
      [41.835, 44.805],
      [41.845, 44.88],
      [41.755, 44.875],
      [41.742, 44.82],
    ],
  },
  {
    id: "didube",
    ring: [
      [41.735, 44.786],
      [41.768, 44.794],
      [41.755, 44.828],
      [41.728, 44.812],
    ],
  },
  {
    id: "nadzaladevi",
    ring: [
      [41.718, 44.792],
      [41.742, 44.788],
      [41.748, 44.824],
      [41.72, 44.826],
      [41.71, 44.808],
    ],
  },
  {
    id: "chughureti",
    ring: [
      [41.705, 44.796],
      [41.72, 44.802],
      [41.722, 44.838],
      [41.7, 44.832],
      [41.698, 44.808],
    ],
  },
  {
    id: "mtatsminda",
    ring: [
      [41.692, 44.776],
      [41.708, 44.78],
      [41.712, 44.808],
      [41.694, 44.814],
      [41.682, 44.796],
    ],
  },
  {
    id: "isani",
    ring: [
      [41.692, 44.818],
      [41.7, 44.82],
      [41.745, 44.835],
      [41.755, 44.9],
      [41.692, 44.91],
      [41.688, 44.85],
    ],
  },
  {
    id: "krtsanisi",
    ring: [
      [41.655, 44.785],
      [41.692, 44.782],
      [41.698, 44.855],
      [41.655, 44.865],
      [41.645, 44.82],
    ],
  },
  {
    id: "samgori",
    ring: [
      [41.66, 44.885],
      [41.765, 44.885],
      [41.775, 44.97],
      [41.655, 44.97],
    ],
  },
];

export function pointInRing(lat: number, lng: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const latI = ring[i][0];
    const lngI = ring[i][1];
    const latJ = ring[j][0];
    const lngJ = ring[j][1];
    const crosses = latI > lat !== latJ > lat;
    if (!crosses) continue;
    const x = ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;
    if (lng < x) inside = !inside;
  }
  return inside;
}

export function districtAt(lat: number, lng: number): DistrictId | null {
  for (const district of DISTRICTS) {
    if (pointInRing(lat, lng, district.ring)) return district.id;
  }
  return null;
}

export function isDistrictId(value: string): value is DistrictId {
  return (DISTRICT_IDS as readonly string[]).includes(value);
}

function foldDistrictQuery(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[-–]/g, " ")
    .replace(/районе|района|району|район/g, " ")
    .replace(/district|bezirk|რაიონი/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ALIAS_ENTRIES = Object.entries(ALIASES).sort((a, b) => b[0].length - a[0].length);

export function resolveDistrictId(input: string): DistrictId | null {
  const folded = foldDistrictQuery(input);
  if (!folded) return null;
  if (isDistrictId(folded)) return folded;
  const exact = ALIASES[folded];
  if (exact) return exact;
  for (const [alias, id] of ALIAS_ENTRIES) {
    if (folded.includes(alias)) return id;
  }
  return null;
}

export const AREA_IDS = ["north", "south", "center", "west", "east", "rightBank", "leftBank"] as const;

export type AreaId = (typeof AREA_IDS)[number];

export type AreaMatch = { id: AreaId; districts: readonly DistrictId[] };

const AREAS: { id: AreaId; districts: readonly DistrictId[]; aliases: readonly string[] }[] = [
  {
    id: "north",
    districts: ["gldani", "nadzaladevi", "didube"],
    aliases: ["севере", "севера", "северу", "север", "north", "norden", "ჩრდილოეთით", "ჩრდილოეთ"],
  },
  {
    id: "south",
    districts: ["krtsanisi"],
    aliases: ["юге", "юга", "югу", "юг", "south", "süden", "suden", "სამხრეთით", "სამხრეთ"],
  },
  {
    id: "center",
    districts: ["mtatsminda", "chughureti"],
    aliases: [
      "центре",
      "центра",
      "центр",
      "downtown",
      "city centre",
      "city center",
      "zentrum",
      "ცენტრში",
      "ცენტრ",
    ],
  },
  {
    id: "west",
    districts: ["vake", "saburtalo"],
    aliases: ["западе", "запада", "западу", "запад", "west", "westen", "დასავლეთით", "დასავლეთ"],
  },
  {
    id: "east",
    districts: ["isani", "samgori"],
    aliases: ["востоке", "востока", "востоку", "восток", "east", "osten", "აღმოსავლეთით", "აღმოსავლეთ"],
  },
  {
    id: "rightBank",
    districts: ["saburtalo", "vake", "mtatsminda", "didube", "nadzaladevi"],
    aliases: [
      "правом берегу",
      "правого берега",
      "правым берегом",
      "правый берег",
      "right bank",
      "rechten ufer",
      "rechtes ufer",
      "მარჯვენა სანაპირო",
      "მარჯვენა ნაპირ",
    ],
  },
  {
    id: "leftBank",
    districts: ["chughureti", "isani", "samgori", "krtsanisi", "gldani"],
    aliases: [
      "левом берегу",
      "левого берега",
      "левым берегом",
      "левый берег",
      "left bank",
      "linken ufer",
      "linkes ufer",
      "მარცხენა სანაპირო",
      "მარცხენა ნაპირ",
    ],
  },
];

const AREA_BY_ID = new Map(AREAS.map((area) => [area.id, area]));

const AREA_ALIAS_ENTRIES = AREAS.flatMap((area) => area.aliases.map((alias) => [alias, area.id] as const)).sort(
  (a, b) => b[0].length - a[0].length,
);

export function isAreaId(value: string): value is AreaId {
  return (AREA_IDS as readonly string[]).includes(value);
}

function areaMatch(id: AreaId): AreaMatch {
  const area = AREA_BY_ID.get(id);
  if (!area) return { id, districts: [] };
  return { id: area.id, districts: area.districts };
}

function foldAreaQuery(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[-–]/g, " ")
    .replace(/тбилиси|tbilisi|tiflis|თბილისი/g, " ")
    .replace(/(?:^|\s)не\s+(?=север|юг|запад|восток|центр)/g, " ")
    .replace(/(?:^|\s)(?:на|в|во|у|im|in|am|auf|of|the|der|die|das)(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rejectsArea(input: string): boolean {
  return /(?:^|\s)(?:не|not|nicht)\s+(?:на|в|во|in|im|am)\s+/i.test(input);
}

const AREA_LABELS: Record<AreaId, { cyr: string; lat: string; ge: string; de: string }> = {
  north: { cyr: "на севере", lat: "north", ge: "ჩრდილოეთით", de: "Norden" },
  south: { cyr: "на юге", lat: "south", ge: "სამხრეთით", de: "Süden" },
  center: { cyr: "в центре", lat: "center", ge: "ცენტრში", de: "Zentrum" },
  west: { cyr: "на западе", lat: "west", ge: "დასავლეთით", de: "Westen" },
  east: { cyr: "на востоке", lat: "east", ge: "აღმოსავლეთით", de: "Osten" },
  rightBank: { cyr: "на правом берегу", lat: "right bank", ge: "მარჯვენა სანაპირო", de: "rechtes Ufer" },
  leftBank: { cyr: "на левом берегу", lat: "left bank", ge: "მარცხენა სანაპირო", de: "linkes Ufer" },
};

const GERMAN_AREA_ALIASES = new Set(["norden", "süden", "suden", "westen", "osten", "zentrum"]);

function foldSpelling(value: string): string {
  return value.trim().toLowerCase().replace(/ё/g, "е");
}

function districtAliasLabel(id: DistrictId, alias: string): string {
  const labels = DISTRICT_LABELS[id];
  const folded = foldSpelling(alias);
  for (const label of [labels.ru, labels.en, labels.ge, labels.de]) {
    if (foldSpelling(label) === folded) return label;
  }
  if (/[ა-ჰ]/.test(alias)) return labels.ge;
  if (/[а-яё]/i.test(alias)) return labels.ru;
  return labels.en;
}

function areaAliasLabel(id: AreaId, alias: string): string {
  const labels = AREA_LABELS[id];
  if (/[ა-ჰ]/.test(alias)) return labels.ge;
  if (/[а-яё]/i.test(alias)) return labels.cyr;
  if (GERMAN_AREA_ALIASES.has(foldSpelling(alias))) return labels.de;
  return labels.lat;
}

export function placeSpellings(): { key: string; label: string; replacement: string }[] {
  const seen = new Set<string>();
  const spellings: { key: string; label: string; replacement: string }[] = [];
  const add = (key: string, label: string, replacement: string) => {
    const folded = foldSpelling(key);
    if (folded.length < 4 || folded.includes(" ") || seen.has(folded)) return;
    seen.add(folded);
    spellings.push({ key: folded, label, replacement });
  };

  for (const id of DISTRICT_IDS) {
    const labels = DISTRICT_LABELS[id];
    for (const label of [labels.en, labels.ru, labels.ge, labels.de]) add(label, label, label);
  }
  for (const [alias, id] of Object.entries(ALIASES)) {
    const label = districtAliasLabel(id, alias);
    add(alias, label, label);
  }
  for (const area of AREAS) {
    for (const alias of area.aliases) add(alias, areaAliasLabel(area.id, alias), alias);
  }
  return spellings;
}

export function resolveArea(input: string): AreaMatch | null {
  if (rejectsArea(input)) return null;
  const folded = foldAreaQuery(input);
  if (!folded) return null;
  if (isAreaId(folded)) return areaMatch(folded);
  const compact = folded.replace(/\s+/g, "");
  if (compact === "rightbank") return areaMatch("rightBank");
  if (compact === "leftbank") return areaMatch("leftBank");
  for (const [alias, id] of AREA_ALIAS_ENTRIES) {
    if (folded.includes(alias)) return areaMatch(id);
  }
  return null;
}
