"use client";

import { useLanguage } from "./providers/LanguageProvider";

import { ReactNode } from "react";

interface TranslateProps {
  en: ReactNode;
  bm?: ReactNode; 
}

export function T({ en, bm }: TranslateProps) {
  const { lang } = useLanguage();
  
  // Rule 2: Fallback Mechanism to 'en' automatically if 'bm' is undefined
  if (lang === "BM" && bm) {
    return <>{bm}</>;
  }
  
  // Default to English
  return <>{en}</>;
}

export default T;
