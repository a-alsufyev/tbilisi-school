import { useEffect, useState } from "react";
import { ADMIN_LOCALES, schoolLabel, type AdminSchool } from "../../admin/types";
import SchoolForm from "./SchoolForm";

type AdminWorkspaceProps = {
  onLogout: () => void;
};

type Selection = null | "new" | string;

function byLabel(a: AdminSchool, b: AdminSchool): number {
  return schoolLabel(a).localeCompare(schoolLabel(b), "ru");
}

export default function AdminWorkspace({ onLogout }: AdminWorkspaceProps) {
  const [schools, setSchools] = useState<AdminSchool[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Selection>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/admin/schools");
        if (response.status === 401) {
          onLogout();
          return;
        }
        if (!response.ok) throw new Error("load failed");
        const data = (await response.json()) as AdminSchool[];
        if (!cancelled) setSchools([...data].sort(byLabel));
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [onLogout]);

  function choose(next: Selection) {
    setNotice("");
    setSelection(next);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    onLogout();
  }

  function onSaved(school: AdminSchool, savedNotice?: string) {
    setSchools((current) => {
      const list = current ?? [];
      const index = list.findIndex((item) => item.id === school.id);
      const next = index === -1 ? [...list, school] : list.map((item) => (item.id === school.id ? school : item));
      return next.sort(byLabel);
    });
    setSelection(school.id);
    setNotice(savedNotice ?? "Сохранено");
  }

  const needle = query.trim().toLowerCase();
  const visible = (schools ?? []).filter((school) => {
    if (!needle) return true;
    if (school.slug.toLowerCase().includes(needle)) return true;
    return ADMIN_LOCALES.some((locale) => school.translations[locale].name.toLowerCase().includes(needle));
  });

  const editing = selection && selection !== "new" ? (schools ?? []).find((item) => item.id === selection) ?? null : null;
  const showForm = selection === "new" || editing != null;
  const listClass = showForm
    ? "hidden md:flex flex-col min-h-0 bg-white border-gray-200 md:border-r"
    : "flex flex-1 flex-col min-h-0 bg-white border-gray-200 md:border-r";
  const formClass = showForm
    ? "flex flex-1 flex-col min-h-0 overflow-hidden"
    : "hidden md:flex md:flex-col min-h-0 items-center justify-center";

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <header className="shrink-0 h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Админка</h1>
        <button type="button" onClick={() => void logout()} className="text-sm text-gray-600 hover:text-gray-900">
          Выйти
        </button>
      </header>
      <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={listClass}>
          <div className="p-4 border-b border-gray-100">
            <button
              type="button"
              onClick={() => choose("new")}
              className={`w-full rounded-md px-3 py-2 text-sm font-medium ${
                selection === "new"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              Новая школа
            </button>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по имени или адресу страницы"
              className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {schools === null && !loadError && <p className="px-2 py-3 text-sm text-gray-500">Загрузка...</p>}
            {loadError && <p className="px-2 py-3 text-sm text-red-600">Не удалось загрузить школы</p>}
            {schools && visible.length === 0 && (
              <p className="px-2 py-3 text-sm text-gray-500">{schools.length === 0 ? "Школ пока нет" : "Ничего не найдено"}</p>
            )}
            {visible.map((school) => {
              const active = selection === school.id;
              return (
                <button
                  key={school.id}
                  type="button"
                  onClick={() => choose(school.id)}
                  className={`w-full text-left rounded-md px-3 py-2 mb-1 ${
                    active ? "bg-indigo-50 text-indigo-800" : "text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <span className="block text-sm font-medium truncate">{schoolLabel(school)}</span>
                  <span className="block text-xs text-gray-500 truncate">{school.slug}</span>
                </button>
              );
            })}
          </div>
        </aside>
        <section className={formClass}>
          {showForm ? (
            <div key={selection ?? "new"} className="h-full min-h-0">
              <SchoolForm
                school={editing}
                notice={notice}
                onSaved={onSaved}
                onEdit={() => setNotice("")}
                onBack={() => choose(null)}
                onUnauthorized={onLogout}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500 px-6 text-center">Выберите школу слева или создайте новую.</p>
          )}
        </section>
      </div>
    </div>
  );
}
