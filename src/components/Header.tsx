import React from 'react';
import { useTranslation } from 'react-i18next';
import { Map as MapIcon, Info, Globe } from 'lucide-react';

interface HeaderProps {
  activeTab: 'map' | 'catalog' | 'directory' | 'about';
  setActiveTab: (tab: 'map' | 'catalog' | 'directory' | 'about') => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const languages = [
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'ge', label: 'GE', flag: '🇬🇪' },
    { code: 'ru', label: 'RU', flag: '🇷🇺' },
    { code: 'de', label: 'DE', flag: '🇩🇪' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
              <Globe className="w-6 h-6" />
              <span className="hidden sm:inline">Tbilisi Schools</span>
            </h1>
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'map'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                {t('nav.map')}
              </button>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'catalog'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Globe className="w-4 h-4" />
                {t('nav.catalog')}
              </button>
              <button
                onClick={() => setActiveTab('directory')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'directory'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Info className="w-4 h-4" />
                {t('nav.directory')}
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'about'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Info className="w-4 h-4" />
                {t('nav.about')}
              </button>
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`p-1.5 rounded-md text-lg hover:bg-gray-100 transition-colors ${
                  i18n.language === lang.code ? 'bg-gray-100 ring-1 ring-indigo-300' : ''
                }`}
                title={lang.label}
              >
                {lang.flag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
