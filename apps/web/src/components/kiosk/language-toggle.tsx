"use client";

import { useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "hi" : "en";
    startTransition(() => {
      i18n.changeLanguage(newLang);
      localStorage.setItem("suvidha-lang", newLang);
    });
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30"
      aria-label="Toggle language"
    >
      <Globe className="w-5 h-5" />
      <span className="font-medium">
        {i18n.language === "en" ? "हिंदी" : "English"}
      </span>
    </button>
  );
}
