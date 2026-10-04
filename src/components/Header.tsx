import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Map as MapIcon, Info, Globe, MessageCircle } from "lucide-react";
import { isSupportedUiLang, replaceLangPrefix, type UiLang } from "../lib/schools";

const languages: { code: UiLang; label: string; flag: string }[] = [
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "ge", label: "GE", flag: "🇬🇪" },
  { code: "ru", label: "RU", flag: "🇷🇺" },
  { code: "de", label: "DE", flag: "🇩🇪" },
];

function navClass(isActive: boolean): string {
  return `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? "bg-indigo-100 text-indigo-700"
      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
  }`;
}

export default function Header() {
  const { t } = useTranslation();
  const { lang } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const prefix = isSupportedUiLang(lang) ? `/${lang}` : "/en";
  const currentLang = isSupportedUiLang(lang) ? lang : "en";

  const changeLanguage = (next: UiLang) => {
    navigate(replaceLangPrefix(location.pathname, next) + location.search);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8 min-w-0">
            <NavLink
              to={prefix}
              end
              className="text-xl font-bold text-indigo-600 flex items-center gap-2"
            >
              <Globe className="w-6 h-6" />
              <span className="hidden sm:inline">Tbilisi Schools</span>
            </NavLink>
            <nav className="flex space-x-4 overflow-x-auto">
              <NavLink to={prefix} end className={({ isActive }) => navClass(isActive)}>
                <MapIcon className="w-4 h-4" />
                {t("nav.map")}
              </NavLink>
              <NavLink
                to={`${prefix}/schools`}
                className={({ isActive }) => navClass(isActive)}
              >
                <Globe className="w-4 h-4" />
                {t("nav.catalog")}
              </NavLink>
              <NavLink
                to={`${prefix}/directory`}
                className={({ isActive }) => navClass(isActive)}
              >
                <Info className="w-4 h-4" />
                {t("nav.directory")}
              </NavLink>
              <NavLink
                to={`${prefix}/assistant`}
                className={({ isActive }) => navClass(isActive)}
              >
                <MessageCircle className="w-4 h-4" />
                {t("nav.assistant")}
              </NavLink>
              <NavLink
                to={`${prefix}/about`}
                className={({ isActive }) => navClass(isActive)}
              >
                <Info className="w-4 h-4" />
                {t("nav.about")}
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => changeLanguage(item.code)}
                className={`p-1.5 rounded-md text-lg hover:bg-gray-100 transition-colors ${
                  currentLang === item.code ? "bg-gray-100 ring-1 ring-indigo-300" : ""
                }`}
                title={item.label}
              >
                {item.flag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
