import OpenAI, { APIError } from "openai";
import { primarySchoolName } from "../hooks/useSchoolTranslations";
import { costStatusOf } from "./cost";
import { resolveArea, resolveDistrictId, type AreaMatch } from "./districts";
import type { School } from "../types";
import {
  compareSchools,
  districtLabels,
  searchSchools,
  type AssistantSchool,
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

const SYSTEM_PROMPT = `You help people choose a school from a Tbilisi directory.
When the user asks to find, filter, narrow, or compare schools, call search_schools.
Do not call it for greetings or questions about what you can do.
Every argument you set is required together. On a follow-up, repeat constraints the user has not cancelled and add the new ones. A new place replaces the previous district or area; do not keep both.
languages: include a code only when the school must teach in that language. English-language means ["EN"]; a school listed as EN/GE matches EN.
program: a short curriculum keyword such as IB, British, American, national, German, Finnish, private, or alternative.
district: one of saburtalo, vake, mtatsminda, krtsanisi, isani, samgori, chughureti, didube, nadzaladevi, gldani. Old Tbilisi is mtatsminda.
area: north, south, center, west, east, rightBank, or leftBank when the user names a rough part of the city instead of one district. "на севере", "северная часть", and the typo "не севере" are north. Center is Mtatsminda and Chughureti, not Vake or Saburtalo. Never set district and area in the same call. Never answer that a compass direction is unmapped: call search_schools with area.
Other misspellings are not guesses. If a curriculum, language, district, or school name looks misspelled, ask whether that is what the user meant and do not search until they confirm. When they confirm, search with the confirmed spelling.
price: set minPrice and/or maxPrice only when the user states a budget. Use period "month" only if they said per month, otherwise "year". Do not convert between currencies.
After the tool result, reply in the language of the user's latest message. If that language is unclear, use the UI locale.
Never invent a school, price, or program.
When schools is not empty, write a short summary of the whole set in two to four sentences. The interface already shows a card for every school, so do not name schools and do not use a numbered or bulleted list.
In that summary, say how the set breaks down: schools that teach in one language versus bilingual pairs such as RU/EN and GE/EN, the spread of prices as written in the catalog (do not convert currencies), and which programs appear.
If the tool result includes area, say which districts were searched, listing every entry in area.districts even when some have no matching school. Those districts are inside the requested area. Schools in outsideDistrict lie outside the mapped polygons; do not describe area.districts as outside.
costStatus is official, approximate, or unknown. unknown means the catalog has no price; do not invent one. When you mention prices, say whether they are official or approximate.
When the user asks to compare specific schools, call compare_schools instead of search_schools. Pass 2 to 4 names or slugs. Slugs from earlier "Shown school slugs" lines are valid. Never pass more than 4. If they ask to compare a longer list without naming which ones, ask them to choose up to 4. If 2 to 4 schools were shown and they say to compare those, pass their slugs.
After compare_schools, write one or two sentences about the main differences. The interface renders the comparison table (languages, program, price, district, address, website), so do not draw a table and do not repeat every cell.
If compare_schools reports missing names, say those schools were not found. If fewer than two schools matched, do not pretend a comparison happened.
If priceUncertain is true for any school, say once that some catalog prices could not be compared strictly. Do not repeat it per school.
If outsideDistrict is not empty, you may mention that some otherwise matching schools lie outside the mapped Tbilisi districts, without naming them as matches.
If schools is empty, say nothing matched and suggest relaxing a condition.
If the tool returns no_constraints, ask which language, curriculum, district, or budget matters. Do not list schools.
If the tool returns unknown_district, say that place is not one of the ten mapped Tbilisi districts or a known area such as north, center, or a river bank.`;

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
      "Filter the catalog. Every field you set is required together. Omit a field the user did not constrain.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        languages: {
          type: "array",
          items: { type: "string", enum: ["GE", "EN", "RU", "DE", "FR"] },
          description: 'Languages the school must include. English-language schools are ["EN"].',
        },
        program: {
          type: "string",
          description:
            "Curriculum keyword: IB, British, American, national, German, Finnish, private, alternative.",
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
          description: "One Tbilisi district id. Saburtalo, Сабуртало, and საბურთალო are saburtalo. Old Tbilisi is mtatsminda.",
        },
        area: {
          type: "string",
          enum: ["north", "south", "center", "west", "east", "rightBank", "leftBank"],
          description:
            "A rough part of the city, not a district. north: Gldani, Nadzaladevi, Didube. south: Krtsanisi. center: Mtatsminda and Chughureti. west: Vake and Saburtalo. east: Isani and Samgori. rightBank: Saburtalo, Vake, Mtatsminda, Didube, Nadzaladevi. leftBank: Chughureti, Isani, Samgori, Krtsanisi, Gldani.",
        },
        minPrice: PRICE_SCHEMA,
        maxPrice: PRICE_SCHEMA,
      },
    },
  },
};

const COMPARE_TOOL: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "compare_schools",
    description: "Compare 2 to 4 catalog schools by their stored fields. Pass names or slugs.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        schools: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
          description: "Two to four school names or slugs. Extra items are ignored.",
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
    !filters.maxPrice
  );
}

function toolPayload(
  filters: SchoolSearchFilters,
  schools: School[],
  locale: UiLang
): { payload: unknown; selected: AssistantSchool[] } {
  if (filtersAreEmpty(filters)) {
    return {
      payload: {
        error: "no_constraints",
        hint: "Ask which language, curriculum, district, or budget matters. Do not list schools.",
      },
      selected: [],
    };
  }

  const result = searchSchools(schools, filters);
  if (result.unknownDistrict) {
    return {
      payload: {
        error: "unknown_district",
        hint: "This place is not one of the ten mapped Tbilisi districts or a known area (north, south, center, west, east, rightBank, leftBank).",
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
        languages: match.school.languages,
        cost: costStatusOf(match.school) === "unknown" ? null : match.school.cost ?? null,
        costStatus: costStatusOf(match.school),
        program: match.school.program ?? null,
        address: match.school.address,
        district: match.school.district,
        districtNames: match.school.district ? districtLabels(match.school.district) : null,
        priceUncertain: match.priceUncertain,
      })),
      outsideDistrict: result.outsideDistrict.map((school) => ({
        name: primarySchoolName(school),
        address: school.address,
        languages: school.languages,
        program: school.program ?? null,
      })),
      replyHint: result.area
        ? `Cards will list each school. Reply with a short summary only. This search is exactly area id "${result.area.id}" (${result.area.districts.map((id) => districtLabels(id)[locale]).join(", ")}). In Russian, north is север, south is юг, center is центр, west is запад, east is восток. Use only the direction that matches this area id. Mention each district. outsideDistrict schools are outside the mapped polygons. Also cover single-language versus bilingual (RU/EN, GE/EN), price spread, and programs. Do not name schools or make a list.`
        : "Cards will list each school. Reply with a short summary only: single-language versus bilingual (RU/EN, GE/EN), price spread, and programs. Do not name schools or make a list.",
    },
  };
}

function describeSchool(school: AssistantSchool, locale: UiLang) {
  return {
    slug: school.slug,
    name: primarySchoolName(school),
    languages: school.languages,
    cost: costStatusOf(school) === "unknown" ? null : school.cost ?? null,
    costStatus: costStatusOf(school),
    program: school.program ?? null,
    address: school.address,
    website: school.website ?? null,
    district: school.district,
    districtNames: school.district ? districtLabels(school.district) : null,
  };
}

function comparePayload(
  raw: string,
  schools: School[],
  locale: UiLang
): { payload: unknown; matched: AssistantSchool[] } {
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
        hint: "A comparison needs at least two catalog schools. Say which names were not found.",
      },
    };
  }
  return {
    matched: result.matched,
    payload: {
      truncated: result.truncated,
      missing: result.missing,
      schools: result.matched.map((school) => describeSchool(school, locale)),
      replyHint:
        "The UI renders a comparison table for these schools: languages, program, price, district, address, website. Write one or two sentences on the main differences. Do not draw a table or repeat every cell. If truncated is true, say only four schools can be compared.",
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
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new AssistantConfigError();

  const locale = normalizeUiLanguage(input.locale);
  const prepared = prepareTurns(input.messages, input.schools, locale);
  if (prepared.reply) return { reply: prepared.reply, schools: [], comparison: null };
  const dialogue = prepared.messages;
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const client = new OpenAI({ apiKey, timeout: 25_000, maxRetries: 0 });
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: `${SYSTEM_PROMPT}\nUI locale: ${locale}.` },
    ...dialogue.map((turn) => ({
      role: turn.role,
      content:
        turn.role === "assistant" && turn.shown?.length
          ? `${turn.content}\n\nShown school slugs: ${turn.shown.join(", ")}`
          : turn.content,
    })),
  ];

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
      if (!recovered) {
        return { reply: textOrFallback(choice?.content, locale), schools: [], comparison: null };
      }
      const outcome = toolPayload(recovered, input.schools, locale);
      const second = await client.chat.completions.create({
        model,
        temperature: 0.2,
        messages: [
          ...messages,
          {
            role: "system",
            content: `Search result JSON:\n${JSON.stringify(outcome.payload)}\nThe user place is only area id "${recovered.area}". A misspelling like "не севере" means "на севере", which is north. Do not describe this place as any other compass direction.`,
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
        const outcome = comparePayload(call.function.arguments, input.schools, locale);
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
      const recovered = areaFromUserText(latestUserText(dialogue), parsed);
      const outcome = toolPayload(recovered ?? parsed, input.schools, locale);
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
          content: `The user place is only area id "${place.id}". A misspelling like "не севере" means "на севере", which is north. Do not describe this place as any other compass direction.`,
        }
      : null;
    const second = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [...messages, choice, ...toolMessages, ...(placeNote ? [placeNote] : [])],
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
