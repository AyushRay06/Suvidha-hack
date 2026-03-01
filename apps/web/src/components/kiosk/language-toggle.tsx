"use client";

import { useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "as", label: "অসমীয়া" },
];

interface LanguageToggleProps {
  variant?: "dark" | "electricity" | "water" | "gas" | "municipal";
}

const variantStyles = {
  dark: {
    icon: "text-white/90",
    border: "border-white/30",
    bg: "bg-white/5",
    activeBg: "bg-white",
    activeText: "text-primary",
    inactiveBg: "bg-white/10",
    inactiveText: "text-white",
    hoverBg: "hover:bg-white/20",
  },
  electricity: {
    icon: "text-electricity",
    border: "border-electricity/40",
    bg: "bg-white",
    activeBg: "bg-electricity",
    activeText: "text-white",
    inactiveBg: "bg-electricity/10",
    inactiveText: "text-electricity",
    hoverBg: "hover:bg-electricity/20",
  },
  water: {
    icon: "text-water",
    border: "border-water/40",
    bg: "bg-white",
    activeBg: "bg-water",
    activeText: "text-white",
    inactiveBg: "bg-water/10",
    inactiveText: "text-water",
    hoverBg: "hover:bg-water/20",
  },
  gas: {
    icon: "text-gas",
    border: "border-gas/40",
    bg: "bg-white",
    activeBg: "bg-gas",
    activeText: "text-white",
    inactiveBg: "bg-gas/10",
    inactiveText: "text-gas",
    hoverBg: "hover:bg-gas/20",
  },
  municipal: {
    icon: "text-municipal",
    border: "border-municipal/40",
    bg: "bg-white",
    activeBg: "bg-municipal",
    activeText: "text-white",
    inactiveBg: "bg-municipal/10",
    inactiveText: "text-municipal",
    hoverBg: "hover:bg-municipal/20",
  },
};

export function LanguageToggle({ variant = "dark" }: LanguageToggleProps) {
  const { i18n } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const styles = variantStyles[variant];

  const selectLanguage = (langCode: string) => {
    if (langCode === i18n.language) return;
    startTransition(() => {
      i18n.changeLanguage(langCode);
      localStorage.setItem("suvidha-lang", langCode);
    });
  };

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <Globe className={`w-5 h-5 lg:w-6 lg:h-6 ${styles.icon}`} />
      <div className={`flex rounded-xl lg:rounded-2xl overflow-hidden border-2 ${styles.border} backdrop-blur-sm ${styles.bg}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => selectLanguage(lang.code)}
            disabled={isPending}
            className={`px-4 lg:px-5 py-2 lg:py-2.5 font-semibold transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset text-sm lg:text-base ${i18n.language === lang.code
                ? `${styles.activeBg} ${styles.activeText} shadow-lg`
                : `${styles.inactiveBg} ${styles.inactiveText} ${styles.hoverBg}`
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
