import { createContext, useContext, useEffect, useState } from "react";
import { translations, type Lang, type TranslationKey } from "@/i18n/translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem("emb-lang");
      return (stored === "ar" || stored === "en") ? stored : "en";
    } catch {
      return "en";
    }
  });

  const isRtl = lang === "ar";

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("emb-lang", l); } catch { /* ignore */ }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("dir", isRtl ? "rtl" : "ltr");
    root.setAttribute("lang", lang);
    if (isRtl) {
      root.classList.add("font-arabic");
    } else {
      root.classList.remove("font-arabic");
    }
  }, [lang, isRtl]);

  const t = (key: TranslationKey): string => translations[lang][key];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
