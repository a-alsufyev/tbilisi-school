import { FormEvent, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, CreditCard, Languages, Loader2, MapPin, Send, Trash2 } from "lucide-react";
import { formatInstructionLanguagesLabel } from "../admin/languages";
import { joinLookupLabels } from "../lib/lookups";
import { primarySchoolName } from "../hooks/useSchoolTranslations";
import { clearDialogue, getDialogue, sendDialogueMessage, setDialogueDraft, subscribeDialogue } from "../lib/assistant-session";
import { formatSchoolCost } from "../lib/cost";
import { externalHref } from "../lib/website";
import type { School } from "../types";

function SchoolCards({
  schools,
  selectedIds,
  onToggle,
}: {
  schools: School[];
  selectedIds: ReadonlySet<string>;
  onToggle: (school: School) => void;
}) {
  const { t } = useTranslation();
  const { lang } = useParams();
  const prefix = `/${lang ?? "en"}`;
  const languageLabel = (value: string) => formatInstructionLanguagesLabel(value, t("map.bilingual"));
  if (schools.length === 0) return null;

  return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {schools.map((school) => {
        const name = primarySchoolName(school);
        const checked = selectedIds.has(school.id);
        return (
          <div
            key={school.id}
            className={`relative isolate h-full rounded-lg border bg-white transition-colors ${checked ? "border-indigo-400" : "border-gray-200 hover:border-indigo-300"}`}
          >
            <label className="absolute right-2 top-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md hover:bg-indigo-50">
              <input
                type="checkbox"
                checked={checked}
                aria-label={t("assistant.compareToggle", { school: name })}
                onChange={() => onToggle(school)}
                className="h-4 w-4 accent-indigo-600"
              />
            </label>
            <Link
              to={`${prefix}/schools/${school.slug}?from=assistant`}
              className="block h-full px-3 py-2.5 pr-10"
            >
            <h3 className="text-sm font-semibold leading-snug text-gray-900">{name}</h3>
            <div className="mt-1.5 space-y-1 text-xs text-gray-600">
              {school.district && (
                <p className="flex items-center gap-1.5 text-indigo-600">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{t(`assistant.districts.${school.district}`)}</span>
                </p>
              )}
              <p className="flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span>{languageLabel(school.languages) || "—"}</span>
              </p>
              {(
                [
                  ["catalog.program", school.programs],
                  ["catalog.internationalStatus", school.internationalStatuses],
                  ["catalog.accreditation", school.accreditations],
                ] as const
              ).map(([key, labels]) => (
                <p key={key} className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span>
                    {t(key)}: {joinLookupLabels(labels) || "—"}
                  </span>
                </p>
              ))}
              <p className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span>
                  {formatSchoolCost(
                    school,
                    {
                      official: t("catalog.costOfficial"),
                      approximate: t("catalog.costApproximate"),
                      unknown: t("catalog.costUnknown"),
                    },
                    (status, year) => t("catalog.costStatusYear", { status, year }),
                    { month: t("catalog.perMonth"), year: t("catalog.perYear") },
                    { from: t("catalog.costFrom"), to: t("catalog.costTo") }
                  )}
                </span>
              </p>
            </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function ComparisonTable({ schools }: { schools: School[] }) {
  const { t } = useTranslation();
  const { lang } = useParams();
  const prefix = `/${lang ?? "en"}`;
  const rows: { label: string; cell: (school: School) => string }[] = [
    {
      label: t("map.languages"),
      cell: (school) => formatInstructionLanguagesLabel(school.languages, t("map.bilingual")) || "—",
    },
    { label: t("catalog.program"), cell: (school) => joinLookupLabels(school.programs) || "—" },
    { label: t("catalog.internationalStatus"), cell: (school) => joinLookupLabels(school.internationalStatuses) || "—" },
    { label: t("catalog.accreditation"), cell: (school) => joinLookupLabels(school.accreditations) || "—" },
    {
      label: t("catalog.cost"),
      cell: (school) =>
        formatSchoolCost(
          school,
          {
            official: t("catalog.costOfficial"),
            approximate: t("catalog.costApproximate"),
            unknown: t("catalog.costUnknown"),
          },
          (status, year) => t("catalog.costStatusYear", { status, year }),
          { month: t("catalog.perMonth"), year: t("catalog.perYear") },
          { from: t("catalog.costFrom"), to: t("catalog.costTo") }
        ),
    },
    {
      label: t("assistant.district"),
      cell: (school) => (school.district ? t(`assistant.districts.${school.district}`) : "—"),
    },
    { label: t("map.address"), cell: (school) => school.address || "—" },
  ];

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="sticky left-0 bg-white px-3 py-2 text-xs font-medium text-gray-500">
              {t("assistant.parameter")}
            </th>
            {schools.map((school) => (
              <th key={school.id} className="min-w-40 bg-white px-3 py-2 align-bottom font-semibold text-gray-900">
                <Link
                  to={`${prefix}/schools/${school.slug}?from=assistant`}
                  className="text-indigo-700 hover:underline"
                >
                  {primarySchoolName(school)}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-gray-100">
              <th className="sticky left-0 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">{row.label}</th>
              {schools.map((school) => (
                <td key={school.id} className="px-3 py-2 align-top text-gray-800">
                  {row.cell(school)}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <th className="sticky left-0 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
              {t("catalog.website")}
            </th>
            {schools.map((school) => {
              const href = school.website ? externalHref(school.website) : null;
              return (
                <td key={school.id} className="px-3 py-2 align-top text-gray-800">
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer" className="break-all text-indigo-700 hover:underline">
                      {school.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function AssistantPage() {
  const { t } = useTranslation();
  const { lang } = useParams();
  const { turns, draft, pending, error } = useSyncExternalStore(subscribeDialogue, getDialogue, getDialogue);
  const answerRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<HTMLDivElement>(null);
  const openedRef = useRef(true);
  const cancelClearRef = useRef<HTMLButtonElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [selected, setSelected] = useState<{ id: string; name: string }[]>([]);
  const phraseRef = useRef("");
  const selectedIds = useMemo(() => new Set(selected.map((school) => school.id)), [selected]);

  const applyComparePhrase = (next: { id: string; name: string }[]) => {
    const phrase = next.length === 0 ? "" : t("assistant.compareDraft", { schools: next.map((school) => school.name).join(", ") });
    const current = getDialogue().draft;
    const previous = phraseRef.current;
    let nextDraft = phrase;
    if (current.trim() !== "" && current.trim() !== previous) {
      if (previous && current.includes(previous)) {
        nextDraft = current.replace(previous, phrase).replace(/\n{3,}/g, "\n\n").trim();
      } else if (phrase) {
        nextDraft = `${current.trim()}\n${phrase}`;
      } else {
        nextDraft = current;
      }
    }
    phraseRef.current = phrase;
    setSelected(next);
    setDialogueDraft(nextDraft);
  };

  const toggleCompared = (school: School) => {
    const name = primarySchoolName(school);
    const next = selected.some((item) => item.id === school.id)
      ? selected.filter((item) => item.id !== school.id)
      : [...selected, { id: school.id, name }];
    applyComparePhrase(next);
  };

  useEffect(() => {
    const behavior = openedRef.current ? "auto" : "smooth";
    openedRef.current = false;
    const last = turns[turns.length - 1];
    if (last?.role === "assistant") {
      answerRef.current?.scrollIntoView({ behavior, block: "start" });
      return;
    }
    if (pending) {
      pendingRef.current?.scrollIntoView({ behavior, block: "nearest" });
    }
  }, [turns, pending]);

  useEffect(() => {
    if (!confirmClear) return;
    cancelClearRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirmClear(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmClear]);

  const send = (event: FormEvent) => {
    event.preventDefault();
    phraseRef.current = "";
    setSelected([]);
    void sendDialogueMessage(lang);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl flex-col px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">{t("assistant.title")}</h1>
      <p className="mt-2 text-gray-600">{t("assistant.subtitle")}</p>

      <div className="mt-6 flex-1 space-y-4">
        {turns.map((turn, index) => (
          <div
            key={`${turn.role}-${index}`}
            ref={turn.role === "assistant" && index === turns.length - 1 ? answerRef : undefined}
            className={turn.role === "user" ? "flex justify-end" : "scroll-mt-20"}
          >
            <div
              className={
                turn.role === "user"
                  ? "max-w-[85%] rounded-2xl bg-indigo-600 px-4 py-3 text-white"
                  : "max-w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-gray-900"
              }
            >
              <p className="whitespace-pre-wrap leading-relaxed">{turn.content}</p>
              {turn.role === "assistant" && turn.comparison && turn.comparison.length >= 2 ? (
                <ComparisonTable schools={turn.comparison} />
              ) : (
                turn.role === "assistant" && turn.schools && (
                  <SchoolCards schools={turn.schools} selectedIds={selectedIds} onToggle={toggleCompared} />
                )
              )}
            </div>
          </div>
        ))}
        {pending && (
          <div ref={pendingRef} className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("assistant.thinking")}</span>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{t(error)}</p>}
      </div>

      <form onSubmit={send} className="sticky bottom-0 z-20 mt-6 flex items-stretch gap-2 bg-gray-50 py-3">
        <label htmlFor="assistant-message" className="sr-only">
          {t("assistant.placeholder")}
        </label>
        <div className="flex min-w-0 flex-1 flex-col">
          <textarea
            id="assistant-message"
            value={draft}
            rows={2}
            disabled={pending}
            placeholder={t("assistant.placeholder")}
            onChange={(event) => setDialogueDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            className="min-h-0 w-full flex-1 resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-indigo-400 disabled:opacity-60"
          />
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            disabled={!pending && turns.length === 0 && draft.length === 0 && !error}
            className="inline-flex w-full flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {t("assistant.clear")}
          </button>
          <button
            type="submit"
            disabled={pending || draft.trim().length === 0}
            className="inline-flex w-full flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {t("assistant.send")}
          </button>
        </div>
      </form>
      {confirmClear && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 px-4"
          onClick={() => setConfirmClear(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-chat-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="clear-chat-title" className="text-lg font-semibold text-gray-900">
              {t("assistant.clearConfirmTitle")}
            </h2>
            <p className="mt-2 text-sm text-gray-600">{t("assistant.clearConfirmBody")}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                ref={cancelClearRef}
                type="button"
                onClick={() => setConfirmClear(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                {t("assistant.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmClear(false);
                  phraseRef.current = "";
                  setSelected([]);
                  clearDialogue();
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                {t("assistant.clearConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
