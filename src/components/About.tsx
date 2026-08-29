import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';

const About: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('about.title')}</h2>
        <div className="prose prose-indigo max-w-none">
          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            {t('about.content')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 bg-indigo-50 rounded-xl">
              <h3 className="font-bold text-indigo-900 mb-2">Filters</h3>
              <p className="text-sm text-indigo-700">Coming soon: Filter by language, age groups, and curriculum.</p>
            </div>
            <div className="p-6 bg-emerald-50 rounded-xl">
              <h3 className="font-bold text-emerald-900 mb-2">Reviews</h3>
              <p className="text-sm text-emerald-700">Coming soon: Real parent reviews and ratings for each school.</p>
            </div>
            <div className="p-6 bg-amber-50 rounded-xl">
              <h3 className="font-bold text-amber-900 mb-2">Details</h3>
              <p className="text-sm text-amber-700">Coming soon: Tuition fees, contact info, and admission dates.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default About;
