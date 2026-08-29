import { useState, useEffect } from 'react';
import { School } from '../types';
import { translateSchoolNames } from '../services/geminiService';

export function useSchoolTranslations(schools: School[], currentLang: string) {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const fetchTranslations = async () => {
      if (schools.length === 0) return;
      
      setIsTranslating(true);
      const names = schools.map(s => s.name);
      const result = await translateSchoolNames(names, currentLang);
      setTranslations(prev => ({ ...prev, ...result }));
      setIsTranslating(false);
    };

    fetchTranslations();
  }, [schools, currentLang]);

  return { translations, isTranslating };
}
