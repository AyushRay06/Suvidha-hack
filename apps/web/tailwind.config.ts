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
        // SUVIDHA Design System v2 - Kiosk Optimized
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Core colors
        primary: {
          DEFAULT: "hsl(var(--primary))",
          light: "hsl(var(--primary-light))",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        cta: {
          DEFAULT: "hsl(var(--cta))",
          light: "hsl(var(--cta-light))",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--cta))",
          foreground: "#FFFFFF",
        },

        // Status colors
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "#FFFFFF",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "#FFFFFF",
        },

        // Card colors
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "hsl(var(--foreground))",
        },

        // Service-specific colors (for utility/departmental distinction)
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
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      fontSize: {
        "xs-kiosk": "0.875rem",
        "sm-kiosk": "1rem",
        "base-kiosk": "1.125rem",
        "lg-kiosk": "1.25rem",
        "xl-kiosk": "1.5rem",
        "2xl-kiosk": "1.875rem",
        "3xl-kiosk": "2.25rem",
        "4xl-kiosk": "3rem",
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        "full": "9999px",
      },
      boxShadow: {
        kiosk: "0 4px 20px rgba(0, 0, 0, 0.08)",
        "kiosk-hover": "0 8px 30px rgba(0, 0, 0, 0.12)",
        "lg-kiosk": "0 10px 40px rgba(0, 0, 0, 0.15)",
      },
      spacing: {
        kiosk: "1.5rem", // Standard kiosk spacing
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "bounce-subtle": "bounceSubtle 2s infinite",
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
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      minHeight: {
        kiosk: "60px",
        "kiosk-lg": "80px",
      },
      minWidth: {
        kiosk: "60px",
        "kiosk-lg": "80px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
