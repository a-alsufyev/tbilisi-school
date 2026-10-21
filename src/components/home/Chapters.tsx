import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { School } from "../../types";

const UPCOMING = ["cities", "universities", "system"] as const;

export default function Chapters({ schools, prefix }: { schools: School[]; prefix: string }) {
  const { t } = useTranslation();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to={`${prefix}/schools`}
          className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <h2 className="font-semibold text-gray-900">{t("home.chapters.schools")}</h2>
          <p className="text-sm text-indigo-600 mt-1">{t("home.schoolsCount", { count: schools.length })}</p>
        </Link>
        {UPCOMING.map((key) => (
          <div key={key} className="rounded-xl border border-gray-200 bg-gray-100/80 p-5 text-gray-400">
            <h2 className="font-semibold">{t(`home.chapters.${key}`)}</h2>
            <p className="text-xs font-medium uppercase tracking-wide mt-2">{t("home.chapters.coming")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
