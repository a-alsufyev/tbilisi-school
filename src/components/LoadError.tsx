import { useTranslation } from "react-i18next";

export default function LoadError() {
  const { t } = useTranslation();

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <p className="text-lg text-gray-700">{t("app.loadError")}</p>
    </div>
  );
}
