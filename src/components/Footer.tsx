import React from "react";
import { useTranslation } from "react-i18next";

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="w-full bg-white border-t border-gray-200 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-gray-600 mb-1">{t("brand.slogan")}</p>
        <p className="text-gray-500 text-sm mb-3">{t("footer.now")}</p>
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} {t("footer.copyright")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
