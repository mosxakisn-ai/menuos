import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2563EB",
          cyan: "#06B6D4",
          navy: "#0F172A",
          surface: "#F5F7FA",
        },
        primary: {
          DEFAULT: "#0F172A",
          light: "#2563EB",
          dark: "#020617",
        },
        accent: {
          DEFAULT: "#06B6D4",
          light: "#22D3EE",
          dark: "#0891B2",
        },
        surface: "#F5F7FA",
        success: "#2ECC71",
        warning: "#F39C12",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        button: "10px",
      },
      boxShadow: {
        soft: "0 2px 20px -4px rgba(37, 99, 235, 0.1)",
        card: "0 4px 24px -6px rgba(15, 23, 42, 0.08)",
        cardHover: "0 12px 40px -8px rgba(37, 99, 235, 0.18)",
        glow: "0 0 60px -12px rgba(6, 182, 212, 0.35)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(37,99,235,0.12), transparent), radial-gradient(ellipse 60% 50% at 100% 0%, rgba(6,182,212,0.1), transparent)",
        "brand-gradient": "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
        "sidebar-gradient": "linear-gradient(180deg, #0F172A 0%, #1e293b 100%)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-up-delay": "fadeUp 0.8s ease-out 0.15s forwards",
        "fade-up-delay-2": "fadeUp 0.8s ease-out 0.3s forwards",
        float: "float 6s ease-in-out infinite",
        "scan-line": "scanLine 2.8s ease-in-out infinite",
        shimmer: "shimmer 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        scanLine: {
          "0%, 100%": { top: "0%", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "50%": { top: "100%" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
