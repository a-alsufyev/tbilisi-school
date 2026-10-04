import { isCostStatus } from "./cost";
import { isSupportedUiLang } from "./schools";
import type { School } from "../types";

const STORAGE_KEY = "tbilisi-school-assistant-dialogue";
const MAX_STORED_TURNS = 24;

export type DialogueTurn = {
  role: "user" | "assistant";
  content: string;
  schools?: School[];
  comparison?: School[];
};

type DialogueState = {
  turns: DialogueTurn[];
  draft: string;
  pending: boolean;
  error: string | null;
};

type Listener = () => void;

function asSchool(value: unknown): School | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.slug !== "string") return null;
  const names = row.names && typeof row.names === "object" ? (row.names as Record<string, unknown>) : {};
  const rawLocale = typeof row.nameLocale === "string" ? row.nameLocale : "";
  const rawCostStatus = typeof row.costStatus === "string" ? row.costStatus : "";
  const cost = typeof row.cost === "string" ? row.cost : undefined;
  return {
    id: row.id,
    slug: row.slug,
    name: typeof row.name === "string" ? row.name : "",
    nameLocale: isSupportedUiLang(rawLocale) ? rawLocale : "en",
    names: {
      en: typeof names.en === "string" ? names.en : "",
      ru: typeof names.ru === "string" ? names.ru : "",
      ge: typeof names.ge === "string" ? names.ge : "",
      de: typeof names.de === "string" ? names.de : "",
    },
    address: typeof row.address === "string" ? row.address : "",
    coordinates: typeof row.coordinates === "string" ? row.coordinates : "",
    languages: typeof row.languages === "string" ? row.languages : "",
    website: typeof row.website === "string" ? row.website : undefined,
    cost,
    costStatus: isCostStatus(rawCostStatus) ? rawCostStatus : cost ? "approximate" : "unknown",
    program: typeof row.program === "string" ? row.program : undefined,
    comment: typeof row.comment === "string" ? row.comment : undefined,
    district: typeof row.district === "string" ? row.district : row.district === null ? null : undefined,
  };
}

function asSchools(value: unknown): School[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const schools = value.map(asSchool).filter((school): school is School => school !== null);
  return schools;
}

function asTurn(value: unknown): DialogueTurn | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if ((row.role !== "user" && row.role !== "assistant") || typeof row.content !== "string") return null;
  const turn: DialogueTurn = { role: row.role, content: row.content.slice(0, 4000) };
  const schools = asSchools(row.schools);
  const comparison = asSchools(row.comparison);
  if (schools && schools.length > 0) turn.schools = schools;
  if (comparison && comparison.length >= 2) turn.comparison = comparison.slice(0, 4);
  return turn;
}

function load(): DialogueState {
  const blank: DialogueState = { turns: [], draft: "", pending: false, error: null };
  if (typeof sessionStorage === "undefined") return blank;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return blank;
    const parsed = JSON.parse(raw) as { turns?: unknown; draft?: unknown; error?: unknown };
    const turns = Array.isArray(parsed.turns) ? parsed.turns.map(asTurn).filter((turn): turn is DialogueTurn => turn !== null) : [];
    return {
      turns: turns.slice(-MAX_STORED_TURNS),
      draft: typeof parsed.draft === "string" ? parsed.draft.slice(0, 4000) : "",
      pending: false,
      error: typeof parsed.error === "string" ? parsed.error : null,
    };
  } catch {
    return blank;
  }
}

function persist(current: DialogueState) {
  if (typeof sessionStorage === "undefined") return;
  try {
    const inFlight = current.pending && current.turns.at(-1)?.role === "user";
    const turns = inFlight ? current.turns.slice(0, -1) : current.turns;
    const draft = inFlight ? (current.turns.at(-1)?.content ?? current.draft) : current.draft;
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        turns: turns.slice(-MAX_STORED_TURNS),
        draft,
        error: current.error,
      }),
    );
  } catch {
    // The tab can keep the dialogue in memory when storage is unavailable.
  }
}

let state: DialogueState = load();
let requestId = 0;
const listeners = new Set<Listener>();

function emit() {
  persist(state);
  for (const listener of listeners) listener();
}

export function subscribeDialogue(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDialogue() {
  return state;
}

export function setDialogueDraft(draft: string) {
  if (state.draft === draft) return;
  state = { ...state, draft };
  emit();
}

export function clearDialogue() {
  requestId += 1;
  state = { turns: [], draft: "", pending: false, error: null };
  emit();
}

function errorKey(status: number, code: unknown): string {
  if (status === 503 || code === "assistant_unavailable") return "assistant.unavailable";
  if (status === 429 || code === "rate_limited") return "assistant.rateLimited";
  if (status === 400) return "assistant.invalid";
  return "assistant.error";
}

export async function sendDialogueMessage(locale: string | undefined) {
  const text = state.draft.trim();
  if (!text || state.pending) return;
  const id = ++requestId;

  const history = [
    ...state.turns.map((turn) => ({
      role: turn.role,
      content: turn.content,
      shown: (turn.comparison?.length ? turn.comparison : turn.schools)?.map((school) => school.slug),
    })),
    { role: "user" as const, content: text },
  ].slice(-12);

  state = {
    ...state,
    turns: [...state.turns, { role: "user", content: text }],
    draft: "",
    error: null,
    pending: true,
  };
  emit();

  try {
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, messages: history }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      reply?: string;
      schools?: School[];
      comparison?: School[] | null;
      error?: string;
    };
    if (id !== requestId) return;
    if (!response.ok || typeof data.reply !== "string") {
      state = {
        ...state,
        turns: state.turns.slice(0, -1),
        draft: state.draft || text,
        error: errorKey(response.status, data.error),
        pending: false,
      };
      emit();
      return;
    }
    if (id !== requestId) return;
    const schools = asSchools(data.schools) ?? [];
    const comparison = asSchools(data.comparison);
    state = {
      ...state,
      turns: [
        ...state.turns,
        {
          role: "assistant",
          content: data.reply,
          schools,
          comparison: comparison && comparison.length >= 2 ? comparison.slice(0, 4) : undefined,
        },
      ],
      pending: false,
    };
    emit();
  } catch {
    if (id !== requestId) return;
    state = {
      ...state,
      turns: state.turns.slice(0, -1),
      draft: state.draft || text,
      error: "assistant.error",
      pending: false,
    };
    emit();
  }
}
