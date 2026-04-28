"use client";

import { createContext, useContext, useState, useEffect } from "react";

export type Language = "EN" | "BM";

interface LanguageContextType {
  lang: Language;
  toggleLanguage: (newLang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("EN");

  useEffect(() => {
    // 1. Read from localStorage first
    const saved = localStorage.getItem("saashouse_lang");
    if (saved === "BM" || saved === "EN") {
      setLang(saved as Language);
    } else {
      // 2. Read from document cookie if localStorage is empty
      const match = document.cookie.match(new RegExp('(^| )lang=([^;]+)'));
      if (match && (match[2] === "BM" || match[2] === "EN")) {
        setLang(match[2] as Language);
      }
    }
  }, []);

  const toggleLanguage = (newLang: Language) => {
    setLang(newLang);
    // Real-time update to localStorage
    localStorage.setItem("saashouse_lang", newLang);
    // Write to cookie for Backend Rust (Rule 3)
    document.cookie = `lang=${newLang}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
