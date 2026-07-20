import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10231F",       // near-black slate, used for text
        surface: "#F5F7F6",   // soft off-white page background
        card: "#FFFFFF",
        aqua: {
          50: "#EAF7F5",
          100: "#CBEBE6",
          300: "#7FCFC4",
          500: "#1E9C8B",      // primary brand accent — clean water teal
          700: "#136F63",
          900: "#0B4A42",
        },
        sun: "#F2B84B",        // warm accent for holiday lights / highlights
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      borderRadius: {
        xl: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
