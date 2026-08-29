import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { School } from '../types';
import { ArrowLeft, MapPin, Languages, CreditCard, BookOpen, MessageSquare, Loader2 } from 'lucide-react';
import { useSchoolTranslations } from '../hooks/useSchoolTranslations';
import MapView from './Map';

interface CatalogProps {
  schools: School[];
  apiKey: string;
  selectedSchool: School | null;
  setSelectedSchool: (school: School | null) => void;
}

const Catalog: React.FC<CatalogProps> = ({ schools, apiKey, selectedSchool, setSelectedSchool }) => {
  const { t, i18n } = useTranslation();
  const { translations, isTranslating } = useSchoolTranslations(schools, i18n.language);
  const [description, setDescription] = React.useState<string | null>(null);
  const [isLoadingDescription, setIsLoadingDescription] = React.useState(false);

  React.useEffect(() => {
    if (selectedSchool) {
      setIsLoadingDescription(true);
      const identifier = selectedSchool.slug || selectedSchool.id;
      fetch(`/api/schools/${encodeURIComponent(identifier)}/description`)
        .then(async res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch description: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          setDescription(data.description !== undefined ? data.description : null);
          setIsLoadingDescription(false);
        })
        .catch(err => {
          console.error('Error fetching description:', err);
          setDescription(selectedSchool.comment || null);
          setIsLoadingDescription(false);
        });
    } else {
      setDescription(null);
    }
  }, [selectedSchool]);

  const getTranslatedName = (school: School) => {
    return translations[school.name] || school.name;
  };

  if (selectedSchool) {
    const translatedName = getTranslatedName(selectedSchool);
    const showTranslation = translatedName && translatedName !== selectedSchool.name;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setSelectedSchool(null)}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('catalog.back')}
            </button>
            {(isTranslating || isLoadingDescription) && (
              <div className="flex items-center gap-2 text-gray-400 text-xs italic">
                <Loader2 className="w-3 h-3 animate-spin" />
                {isLoadingDescription ? 'Loading description...' : 'Translating...'}
              </div>
            )}
          </div>
          
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900">{selectedSchool.name}</h2>
              {showTranslation && (
                <p className="text-xl text-gray-500 mt-1 font-medium">{translatedName}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('map.address')}</h4>
                    <p className="text-lg text-gray-900">{selectedSchool.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('catalog.program')}</h4>
                    <p className="text-lg text-gray-900">{selectedSchool.program || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                    <Languages className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('map.languages')}</h4>
                    <p className="text-lg text-gray-900">{selectedSchool.languages}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('catalog.cost')}</h4>
                    <p className="text-lg text-gray-900">{selectedSchool.cost || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-inner mb-8">
              <MapView schools={[selectedSchool]} apiKey={apiKey} height="300px" />
            </div>

            <div className="flex items-start gap-4 p-6 bg-blue-50 rounded-xl">
              <div className="p-3 bg-white rounded-lg text-blue-600 shadow-sm">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('catalog.comment')}</h4>
                {isLoadingDescription ? (
                  <div className="flex items-center gap-2 text-gray-400 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {description !== null ? description : (selectedSchool.comment || '—')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {schools.map((school, index) => {
            const translatedName = getTranslatedName(school);
            const showTranslation = translatedName && translatedName !== school.name;
            
            return (
              <motion.div
                key={school.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedSchool(school)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {school.name}
                  </h3>
                  {showTranslation && (
                    <p className="text-sm text-gray-500 font-medium">{translatedName}</p>
                  )}
                </div>
                
                <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{school.address}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Languages className="w-4 h-4 flex-shrink-0" />
                  <span>{school.languages}</span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end">
                <span className="text-indigo-600 text-sm font-semibold group-hover:underline">
                  View Details →
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  </div>
);
};

export default Catalog;
