import { useState, type FormEvent } from "react";
import { parseInstructionLanguages, type InstructionLanguage } from "../../admin/languages";
import type { CostStatus } from "../../types";
import { suggestSlug } from "../../admin/slug";
import {
  ADMIN_LOCALES,
  blankTranslations,
  schoolLabel,
  type AdminFieldErrors,
  type AdminLocale,
  type AdminSchool,
} from "../../admin/types";
import { validateSchoolInput } from "../../admin/validate";
import LanguageSelect from "./LanguageSelect";

type SchoolFormProps = {
  school: AdminSchool | null;
  notice: string;
  onSaved: (school: AdminSchool, savedNotice?: string) => void;
  onEdit: () => void;
  onBack: () => void;
  onUnauthorized: () => void;
};

const fieldClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function SchoolForm({
  school,
  notice,
  onSaved,
  onEdit,
  onBack,
  onUnauthorized,
}: SchoolFormProps) {
  const [slug, setSlug] = useState(school?.slug ?? "");
  const [address, setAddress] = useState(school?.address ?? "");
  const [languages, setLanguages] = useState<InstructionLanguage[]>(
    parseInstructionLanguages(school?.languages ?? "")
  );
  const [website, setWebsite] = useState(school?.website ?? "");
  const [cost, setCost] = useState(school?.cost ?? "");
  const [costStatus, setCostStatus] = useState<CostStatus>(school?.costStatus ?? "unknown");
  const [program, setProgram] = useState(school?.program ?? "");
  const [translations, setTranslations] = useState(school?.translations ?? blankTranslations());
  const [nameLocale, setNameLocale] = useState<AdminLocale>(school?.nameLocale ?? "en");
  const [tab, setTab] = useState<AdminLocale>("ru");
  const [errors, setErrors] = useState<AdminFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function touch() {
    onEdit();
  }

  function applyNameSlug() {
    const next = suggestSlug(ADMIN_LOCALES.map((locale) => translations[locale].name));
    if (next === "school" && !ADMIN_LOCALES.some((locale) => translations[locale].name.trim())) {
      setErrors((current) => ({ ...current, slug: "Сначала укажите название" }));
      return;
    }
    setSlug(next);
    setErrors((current) => ({ ...current, slug: undefined }));
    touch();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const payload = {
      slug,
      address,
      languages,
      website,
      cost,
      costStatus,
      program,
      nameLocale,
      translations,
    };
    const parsed = validateSchoolInput(payload);
    if (parsed.ok === false) {
      setErrors(parsed.fields);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const response = await fetch(school ? `/api/admin/schools/${school.id}` : "/api/admin/schools", {
        method: school ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.value),
      });
      if (response.status === 401) {
        onUnauthorized();
        return;
      }
      const body = (await response.json().catch(() => null)) as
        | (AdminSchool & { fields?: AdminFieldErrors; geocodeWarning?: boolean; translationWarning?: boolean })
        | null;
      if (response.status === 400 && body?.fields) {
        setErrors(body.fields);
        return;
      }
      if (!response.ok || !body || typeof body.id !== "string") {
        setFormError("Не удалось сохранить");
        return;
      }
      const { geocodeWarning, translationWarning, ...saved } = body;
      const warnings = [
        geocodeWarning ? "Точку на карте по этому адресу найти не удалось." : "",
        translationWarning ? "Не удалось перевести название на все языки." : "",
      ].filter(Boolean);
      const savedNotice = warnings.length > 0 ? `Сохранено. ${warnings.join(" ")}` : undefined;
      onSaved(saved, savedNotice);
    } catch {
      setFormError("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  const current = translations[tab];
  const noticeIsWarning = notice.includes("не удалось");

  return (
    <form onSubmit={onSubmit} className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
        <div className="max-w-3xl">
          <button
            type="button"
            onClick={onBack}
            className="md:hidden mb-3 text-sm text-indigo-600 hover:text-indigo-800"
          >
            К списку
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {school ? schoolLabel({ slug: school.slug, translations, nameLocale }) : "Новая школа"}
          </h2>

          <div className="mt-5">
            <p className="text-sm font-medium text-gray-700">
              Название <span className="text-red-600">*</span>
            </p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ADMIN_LOCALES.map((locale) => (
                <div key={locale}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label htmlFor={`school-name-${locale}`} className="text-xs font-medium text-gray-500">
                      {locale.toUpperCase()}
                    </label>
                    <label className="flex items-center gap-1 text-xs text-gray-500">
                      <input
                        type="radio"
                        name="school-name-locale"
                        checked={nameLocale === locale}
                        onChange={() => {
                          setNameLocale(locale);
                          touch();
                        }}
                      />
                      Основное
                    </label>
                  </div>
                  <input
                    id={`school-name-${locale}`}
                    value={translations[locale].name}
                    onChange={(event) => {
                      const name = event.target.value;
                      setTranslations((prev) => ({
                        ...prev,
                        [locale]: { ...prev[locale], name },
                      }));
                      touch();
                    }}
                    className={fieldClass}
                  />
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Отметьте основное написание. При создании пустые языки заполнятся переводом в момент сохранения.
            </p>
            {errors.names && <p className="mt-1 text-sm text-red-600">{errors.names}</p>}
          </div>

          <div className="mt-4">
            <label htmlFor="school-address" className="block text-sm font-medium text-gray-700 mb-1">
              Адрес <span className="text-red-600">*</span>
            </label>
            <input
              id="school-address"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                touch();
              }}
              className={fieldClass}
            />
            <p className="mt-1 text-xs text-gray-500">Координаты на карте подставятся по адресу.</p>
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
          </div>

          <div className="mt-4">
            <label htmlFor="school-website" className="block text-sm font-medium text-gray-700 mb-1">
              Веб-сайт
            </label>
            <input
              id="school-website"
              value={website}
              placeholder="school.ge"
              onChange={(event) => {
                setWebsite(event.target.value);
                touch();
              }}
              className={fieldClass}
            />
            {errors.website && <p className="mt-1 text-sm text-red-600">{errors.website}</p>}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-1">Языки обучения</p>
              <LanguageSelect
                value={languages}
                onChange={(next) => {
                  setLanguages(next);
                  touch();
                }}
              />
            </div>
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-1">Стоимость</p>
              <div className="mb-2 flex flex-col gap-1">
                {(
                  [
                    ["official", "Официальная"],
                    ["approximate", "Ориентировочная"],
                    ["unknown", "Нет информации"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="school-cost-status"
                      checked={costStatus === value}
                      onChange={() => {
                        setCostStatus(value);
                        touch();
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <input
                id="school-cost"
                value={cost}
                disabled={costStatus === "unknown"}
                onChange={(event) => {
                  setCost(event.target.value);
                  touch();
                }}
                className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400`}
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="school-program" className="block text-sm font-medium text-gray-700 mb-1">
              Программа
            </label>
            <input
              id="school-program"
              value={program}
              onChange={(event) => {
                setProgram(event.target.value);
                touch();
              }}
              className={fieldClass}
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 mb-1">
              <label htmlFor="school-slug" className="text-sm font-medium text-gray-700">
                Адрес страницы
              </label>
              <button
                type="button"
                onClick={applyNameSlug}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                из названия
              </button>
            </div>
            <input
              id="school-slug"
              value={slug}
              spellCheck={false}
              onChange={(event) => {
                setSlug(event.target.value);
                touch();
              }}
              className={fieldClass}
            />
            <p className="mt-1 text-xs text-gray-500">
              Если оставить пустым, адрес страницы соберётся из названия. Смена адреса меняет публичную ссылку.
            </p>
            {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Описание</p>
            <div role="tablist" className="flex gap-1 border-b border-gray-200">
              {ADMIN_LOCALES.map((locale) => (
                <button
                  key={locale}
                  type="button"
                  role="tab"
                  aria-selected={tab === locale}
                  onClick={() => setTab(locale)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                    tab === locale
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {locale.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="mt-4" role="tabpanel">
              <label htmlFor="school-description" className="block text-sm font-medium text-gray-700 mb-1">
                {tab.toUpperCase()}
              </label>
              <textarea
                id="school-description"
                rows={8}
                value={current.description}
                onChange={(event) => {
                  const description = event.target.value;
                  setTranslations((prev) => ({
                    ...prev,
                    [tab]: { ...prev[tab], description },
                  }));
                  touch();
                }}
                className={fieldClass}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 md:px-8 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
        {notice && (
          <p className={`text-sm ${noticeIsWarning ? "text-amber-700" : "text-green-700"}`}>{notice}</p>
        )}
        {formError && <p className="text-sm text-red-600">{formError}</p>}
      </div>
    </form>
  );
}
