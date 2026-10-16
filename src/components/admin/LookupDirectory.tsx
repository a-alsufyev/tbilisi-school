import { useEffect, useState } from "react";
import { LOOKUP_KINDS, type LookupKind } from "../../lib/lookups";

type LookupOption = {
  id: string;
  kind: LookupKind;
  label: string;
  schoolCount: number;
};

type LookupDirectoryProps = {
  onUnauthorized: () => void;
};

const KIND_LABEL: Record<LookupKind, string> = {
  program: "Программа",
  international_status: "Международный статус",
  accreditation: "Аккредитация",
};

const fieldClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";

function lookupError(status: number, error: string | undefined): string {
  if (status === 409 && error === "duplicate") return "Такое значение уже есть";
  if (status === 409 && error === "in_use") return "Значение используется у школ. Сначала снимите его в карточках.";
  if (status === 400) return "Укажите название до 120 символов";
  return "Не удалось сохранить";
}

export default function LookupDirectory({ onUnauthorized }: LookupDirectoryProps) {
  const [kind, setKind] = useState<LookupKind>("program");
  const [items, setItems] = useState<LookupOption[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [label, setLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/admin/lookups");
        if (response.status === 401) {
          onUnauthorized();
          return;
        }
        if (!response.ok) throw new Error("load failed");
        const data = (await response.json()) as LookupOption[];
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [onUnauthorized]);

  const visible = (items ?? [])
    .filter((item) => item.kind === kind)
    .sort((left, right) => left.label.localeCompare(right.label, "ru"));

  function note(text: string, isError = false) {
    setMessage(text);
    setMessageError(isError);
  }

  function replaceItem(next: LookupOption) {
    setItems((current) => {
      const list = current ?? [];
      const index = list.findIndex((item) => item.id === next.id);
      if (index === -1) return [...list, next];
      return list.map((item) => (item.id === next.id ? next : item));
    });
  }

  async function addItem() {
    note("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/lookups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, label }),
      });
      if (response.status === 401) {
        onUnauthorized();
        return;
      }
      const body = (await response.json().catch(() => null)) as (LookupOption & { error?: string }) | null;
      if (!response.ok || !body || typeof body.id !== "string") {
        note(lookupError(response.status, body?.error), true);
        return;
      }
      replaceItem(body);
      setLabel("");
      note("Добавлено");
    } finally {
      setBusy(false);
    }
  }

  async function saveLabel(id: string) {
    note("");
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/lookups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: draft }),
      });
      if (response.status === 401) {
        onUnauthorized();
        return;
      }
      const body = (await response.json().catch(() => null)) as (LookupOption & { error?: string }) | null;
      if (!response.ok || !body || typeof body.id !== "string") {
        note(lookupError(response.status, body?.error), true);
        return;
      }
      replaceItem(body);
      setEditingId(null);
      note("Сохранено");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(id: string) {
    note("");
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/lookups/${id}`, { method: "DELETE" });
      if (response.status === 401) {
        onUnauthorized();
        return;
      }
      if (response.status === 409) {
        note(lookupError(409, "in_use"), true);
        return;
      }
      if (!response.ok) {
        note("Не удалось удалить", true);
        return;
      }
      setItems((current) => (current ?? []).filter((item) => item.id !== id));
      if (editingId === id) setEditingId(null);
      note("Удалено");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-3 flex md:flex-col gap-1">
        {LOOKUP_KINDS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setKind(item);
              note("");
              setEditingId(null);
            }}
            className={`rounded-md px-3 py-2 text-sm text-left ${
              kind === item ? "bg-indigo-50 text-indigo-800 font-medium" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            {KIND_LABEL[item]}
          </button>
        ))}
      </aside>
      <section className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900">{KIND_LABEL[kind]}</h2>
        <form
          className="mt-4 flex flex-col sm:flex-row gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy) void addItem();
          }}
        >
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Новое значение"
            className={fieldClass}
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            Добавить
          </button>
        </form>
        {message && (
          <p className={`mt-3 text-sm ${messageError ? "text-red-600" : "text-gray-600"}`}>{message}</p>
        )}
        {items === null && !loadError && <p className="mt-4 text-sm text-gray-500">Загрузка...</p>}
        {loadError && <p className="mt-4 text-sm text-red-600">Не удалось загрузить справочник</p>}
        {items && visible.length === 0 && <p className="mt-4 text-sm text-gray-500">Значений пока нет</p>}
        <ul className="mt-4 space-y-2">
          {visible.map((item) => {
            const editing = editingId === item.id;
            return (
              <li key={item.id} className="rounded-md border border-gray-200 bg-white px-3 py-2">
                {editing ? (
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className={fieldClass}
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {item.schoolCount === 0 ? "Ни у одной школы" : `У школ: ${item.schoolCount}`}
                </p>
                <div className="mt-2 flex gap-3">
                  {editing ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void saveLabel(item.id)}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Сохранить
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setDraft(item.label);
              note("");
            }}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Изменить
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void removeItem(item.id)}
                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-60"
                  >
                    Удалить
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
