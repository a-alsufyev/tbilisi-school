import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { BookOpen, GraduationCap, Languages, ClipboardCheck } from 'lucide-react';

const Directory: React.FC = () => {
  const { t } = useTranslation();

  const sections = [
    {
      icon: <GraduationCap className="w-6 h-6 text-indigo-600" />,
      titleKey: 'directory.topics.typesTitle',
      descriptionKey: 'directory.topics.typesContent',
    },
    {
      icon: <Languages className="w-6 h-6 text-emerald-600" />,
      titleKey: 'directory.topics.languagesTitle',
      descriptionKey: 'directory.topics.languagesContent',
    },
    {
      icon: <ClipboardCheck className="w-6 h-6 text-amber-600" />,
      titleKey: 'directory.topics.admissionTitle',
      descriptionKey: 'directory.topics.admissionContent',
    },
    {
      icon: <BookOpen className="w-6 h-6 text-rose-600" />,
      titleKey: 'directory.topics.curriculaTitle',
      descriptionKey: 'directory.topics.curriculaContent',
    },
  ];

  const curriculaKeys = ['ib', 'british', 'american', 'finnish', 'progressive', 'hybrid'];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-16"
      >
        {/* Intro */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">{t('directory.title')}</h2>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl">
            {t('directory.content')}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {sections.map((section, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                <div className="mb-4">{section.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{t(section.titleKey)}</h3>
                <p className="text-sm text-gray-500">{t(section.descriptionKey)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Curricula Detailed Section */}
        <section id="curricula" className="space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gray-200"></div>
            <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest">{t('directory.curricula.title')}</h2>
            <div className="h-px flex-1 bg-gray-200"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {curriculaKeys.map((key, index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <h3 className="text-xl font-bold text-indigo-600 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs text-indigo-600">0{index + 1}</span>
                  {t(`directory.curricula.${key}.title`)}
                </h3>
                <p className="text-gray-600 leading-relaxed flex-1">
                  {t(`directory.curricula.${key}.content`)}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default Directory;
