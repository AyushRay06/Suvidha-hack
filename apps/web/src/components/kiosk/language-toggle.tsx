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
    <div className="flex items-center gap-2">
      <Globe className="w-5 h-5 text-white/80" />
      <div className="flex rounded-lg overflow-hidden border border-white/20">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => selectLanguage(lang.code)}
            disabled={isPending}
            className={`px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer focus:outline-none ${
              i18n.language === lang.code
                ? "bg-white text-primary"
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
