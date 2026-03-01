"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const LANG_MAP: Record<string, string> = {
  en: "en",
  hi: "hi",
  as: "as",
};

/**
 * Dynamically updates the <html lang="..."> attribute
 * whenever the i18n language changes.
 */
export function DynamicHtmlLang() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = LANG_MAP[i18n.language] || "en";
    document.documentElement.setAttribute("lang", lang);
  }, [i18n.language]);

  return null;
}
