"use client";

import { useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "as", label: "অসমীয়া" },
];

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const selectLanguage = (langCode: string) => {
    if (langCode === i18n.language) return;
    startTransition(() => {
      i18n.changeLanguage(langCode);
      localStorage.setItem("suvidha-lang", langCode);
    });
  };

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <Globe className="w-5 h-5 lg:w-6 lg:h-6 text-white/90" />
      <div className="flex rounded-xl lg:rounded-2xl overflow-hidden border-2 border-white/30 backdrop-blur-sm bg-white/5">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => selectLanguage(lang.code)}
            disabled={isPending}
            className={`px-4 lg:px-5 py-2 lg:py-2.5 font-semibold transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset text-sm lg:text-base ${
              i18n.language === lang.code
                ? "bg-white text-primary shadow-lg"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
            aria-label={`Select ${lang.label}`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
