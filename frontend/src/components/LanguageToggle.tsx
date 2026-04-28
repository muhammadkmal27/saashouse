"use client";

import { useLanguage } from "./providers/LanguageProvider";

export default function LanguageToggle() {
  const { lang, toggleLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-[#1a1a1f] p-1 rounded-full border border-zinc-800 shadow-inner">
      <button
        onClick={() => toggleLanguage("EN")}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
          lang === "EN" 
            ? "bg-[#3b82f6] text-white shadow-md shadow-blue-500/20" 
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => toggleLanguage("BM")}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
          lang === "BM" 
            ? "bg-[#3b82f6] text-white shadow-md shadow-blue-500/20" 
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        BM
      </button>
    </div>
  );
}
