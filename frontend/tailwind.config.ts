import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        sky: {
          DEFAULT: "var(--sky)",
          soft: "#E8F4FC",
        },
        horizon: "var(--horizon)",
        sun: {
          DEFAULT: "var(--sun)",
          deep: "var(--sun-deep)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          muted: "var(--ink-muted)",
        },
        cream: {
          50: "#fffdfb",
          100: "#f7f0e8",
          200: "#efe6d8",
          300: "#e5d9c6",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 8px 32px -12px rgba(28, 36, 48, 0.18)",
        card: "0 4px 20px -8px rgba(28, 36, 48, 0.14)",
        sun: "0 4px 20px -4px rgba(245, 165, 36, 0.45)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
export default config;
