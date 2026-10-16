import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { catalogHref } from "../../lib/home";
import { sendDialogueMessage, setDialogueDraft } from "../../lib/assistant-session";
import CityScheme from "./CityScheme";
import type { School } from "../../types";

type Mode = "ai" | "name";

export default function Hero({ prefix, lang, schools }: { prefix: string; lang: string; schools: School[] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("ai");
  const [value, setValue] = useState("");

  const askAssistant = (text: string) => {
    const question = text.trim();
    if (!question) {
      navigate(`${prefix}/assistant`);
      return;
    }
    setDialogueDraft(question);
    void sendDialogueMessage(lang);
    navigate(`${prefix}/assistant`);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === "ai") askAssistant(value);
    else navigate(catalogHref(prefix, { q: value.trim() }));
  };

  const examples = [t("home.assistantExample1"), t("home.assistantExample2"), t("home.assistantExample3")];
  const modeClass = (active: boolean) =>
    `px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
      active ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
    }`;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-gray-50">
      <div aria-hidden className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-indigo-200/40 blur-3xl" />
      <div aria-hidden className="absolute top-10 right-0 w-80 h-80 rounded-full bg-amber-200/30 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 grid lg:grid-cols-5 gap-12 items-center">
        <div className="lg:col-span-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-indigo-100 text-sm font-medium text-indigo-700 shadow-sm">
            <Sparkles className="w-4 h-4" />
            {t("nav.assistant")}
          </span>
          <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.05]">
            {t("home.heroTitle")}
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-xl">{t("home.heroSubtitle")}</p>

          <form onSubmit={submit} className="mt-8 max-w-2xl">
            <div className="inline-flex p-1 rounded-full bg-gray-100 mb-3">
              <button type="button" className={modeClass(mode === "ai")} onClick={() => setMode("ai")}>
                {t("home.modeAi")}
              </button>
              <button type="button" className={modeClass(mode === "name")} onClick={() => setMode("name")}>
                {t("home.modeName")}
              </button>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-gray-200 shadow-lg shadow-indigo-100/60 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 transition">
              {mode === "ai" ? (
                <Sparkles className="w-5 h-5 text-indigo-500 ml-3 shrink-0" />
              ) : (
                <Search className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
              )}
              <input
                type="text"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={mode === "ai" ? t("home.aiPlaceholder") : t("home.searchPlaceholder")}
                aria-label={mode === "ai" ? t("home.aiPlaceholder") : t("home.searchPlaceholder")}
                className="flex-1 min-w-0 py-3 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                <span className="hidden sm:inline">{mode === "ai" ? t("home.aiSend") : t("home.search")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {mode === "ai" && (
            <div className="mt-4 flex flex-wrap gap-2 max-w-2xl">
              {examples.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => askAssistant(text)}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <Link to={`${prefix}/schools`} className="text-indigo-600 hover:underline">
              {t("home.openCatalog")} →
            </Link>
            <Link to={`${prefix}/map`} className="text-indigo-600 hover:underline">
              {t("home.openFullMap")} →
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2 hidden lg:block">
          <CityScheme schools={schools} prefix={prefix} />
        </div>
      </div>
    </section>
  );
}
