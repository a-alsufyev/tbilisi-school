import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

type NotFoundProps = {
  titleKey?: string;
};

export default function NotFound({ titleKey = "app.notFound" }: NotFoundProps) {
  const { t } = useTranslation();
  const { lang } = useParams();
  const prefix = lang ? `/${lang}` : "/en";

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">{t(titleKey)}</h1>
      <p className="text-gray-600 mb-8">{t("app.notFoundHint")}</p>
      <Link to={`${prefix}/schools`} className="text-indigo-600 font-medium hover:underline">
        {t("catalog.back")}
      </Link>
    </div>
  );
}
