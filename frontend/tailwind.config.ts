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
        // Brand palette — vibrant health/wellness enterprise colors
        brand: {
          50:  "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        emerald: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        violet: {
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        coral: {
          500: "#f97316",
          600: "#ea580c",
        },
        health: {
          green:   "#10b981",
          blue:    "#0ea5e9",
          purple:  "#8b5cf6",
          orange:  "#f97316",
          red:     "#ef4444",
          yellow:  "#f59e0b",
          teal:    "#14b8a6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)",
        "gradient-health": "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
        "gradient-warm": "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
        "gradient-hero": "linear-gradient(135deg, #0c4a6e 0%, #075985 40%, #7c3aed 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s infinite",
        "gradient-x": "gradientX 3s ease infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        gradientX: {
          "0%, 100%": { backgroundSize: "200% 200%", backgroundPosition: "left center" },
          "50%": { backgroundSize: "200% 200%", backgroundPosition: "right center" },
        },
      },
      boxShadow: {
        "glow-blue":   "0 0 20px rgba(14, 165, 233, 0.3)",
        "glow-green":  "0 0 20px rgba(16, 185, 129, 0.3)",
        "glow-purple": "0 0 20px rgba(139, 92, 246, 0.3)",
        "card": "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 24px rgba(0,0,0,0.10), 0 8px 48px rgba(14,165,233,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
