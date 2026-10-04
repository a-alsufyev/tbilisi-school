import { useState, type FormEvent } from "react";

type AdminLoginProps = {
  misconfigured: boolean;
  onSuccess: () => void;
};

export default function AdminLogin({ misconfigured, onSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(misconfigured ? "Админка не настроена на сервере" : "");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        onSuccess();
        return;
      }
      if (response.status === 429) {
        const body = (await response.json().catch(() => null)) as { retryAfter?: number } | null;
        const seconds = body?.retryAfter;
        setError(
          seconds
            ? `Слишком много попыток. Подождите ${seconds} с`
            : "Слишком много попыток. Подождите немного"
        );
        return;
      }
      if (response.status === 503) {
        setError("Админка не настроена на сервере");
        return;
      }
      setError("Неверный логин или пароль");
    } catch {
      setError("Не удалось войти");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-gray-900">Вход в админку</h1>
        <label className="block mt-5 text-sm font-medium text-gray-700" htmlFor="admin-username">
          Логин
        </label>
        <input
          id="admin-username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <label className="block mt-4 text-sm font-medium text-gray-700" htmlFor="admin-password">
          Пароль
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || misconfigured}
          className="mt-5 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Вход..." : "Войти"}
        </button>
      </form>
    </div>
  );
}
