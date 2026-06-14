import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme (FlightPlus Open Design)
        dark: {
          primary: "#0a0a0f",
          secondary: "#12121a",
          card: "#1a1a24",
          "card-hover": "#22222e",
          border: "#2a2a3a",
        },
        // Accent
        accent: {
          DEFAULT: "#00d4ff",
          glow: "rgba(0, 212, 255, 0.3)",
          secondary: "#7c3aed",
        },
        // Text
        txt: {
          primary: "#ffffff",
          secondary: "#8b8b9e",
          muted: "#5a5a6e",
        },
        // Status
        success: "#10b981",
        warning: "#f59e0b",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        "accent-glow": "0 0 32px rgba(0, 212, 255, 0.3)",
        "card-hover": "0 8px 32px rgba(0, 0, 0, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;