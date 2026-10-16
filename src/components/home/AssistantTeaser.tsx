import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";

export default function AssistantTeaser({ prefix }: { prefix: string }) {
  const { t } = useTranslation();
  const examples = [t("home.assistantExample1"), t("home.assistantExample2"), t("home.assistantExample3")];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-8 sm:p-10 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="inline-flex p-3 rounded-lg bg-white text-indigo-600 shadow-sm">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">{t("home.assistantTitle")}</h2>
          <p className="mt-2 text-gray-600">{t("home.assistantText")}</p>
          <Link
            to={`${prefix}/assistant`}
            className="mt-6 inline-block px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            {t("home.askAssistant")}
          </Link>
        </div>
        <div className="space-y-3">
          {examples.map((text) => (
            <Link
              key={text}
              to={`${prefix}/assistant`}
              className="block bg-white rounded-xl px-4 py-3 text-sm text-gray-700 shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors"
            >
              “{text}”
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
