"use client";

import i18n from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";
import { ReactNode, useEffect, useState } from "react";
import { en } from "./translations/en";
import { hi } from "./translations/hi";
import { as } from "./translations/as";

// Initialize i18n
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    as: { translation: as },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved language preference
    const savedLang = localStorage.getItem("suvidha-lang");
    if (savedLang && (savedLang === "en" || savedLang === "hi" || savedLang === "as")) {
      i18n.changeLanguage(savedLang);
    }
  }, []);

  if (!mounted) {
    return null;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export { i18n };
