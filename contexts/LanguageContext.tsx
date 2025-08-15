import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Language } from '../types';
import { translations } from '../lib/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string, replacements?: Record<string, string | number>) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');

    const t = (key: string, replacements?: Record<string, string | number>): any => {
        const path = key.split('.');
        let result: any = translations[language];
        for (const p of path) {
            if (result && typeof result === 'object' && p in result) {
                result = result[p];
            } else {
                // Fallback to English if key not found in current language
                let fallbackResult: any = translations['en'];
                for (const fp of path) {
                     if (fallbackResult && typeof fallbackResult === 'object' && fp in fallbackResult) {
                        fallbackResult = fallbackResult[fp];
                     } else {
                         return key; // Return key if not found in English either
                     }
                }
                result = fallbackResult;
                break;
            }
        }
        
        if (typeof result === 'string' && replacements) {
            let finalString = result;
            for (const [placeholder, value] of Object.entries(replacements)) {
                finalString = finalString.replace(`{${placeholder}}`, String(value));
            }
            return finalString;
        }

        return result;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
