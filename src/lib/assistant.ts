import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI, { APIError } from "openai";
import { formatInstructionLanguagesLabel } from "../admin/languages";
import { joinLookupLabels } from "./lookups";
import { primarySchoolName } from "../hooks/useSchoolTranslations";
import { costCurrencyOf, costPeriodOf, costStatusOf, costYearOf, formatCostFigures } from "./cost";
import { loadExchangeRates, type ExchangeRates } from "./exchange-rates";
import { resolveArea, resolveDistrictId, type AreaMatch } from "./districts";
import type { School } from "../types";
import {
  attachDistrict,
  compareSchools,
  districtLabels,
  programsMatch,
  searchSchools,
  type AssistantSchool,
  type SchoolSearchResult,
  type PriceConstraint,
  type PriceCurrency,
  type PricePeriod,
  type SchoolSearchFilters,
} from "./school-filters";
import { normalizeUiLanguage, isSafeSchoolIdentifier, type UiLang } from "./schools";
import {
  applyQueryTypos,
  clarificationReply,
  findQueryTypos,
  isAffirmation,
  isDenial,
  isTypoClarification,
  messageLocale,
  typoDenialReply,
} from "./typos";

export class AssistantConfigError extends Error {
  constructor() {
    super("assistant_unavailable");
    this.name = "AssistantConfigError";
  }
}

export class AssistantProviderError extends Error {
  constructor() {
    super("assistant_failed");
    this.name = "AssistantProviderError";
  }
}

export type AssistantTurn = {
  role: "user" | "assistant";
  content: string;
  shown?: string[];
};

export type AssistantReply = {
  reply: string;
  schools: AssistantSchool[];
  comparison: AssistantSchool[] | null;
};

const MAX_MESSAGES = 12;
const MAX_CHARS = 2000;

const FALLBACK: Record<UiLang, string> = {
  en: "I could not put an answer together. Please try rephrasing.",
  ru: "Не получилось сформулировать ответ. Попробуйте переформулировать запрос.",
  ge: "პასუხის ჩამოყალიბება ვერ მოხერხდა. სცადეთ სხვაგვარად.",
  de: "Die Antwort konnte nicht formuliert werden. Bitte formulieren Sie die Frage anders.",
};

const promptDir = join(dirname(fileURLToPath(import.meta.url)), "../../prompt");
const PARSE_PROMPT = readFileSync(join(promptDir, "parse.txt"), "utf8").trim();
const REPLY_PROMPT = readFileSync(join(promptDir, "reply.txt"), "utf8").trim();

function systemPrompt(prompt: string, locale: UiLang): OpenAI.ChatCompletionMessageParam {
  return {
    role: "system",
    content: `${prompt}\nЯзык интерфейса: ${locale}. Это язык карточек и таблицы, не язык текста ответа.`,
  };
}

const PRICE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    amount: { type: "number" },
    currency: { type: "string", enum: ["USD", "EUR", "GEL"] },
    period: { type: "string", enum: ["year", "month"] },
  },
  required: ["amount", "currency", "period"],
} as const;

const SEARCH_TOOL: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "search_schools",
    description:
      "Отфильтровать каталог. Каждое заданное поле обязательно вместе с остальными. Не указывай поле, которое пользователь не ограничил.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        languages: {
          type: "array",
          items: { type: "string", enum: ["GE", "EN", "RU", "DE", "FR"] },
          description: 'Языки, которые школа должна включать. Англоязычные школы — ["EN"].',
        },
        program: {
          type: "string",
          description:
            "Ключевое слово учебной программы, которое сопоставляется с любой меткой программы в каталоге: IB, British, American, Cambridge, national, German, Finnish, private, alternative. Не ищет международный статус и аккредитацию.",
        },
        district: {
          type: "string",
          enum: [
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
          ],
          description: "Идентификатор одного района Тбилиси. Saburtalo, Сабуртало и საბურთალო — это saburtalo. Старый Тбилиси — mtatsminda.",
        },
        area: {
          type: "string",
          enum: ["north", "south", "center", "west", "east", "rightBank", "leftBank"],
          description:
            "Примерная часть города, не район. north: Глдани, Надзаладеви, Дидубе. south: Крцаниси. center: Мтацминда и Чугурети. west: Ваке и Сабуртало. east: Исани и Самгори. rightBank: Сабуртало, Ваке, Мтацминда, Дидубе, Надзаладеви. leftBank: Чугурети, Исани, Самгори, Крцаниси, Глдани.",
        },
        minPrice: PRICE_SCHEMA,
        maxPrice: PRICE_SCHEMA,
        priceRank: {
          type: "string",
          enum: ["cheapest", "expensive"],
          description:
            "cheapest — самые дешёвые: треть школ с наименьшей нижней границей цены. expensive — самые дорогие: треть с наибольшей верхней границей. Не подставляй для этого сумму в minPrice или maxPrice.",
        },
      },
    },
  },
};

const COMPARE_TOOL: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "compare_schools",
    description: "Сравнить от 2 до 4 школ каталога по сохранённым полям. Передай названия или слаги.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        schools: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
          description: "От двух до четырёх названий или слагов школ. Лишние элементы игнорируются.",
        },
      },
      required: ["schools"],
    },
  },
};

function textOrFallback(content: string | null | undefined, locale: UiLang): string {
  const text = content?.trim();
  return text ? text : FALLBACK[locale];
}

function parsePrice(value: unknown): PriceConstraint | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const amount = typeof record.amount === "number" ? record.amount : Number(record.amount);
  const currency = record.currency;
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  if (currency !== "USD" && currency !== "EUR" && currency !== "GEL") return undefined;
  const period: PricePeriod = record.period === "month" ? "month" : "year";
  return { amount, currency: currency as PriceCurrency, period };
}

export function parseToolFilters(raw: string): SchoolSearchFilters {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object") return {};
  const record = parsed as Record<string, unknown>;
  const filters: SchoolSearchFilters = {};
  if (Array.isArray(record.languages)) {
    const languages = record.languages.filter((item): item is string => typeof item === "string");
    if (languages.length > 0) filters.languages = languages;
  }
  if (typeof record.program === "string" && record.program.trim()) {
    filters.program = record.program.trim().slice(0, 80);
  }
  if (typeof record.district === "string" && record.district.trim()) {
    filters.district = record.district.trim().slice(0, 80);
  }
  if (typeof record.area === "string" && record.area.trim()) {
    filters.area = record.area.trim().slice(0, 80);
  }
  const minPrice = parsePrice(record.minPrice);
  const maxPrice = parsePrice(record.maxPrice);
  if (minPrice) filters.minPrice = minPrice;
  if (maxPrice) filters.maxPrice = maxPrice;
  if (record.priceRank === "cheapest" || record.priceRank === "expensive") filters.priceRank = record.priceRank;
  return filters;
}

function latestUserText(messages: AssistantTurn[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") return messages[index].content;
  }
  return "";
}

function withoutDistrict(filters: SchoolSearchFilters): SchoolSearchFilters {
  const next = { ...filters };
  delete next.district;
  return next;
}

function priceRankFromUserText(text: string): SchoolSearchFilters["priceRank"] {
  const patterns: { rank: NonNullable<SchoolSearchFilters["priceRank"]>; pattern: RegExp }[] = [
    { rank: "cheapest", pattern: /сам\p{L}*\s+деш[её]|cheapest|most affordable|günstigsten|იაფ/giu },
    { rank: "expensive", pattern: /сам\p{L}*\s+дорог|most expensive|teuersten|ძვირ/giu },
  ];
  let best: { rank: NonNullable<SchoolSearchFilters["priceRank"]>; index: number } | null = null;
  for (const item of patterns) {
    for (const match of text.matchAll(item.pattern)) {
      const index = match.index ?? -1;
      if (index >= 0 && (!best || index > best.index)) best = { rank: item.rank, index };
    }
  }
  return best?.rank;
}

function applyPriceRank(filters: SchoolSearchFilters, text: string): SchoolSearchFilters {
  const rank = priceRankFromUserText(text) ?? filters.priceRank;
  if (!rank || filters.priceRank === rank) return filters;
  return { ...filters, priceRank: rank };
}

function userAddsSearchConstraint(text: string): boolean {
  if (resolveDistrictId(text) || resolveArea(text)) return true;
  if (/\b(?:GE|EN|RU|DE|FR|IB)\b/.test(text)) return true;
  if (/английск|русск|грузин|немец|француз|english|russian|georgian|german|french|ინგლის|რუსულ|ქართულ|british|британ|american|американ|cambridge|кембридж|националь|финск/i.test(text)) return true;
  return /\d/.test(text);
}

function rankScope(
  filters: SchoolSearchFilters,
  text: string,
  messages: AssistantTurn[],
  schools: School[]
): { filters: SchoolSearchFilters; schools: School[]; withinShown: boolean } {
  if (!filters.priceRank || userAddsSearchConstraint(text)) return { filters, schools, withinShown: false };
  const slugs = lastShownSlugs(messages);
  if (slugs.length === 0) return { filters, schools, withinShown: false };
  const allowed = new Set(slugs);
  const shown = schools.filter((school) => allowed.has(school.slug));
  if (shown.length === 0) return { filters, schools, withinShown: false };
  return { filters: { priceRank: filters.priceRank }, schools: shown, withinShown: true };
}

function areaFromUserText(text: string, filters: SchoolSearchFilters): SchoolSearchFilters | null {
  if (resolveDistrictId(text)) return null;
  const area = resolveArea(text);
  if (!area) return null;
  if (filters.area === area.id && !filters.district) return null;
  return { ...withoutDistrict(filters), area: area.id };
}

const AREA_PHRASE: Record<AreaMatch["id"], string> = {
  north: "на севере",
  south: "на юге",
  center: "в центре",
  west: "на западе",
  east: "на востоке",
  rightBank: "на правом берегу",
  leftBank: "на левом берегу",
};

function correctPlaceReply(reply: string, area: AreaMatch, found: number, locale: UiLang): string {
  if (locale !== "ru") return reply;
  let text = reply;
  if (area.id === "north") {
    text = text.replace(/южн(ой|ая|ые|ых|ом|ую|ое)/gi, "северн$1");
    text = text.replace(/на юге/gi, "на севере");
  } else if (area.id === "south") {
    text = text.replace(/северн(ой|ая|ые|ых|ом|ую|ое)/gi, "южн$1");
    text = text.replace(/на севере/gi, "на юге");
  }
  text = text.trim();
  const names = area.districts.map((id) => districtLabels(id).ru).join(", ");
  const missed = /ослабить условия|ничего не нашл|не найдено|ничего не найд/i.test(text);
  if (!text || (found > 0 && missed)) {
    return `Искали ${AREA_PHRASE[area.id]}: ${names}. Подходящие школы показаны карточками.`;
  }
  return text;
}

function prepareTurns(
  messages: AssistantTurn[],
  schools: School[],
  locale: UiLang
): { messages: AssistantTurn[]; reply: string | null } {
  const latest = latestUserText(messages);
  if (messages.length >= 3) {
    const assistant = messages[messages.length - 2];
    const previousUser = messages[messages.length - 3];
    if (assistant?.role === "assistant" && previousUser?.role === "user" && isTypoClarification(assistant.content)) {
      const replyLocale = messageLocale(latest, locale);
      if (isDenial(latest)) return { messages, reply: typoDenialReply(replyLocale) };
      if (isAffirmation(latest)) {
        const typos = findQueryTypos(previousUser.content, schools);
        if (typos.length > 0) {
          const corrected = applyQueryTypos(previousUser.content, typos);
          const next = messages.map((turn, index) =>
            index === messages.length - 3 || index === messages.length - 1 ? { ...turn, content: corrected } : turn
          );
          return { messages: next, reply: null };
        }
      }
    }
  }
  const typos = findQueryTypos(latest, schools);
  if (typos.length > 0) return { messages, reply: clarificationReply(typos, messageLocale(latest, locale)) };
  return { messages, reply: null };
}

const INTERNATIONAL_PROGRAM =
  /cambridge|кембридж|\bib\b|british|британ|american|американ|us curriculum|pearson|edexcel|a-level|gcse|финск|finnish|немец|german|deutsch/i;

type ShownProgramQuestion = "international" | "cambridge" | "ib" | "british" | "american" | "list";

function refersToShownSet(text: string): boolean {
  return /этих|из них|эти школ|среди них|these schools|of these|among these|welche dieser|dieser schulen|ამ სკოლ/i.test(
    text
  );
}

function shownProgramQuestion(text: string): ShownProgramQuestion | null {
  if (!refersToShownSet(text)) return null;
  if (/cambridge|кембридж/i.test(text)) return "cambridge";
  if (/\bib\b/i.test(text)) return "ib";
  if (/british|британ/i.test(text)) return "british";
  if (/american|американ/i.test(text)) return "american";
  if (/международн|international/i.test(text)) return "international";
  if (/программ|curriculum|programm/i.test(text)) return "list";
  return null;
}

function programFitsQuestion(school: School, question: ShownProgramQuestion): boolean {
  const labels = school.programs ?? [];
  if (question === "list") return true;
  if (question === "international") return labels.some((label) => INTERNATIONAL_PROGRAM.test(label));
  if (question === "cambridge") return labels.some((label) => /cambridge|кембридж/i.test(label));
  if (question === "ib") return programsMatch(labels, "IB");
  if (question === "british") return programsMatch(labels, "British");
  return programsMatch(labels, "American");
}

function schoolsForSlugs(slugs: string[], schools: School[]): AssistantSchool[] {
  const bySlug = new Map(schools.map((school) => [school.slug, school]));
  return slugs.flatMap((slug) => {
    const school = bySlug.get(slug);
    return school ? [attachDistrict(school)] : [];
  });
}

function lastShownSlugs(messages: AssistantTurn[]): string[] {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const turn = messages[index];
    if (turn?.role === "assistant" && turn.shown && turn.shown.length > 0) return turn.shown;
  }
  return [];
}

function joinQuotedPrograms(schools: AssistantSchool[], locale: UiLang): string {
  const parts = schools.map((school) => {
    const program = joinLookupLabels(school.programs);
    const quoted = program || (locale === "ru" ? "не указана" : locale === "de" ? "nicht angegeben" : locale === "ge" ? "არ არის მითითებული" : "not listed");
    return `${primarySchoolName(school)} («${quoted}»)`;
  });
  if (parts.length <= 1) return parts[0] ?? "";
  const and = locale === "ru" ? " и " : locale === "de" ? " und " : locale === "ge" ? " და " : " and ";
  return `${parts.slice(0, -1).join(", ")}${and}${parts[parts.length - 1]}`;
}

function shownProgramReply(
  locale: UiLang,
  question: ShownProgramQuestion,
  matches: AssistantSchool[],
  total: number
): string {
  const list = joinQuotedPrograms(matches, locale);
  const others = matches.length > 0 && matches.length < total;
  if (locale === "ru") {
    if (matches.length === 0) {
      if (question === "international") return "Среди этих школ в каталоге нет международной программы.";
      if (question === "list") return "У этих школ в каталоге программа не указана.";
      const label = question === "cambridge" ? "Cambridge" : question === "ib" ? "IB" : question === "british" ? "British" : "American";
      return `Среди этих школ в каталоге нет программы ${label}.`;
    }
    if (question === "list") return `В каталоге у этих школ указаны такие программы: ${list}.`;
    const head =
      question === "international"
        ? `Среди этих школ международная программа в каталоге есть у ${list}.`
        : `Среди этих школ ${question === "cambridge" ? "Cambridge" : question === "ib" ? "IB" : question === "british" ? "British" : "American"} в каталоге указан у ${list}.`;
    const tail =
      question === "international"
        ? " У остальных показанных школ её нет."
        : ` У остальных показанных школ ${question === "cambridge" ? "Cambridge" : question === "ib" ? "IB" : question === "british" ? "British" : "American"} нет.`;
    return others ? `${head}${tail}` : head;
  }
  if (locale === "de") {
    if (matches.length === 0) {
      return question === "international"
        ? "Unter diesen Schulen steht im Katalog kein internationales Programm."
        : "Unter diesen Schulen steht dieses Programm im Katalog nicht.";
    }
    if (question === "list") return `Im Katalog sind bei diesen Schulen diese Programme angegeben: ${list}.`;
    const head =
      question === "international"
        ? `Unter diesen Schulen steht im Katalog ein internationales Programm bei ${list}.`
        : `Unter diesen Schulen steht dieses Programm im Katalog bei ${list}.`;
    return others ? `${head} Bei den übrigen gezeigten Schulen steht es nicht.` : head;
  }
  if (locale === "ge") {
    if (matches.length === 0) {
      return question === "international"
        ? "ამ სკოლებს კატალოგში საერთაშორისო პროგრამა არ აქვთ."
        : "ამ სკოლებს ეს პროგრამა კატალოგში არ აქვთ.";
    }
    if (question === "list") return `კატალოგში ამ სკოლებს ასეთი პროგრამები აქვთ: ${list}.`;
    const head =
      question === "international"
        ? `ამ სკოლებიდან საერთაშორისო პროგრამა კატალოგში აქვთ: ${list}.`
        : `ამ სკოლებიდან ეს პროგრამა კატალოგში აქვთ: ${list}.`;
    return others ? `${head} დანარჩენ ნაჩვენებ სკოლებს ის არ აქვთ.` : head;
  }
  if (matches.length === 0) {
    return question === "international"
      ? "None of these schools have an international program in the catalog."
      : "None of these schools have that program in the catalog.";
  }
  if (question === "list") return `The catalog lists these programs for the schools: ${list}.`;
  const head =
    question === "international"
      ? `Among these schools, the catalog lists an international program at ${list}.`
      : `Among these schools, the catalog lists that program at ${list}.`;
  return others ? `${head} The other schools shown do not.` : head;
}

export function answerAboutShownPrograms(
  messages: AssistantTurn[],
  schools: School[],
  locale: UiLang
): AssistantReply | null {
  const question = shownProgramQuestion(latestUserText(messages));
  const slugs = lastShownSlugs(messages);
  if (!question || slugs.length === 0) return null;
  const shown = schoolsForSlugs(slugs, schools);
  if (shown.length === 0) return null;
  const matches =
    question === "list" ? shown : shown.filter((school) => programFitsQuestion(school, question));
  return {
    reply: shownProgramReply(messageLocale(latestUserText(messages), locale), question, matches, shown.length),
    schools: matches,
    comparison: null,
  };
}

function shownCatalogNote(slugs: string[], schools: School[]): string {
  const lines = slugs.map((slug) => {
    const school = schools.find((item) => item.slug === slug);
    if (!school) return `- ${slug}`;
    const programs = joinLookupLabels(school.programs) || "нет";
    const internationalStatuses = joinLookupLabels(school.internationalStatuses) || "нет";
    const accreditations = joinLookupLabels(school.accreditations) || "нет";
    return `- ${slug} | ${primarySchoolName(school)} | программы: ${programs} | международный статус: ${internationalStatuses} | аккредитация: ${accreditations}`;
  });
  return `Показанные школы и их списки из каталога. Приписывай учебную программу, только если она записана в programs. Международный статус и аккредитация — отдельные списки:\n${lines.join("\n")}`;
}

function asksForSchools(text: string): boolean {
  return /подбер|найд|ищ|школ|find|school|suche|სკოლ/i.test(text);
}

function filtersAreEmpty(filters: SchoolSearchFilters): boolean {
  return (
    !filters.languages?.length &&
    !filters.program &&
    !filters.district &&
    !filters.area &&
    !filters.minPrice &&
    !filters.maxPrice &&
    !filters.priceRank
  );
}

function rateNote(rates: ExchangeRates | null) {
  if (!rates) return null;
  return {
    source: rates.source,
    date: rates.date,
    gelPerUsd: rates.gelPer.USD,
    gelPerEur: rates.gelPer.EUR,
  };
}

function catalogCost(school: School): string | null {
  if (costStatusOf(school) === "unknown") return null;
  const text = formatCostFigures(school, { from: "from", to: "up to" });
  return text || null;
}

async function toolPayload(
  filters: SchoolSearchFilters,
  schools: School[],
  locale: UiLang,
  withinShown = false
): Promise<{ payload: unknown; selected: AssistantSchool[] }> {
  if (filtersAreEmpty(filters)) {
    return {
      payload: {
        error: "no_constraints",
        hint: "Спроси, какой язык, учебная программа, район или бюджет важны. Не перечисляй школы.",
      },
      selected: [],
    };
  }

  const rates = await loadExchangeRates();
  const result = searchSchools(schools, filters, rates?.gelPer ?? null);
  if (result.unknownDistrict) {
    return {
      payload: {
        error: "unknown_district",
        hint: "Это место не входит в десять нанесённых на карту районов Тбилиси и не является известной областью (north, south, center, west, east, rightBank, leftBank).",
      },
      selected: [],
    };
  }

  return {
    selected: result.matches.map((match) => match.school),
    payload: {
      applied: filters,
      area: result.area
        ? {
            id: result.area.id,
            districts: result.area.districts.map((id) => ({ id, names: districtLabels(id) })),
          }
        : null,
      schools: result.matches.map((match) => ({
        slug: match.school.slug,
        name: primarySchoolName(match.school),
        languages: formatInstructionLanguagesLabel(match.school.languages, "bilingual"),
        cost: catalogCost(match.school),
        costMin: costStatusOf(match.school) === "unknown" ? null : match.school.costMin,
        costMax: costStatusOf(match.school) === "unknown" ? null : match.school.costMax,
        costCurrency: costCurrencyOf(match.school),
        costStatus: costStatusOf(match.school),
        costYear: costYearOf(match.school),
        costPeriod: costPeriodOf(match.school),
        programs: match.school.programs,
        internationalStatuses: match.school.internationalStatuses,
        accreditations: match.school.accreditations,
        address: match.school.address,
        district: match.school.district,
        districtNames: match.school.district ? districtLabels(match.school.district) : null,
        priceUncertain: match.priceUncertain,
      })),
      outsideDistrictCount: result.outsideDistrict.length,
      exchangeRates: rateNote(rates),
      priceRank: result.priceRank,
      replyHint: searchReplyHint(result, locale, withinShown),
    },
  };
}

function areaSentence(result: SchoolSearchResult, locale: UiLang): string {
  if (!result.area) return "";
  const names = result.area.districts.map((id) => districtLabels(id)[locale]).join(", ");
  return `Этот поиск — ровно область с id «${result.area.id}» (${names}). north — север, south — юг, center — центр, west — запад, east — восток. Используй только сторону света, которая соответствует этому id области. Упомяни каждый район. Эти районы внутри запрошенной области.`;
}

function outsideSentence(count: number): string {
  if (count === 0) return "";
  return ` outsideDistrictCount равен ${count}. Одним предложением скажи, что столько школ подошли по языку, программе или бюджету, но их точка не попала ни в один район. Не описывай их языки, цены и программы и не называй их школами запрошенной области.`;
}

function searchReplyHint(result: SchoolSearchResult, locale: UiLang, withinShown = false): string {
  if (result.priceRank?.considered === 0) {
    return "Ни у одной подходящей школы нет цены, по которой можно сравнить. Скажи, что отобрать самые дешёвые или самые дорогие нельзя. Не перечисляй школы.";
  }
  const place = areaSentence(result, locale);
  const outside = outsideSentence(result.outsideDistrict.length);
  if (result.matches.length === 0) {
    const where = place ? `${place} Скажи, что в этих районах школ нет.` : "Скажи, что ничего не нашлось.";
    return `Список schools пуст. Ответь на языке последнего сообщения пользователя, даже если это не язык интерфейса и не язык этой подсказки. ${where} Не описывай языки, цены, программы и не говори, что набор есть.${outside}`;
  }
  const summary = `Карточки перечислят каждую школу на языке интерфейса. Ответь только коротким резюме на языке последнего сообщения пользователя, даже если это не язык интерфейса и не язык этой подсказки. ${place} Опиши школы с одним языком и билингвальные (RU/EN, GE/EN), разброс цен и программы. Не называй школы и не делай список.${outside}`;
  if (!result.priceRank) return summary;
  const slice =
    result.priceRank.kind === "cheapest"
      ? `Список schools уже содержит треть школ с самой низкой нижней границей цены: ${result.priceRank.shown} из ${result.priceRank.considered} с известной ценой. ${withinShown ? "Счёт идёт от школ, которые уже были показаны, а не от всего каталога." : "Это не весь каталог."} Школы без цены в список не входили. Скажи об этом в резюме и сам школы не отбирай.`
      : `Список schools уже содержит треть школ с самой высокой верхней границей цены: ${result.priceRank.shown} из ${result.priceRank.considered} с известной ценой. ${withinShown ? "Счёт идёт от школ, которые уже были показаны, а не от всего каталога." : "Это не весь каталог."} Школы без цены в список не входили. Скажи об этом в резюме и сам школы не отбирай.`;
  return `${summary} ${slice}`;
}

function describeSchool(school: AssistantSchool, locale: UiLang) {
  return {
    slug: school.slug,
    name: primarySchoolName(school),
    languages: formatInstructionLanguagesLabel(school.languages, "bilingual"),
    cost: catalogCost(school),
    costMin: costStatusOf(school) === "unknown" ? null : school.costMin,
    costMax: costStatusOf(school) === "unknown" ? null : school.costMax,
    costCurrency: costCurrencyOf(school),
    costStatus: costStatusOf(school),
    costYear: costYearOf(school),
    costPeriod: costPeriodOf(school),
    programs: school.programs,
    internationalStatuses: school.internationalStatuses,
    accreditations: school.accreditations,
    address: school.address,
    website: school.website ?? null,
    district: school.district,
    districtNames: school.district ? districtLabels(school.district) : null,
  };
}

async function comparePayload(
  raw: string,
  schools: School[],
  locale: UiLang
): Promise<{ payload: unknown; matched: AssistantSchool[] }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }
  const record = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  const queries = Array.isArray(record.schools)
    ? record.schools.filter((item): item is string => typeof item === "string").slice(0, 8)
    : [];
  const result = compareSchools(schools, queries);
  if (result.matched.length < 2) {
    return {
      matched: [],
      payload: {
        error: "need_two_schools",
        missing: result.missing,
        matched: result.matched.map((school) => describeSchool(school, locale)),
        hint: "Для сравнения нужны минимум две школы из каталога. Скажи, какие названия не найдены.",
      },
    };
  }
  return {
    matched: result.matched,
    payload: {
      truncated: result.truncated,
      missing: result.missing,
      schools: result.matched.map((school) => describeSchool(school, locale)),
      exchangeRates: rateNote(await loadExchangeRates()),
      replyHint:
        "Интерфейс рисует таблицу сравнения этих школ на языке интерфейса: языки, программы, международный статус, аккредитация, цена, район, адрес, сайт. Напиши одно-два предложения о главных различиях на языке последнего сообщения пользователя, даже если это не язык интерфейса и не язык этой подсказки. Не рисуй таблицу и не повторяй каждую ячейку. Если truncated равен true, скажи, что сравнить можно только четыре школы. Цены в таблице остаются в валюте каталога. Если есть exchangeRates, можно по нему сказать, какая школа дороже при разных валютах.",
    },
  };
}

export function parseAssistantRequest(
  body: unknown
): { locale: string; messages: AssistantTurn[] } | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const locale = typeof record.locale === "string" ? record.locale : "en";
  if (!Array.isArray(record.messages)) return null;
  if (record.messages.length === 0 || record.messages.length > MAX_MESSAGES) return null;

  const messages: AssistantTurn[] = [];
  for (const item of record.messages) {
    if (!item || typeof item !== "object") return null;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > MAX_CHARS) return null;
    const turn: AssistantTurn = { role, content: trimmed };
    if (role === "assistant" && Array.isArray((item as { shown?: unknown }).shown)) {
      const shown = (item as { shown: unknown[] }).shown
        .filter((slug): slug is string => typeof slug === "string" && isSafeSchoolIdentifier(slug))
        .slice(0, 30);
      if (shown.length > 0) turn.shown = shown;
    }
    messages.push(turn);
  }

  if (messages[messages.length - 1]?.role !== "user") return null;
  return { locale, messages };
}

export async function runAssistant(input: {
  locale: string;
  messages: AssistantTurn[];
  schools: School[];
}): Promise<AssistantReply> {
  const locale = normalizeUiLanguage(input.locale);
  const prepared = prepareTurns(input.messages, input.schools, locale);
  if (prepared.reply) return { reply: prepared.reply, schools: [], comparison: null };
  const dialogue = prepared.messages;
  const grounded = answerAboutShownPrograms(dialogue, input.schools, locale);
  if (grounded) return grounded;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new AssistantConfigError();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const client = new OpenAI({ apiKey, timeout: 25_000, maxRetries: 0 });
  const history: OpenAI.ChatCompletionMessageParam[] = dialogue.map((turn) => ({
    role: turn.role,
    content:
      turn.role === "assistant" && turn.shown?.length
        ? `${turn.content}\n\n${shownCatalogNote(turn.shown, input.schools)}`
        : turn.content,
  }));
  const messages: OpenAI.ChatCompletionMessageParam[] = [systemPrompt(PARSE_PROMPT, locale), ...history];

  try {
    const first = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages,
      tools: [SEARCH_TOOL, COMPARE_TOOL],
      tool_choice: "auto",
    });

    const choice = first.choices[0]?.message;
    const toolCalls = choice?.tool_calls ?? [];
    if (!choice || toolCalls.length === 0) {
      const userText = latestUserText(dialogue);
      const recovered = asksForSchools(userText) ? areaFromUserText(userText, {}) : null;
      const ranked = rankScope(applyPriceRank(recovered ?? {}, userText), userText, dialogue, input.schools);
      if (!recovered && !ranked.filters.priceRank) {
        return { reply: textOrFallback(choice?.content, locale), schools: [], comparison: null };
      }
      const outcome = await toolPayload(ranked.filters, ranked.schools, locale, ranked.withinShown);
      const placeLine = recovered
        ? `\nМесто пользователя — только область с id «${recovered.area}». Опечатка вроде «не севере» означает «на севере», то есть north. Не описывай это место любой другой стороной света.`
        : "";
      const second = await client.chat.completions.create({
        model,
        temperature: 0.2,
        messages: [
          systemPrompt(REPLY_PROMPT, locale),
          ...history,
          {
            role: "system",
            content: `JSON результата поиска:\n${JSON.stringify(outcome.payload)}${placeLine}`,
          },
        ],
      });
      return {
        reply: textOrFallback(second.choices[0]?.message.content, locale),
        schools: outcome.selected,
        comparison: null,
      };
    }

    let selected: AssistantSchool[] = [];
    let comparison: AssistantSchool[] | null = null;
    const toolMessages: OpenAI.ChatCompletionMessageParam[] = [];
    for (const call of toolCalls) {
      if (call.type !== "function") {
        toolMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({ error: "unknown_tool" }),
        });
        continue;
      }
      if (call.function.name === "compare_schools") {
        const outcome = await comparePayload(call.function.arguments, input.schools, locale);
        comparison = outcome.matched.length >= 2 ? outcome.matched : null;
        selected = [];
        toolMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(outcome.payload),
        });
        continue;
      }
      if (call.function.name !== "search_schools") {
        toolMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({ error: "unknown_tool" }),
        });
        continue;
      }
      const parsed = parseToolFilters(call.function.arguments);
      const userText = latestUserText(dialogue);
      const recovered = areaFromUserText(userText, parsed);
      const ranked = rankScope(applyPriceRank(recovered ?? parsed, userText), userText, dialogue, input.schools);
      const outcome = await toolPayload(ranked.filters, ranked.schools, locale, ranked.withinShown);
      if (!comparison) selected = outcome.selected;
      toolMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(outcome.payload),
      });
    }

    const userText = latestUserText(dialogue);
    const place = resolveDistrictId(userText) ? null : resolveArea(userText);
    const placeNote: OpenAI.ChatCompletionMessageParam | null = place
      ? {
          role: "system",
          content: `Место пользователя — только область с id «${place.id}». Опечатка вроде «не севере» означает «на севере», то есть north. Не описывай это место любой другой стороной света.`,
        }
      : null;
    const second = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        systemPrompt(REPLY_PROMPT, locale),
        ...history,
        choice,
        ...toolMessages,
        ...(placeNote ? [placeNote] : []),
      ],
    });

    const reply = textOrFallback(second.choices[0]?.message.content, locale);
    return {
      reply: place && !comparison ? correctPlaceReply(reply, place, selected.length, locale) : reply,
      schools: comparison ? [] : selected,
      comparison,
    };
  } catch (error) {
    if (error instanceof AssistantConfigError || error instanceof AssistantProviderError) throw error;
    if (error instanceof APIError) {
      console.error("[assistant] openai status", error.status);
      if (error.status === 401 || error.status === 403) throw new AssistantConfigError();
    } else {
      console.error("[assistant] request failed");
    }
    throw new AssistantProviderError();
  }
}
