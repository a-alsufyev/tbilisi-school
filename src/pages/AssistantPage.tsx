import { FormEvent, useEffect, useRef, useSyncExternalStore } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, CreditCard, Languages, Loader2, MapPin, Send, Trash2 } from "lucide-react";
import { primarySchoolName } from "../hooks/useSchoolTranslations";
import { clearDialogue, getDialogue, sendDialogueMessage, setDialogueDraft, subscribeDialogue } from "../lib/assistant-session";
import { formatSchoolCost } from "../lib/cost";
import { externalHref } from "../lib/website";
import type { School } from "../types";

function SchoolCards({ schools }: { schools: School[] }) {
  const { t } = useTranslation();
  const { lang } = useParams();
  const prefix = `/${lang ?? "en"}`;
  if (schools.length === 0) return null;

  return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {schools.map((school) => {
        const name = primarySchoolName(school);
        return (
          <Link
            key={school.id}
            to={`${prefix}/schools/${school.slug}`}
            className="block h-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 transition-colors hover:border-indigo-300"
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
                <span>{school.languages}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span>{school.program || "—"}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span>
                  {formatSchoolCost(school, {
                    official: t("catalog.costOfficial"),
                    approximate: t("catalog.costApproximate"),
                    unknown: t("catalog.costUnknown"),
                  })}
                </span>
              </p>
            </div>
          </Link>
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
    { label: t("map.languages"), cell: (school) => school.languages || "—" },
    { label: t("catalog.program"), cell: (school) => school.program || "—" },
    {
      label: t("catalog.cost"),
      cell: (school) =>
        formatSchoolCost(school, {
          official: t("catalog.costOfficial"),
          approximate: t("catalog.costApproximate"),
          unknown: t("catalog.costUnknown"),
        }),
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
                <Link to={`${prefix}/schools/${school.slug}`} className="text-indigo-700 hover:underline">
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

  const send = (event: FormEvent) => {
    event.preventDefault();
    void sendDialogueMessage(lang);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl flex-col px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">{t("assistant.title")}</h1>
        <button
          type="button"
          onClick={clearDialogue}
          disabled={!pending && turns.length === 0 && draft.length === 0 && !error}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {t("assistant.clear")}
        </button>
      </div>
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
                turn.role === "assistant" && turn.schools && <SchoolCards schools={turn.schools} />
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

      <form onSubmit={send} className="sticky bottom-0 mt-6 flex gap-2 bg-gray-50 py-3">
        <label htmlFor="assistant-message" className="sr-only">
          {t("assistant.placeholder")}
        </label>
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
          className="min-h-14 flex-1 resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-indigo-400 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || draft.trim().length === 0}
          className="inline-flex items-center gap-2 self-end rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {t("assistant.send")}
        </button>
      </form>
    </div>
  );
}
