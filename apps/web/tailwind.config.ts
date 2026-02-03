import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SUVIDHA Design System - Accessible & Ethical
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#0F172A", // Navy
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#334155", // Slate
          foreground: "#FFFFFF",
        },
        cta: {
          DEFAULT: "#0369A1", // Blue
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        accent: {
          DEFAULT: "#F1F5F9",
          foreground: "#0F172A",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#16A34A",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#D97706",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#020617",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#020617",
        },
        // Service-specific colors
        electricity: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
        },
        gas: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
        },
        water: {
          DEFAULT: "#3B82F6",
          light: "#DBEAFE",
        },
        municipal: {
          DEFAULT: "#10B981",
          light: "#D1FAE5",
        },
      },
      fontFamily: {
        heading: ["EB Garamond", "serif"],
        body: ["Lato", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
      boxShadow: {
        kiosk: "0 4px 20px rgba(0, 0, 0, 0.08)",
        "kiosk-hover": "0 8px 30px rgba(0, 0, 0, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
