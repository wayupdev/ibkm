import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "Nunito Sans", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Poppins", "system-ui", "sans-serif"],
      },
      colors: {
        // Brand orange — inspired by inspiredbykm.com
        brand: {
          50:  "#fff4ec",
          100: "#ffe2cf",
          200: "#ffc097",
          300: "#ff9d5f",
          400: "#ff8038",
          500: "#f96100",
          600: "#e85700",
          700: "#c34900",
          800: "#9b3a00",
          900: "#221f20",
        },
        ink: "#221f20",
        accent: { 500: "#009807", 600: "#007e06" }, // KM secondary green
      },
      boxShadow: {
        soft: "0 2px 8px rgba(34,31,32,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
