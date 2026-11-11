import { useEffect, useState } from "react";

type VisitDay = { day: string; countries: { code: string; count: number }[] };

type VisitStatsProps = {
  onUnauthorized: () => void;
};

const regionNames = new Intl.DisplayNames(["ru"], { type: "region" });

function countryName(code: string): string {
  if (code === "unknown") return "Не определено";
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

function formatDay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export default function VisitStats({ onUnauthorized }: VisitStatsProps) {
  const [days, setDays] = useState<VisitDay[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/admin/visits");
        if (response.status === 401) {
          onUnauthorized();
          return;
        }
        if (!response.ok) throw new Error("load failed");
        const data = (await response.json()) as VisitDay[];
        if (!cancelled) setDays(data);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [onUnauthorized]);

  return (
    <section className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8">
      <div className="max-w-3xl">
        <h2 className="text-lg font-semibold text-gray-900">Статистика</h2>
        <p className="mt-1 text-sm text-gray-500">Посещения по странам за каждый день.</p>
        {days === null && !error && <p className="mt-6 text-sm text-gray-500">Загрузка...</p>}
        {error && <p className="mt-6 text-sm text-red-600">Не удалось загрузить статистику</p>}
        {days && days.length === 0 && <p className="mt-6 text-sm text-gray-500">Пока нет посещений.</p>}
        {days && days.length > 0 && (
          <ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
            {days.map((day) => (
              <li key={day.day} className="py-3 text-sm text-gray-900">
                <span className="font-medium">{formatDay(day.day)}</span>
                <span> — </span>
                {day.countries.map((country, index) => (
                  <span key={country.code}>
                    {index > 0 ? ", " : ""}
                    {countryName(country.code)} {country.count}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
