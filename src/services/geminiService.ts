import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const translationCache: Record<string, string> = {};

export async function translateSchoolNames(names: string[], targetLang: string): Promise<Record<string, string>> {
  const langNames: Record<string, string> = {
    'en': 'English',
    'ge': 'Georgian',
    'ru': 'Russian',
    'de': 'German'
  };

  const targetLangName = langNames[targetLang] || targetLang;
  
  // Filter out names already in cache
  const namesToTranslate = names.filter(name => !translationCache[`${name}_${targetLang}`]);
  
  if (namesToTranslate.length === 0) {
    const result: Record<string, string> = {};
    names.forEach(name => {
      result[name] = translationCache[`${name}_${targetLang}`];
    });
    return result;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following school names into ${targetLangName}. Return a JSON object where keys are original names and values are translations.
      Names: ${namesToTranslate.join(', ')}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: namesToTranslate.reduce((acc: any, name) => {
            acc[name] = { type: Type.STRING };
            return acc;
          }, {})
        }
      }
    });

    const translations = JSON.parse(response.text || '{}');
    
    // Update cache
    Object.entries(translations).forEach(([original, translated]) => {
      translationCache[`${original}_${targetLang}`] = translated as string;
    });

    // Build final result
    const finalResult: Record<string, string> = {};
    names.forEach(name => {
      finalResult[name] = translationCache[`${name}_${targetLang}`] || name;
    });
    
    return finalResult;
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback to original names
    const fallback: Record<string, string> = {};
    names.forEach(name => {
      fallback[name] = translationCache[`${name}_${targetLang}`] || name;
    });
    return fallback;
  }
}
