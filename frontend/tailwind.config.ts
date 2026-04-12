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
        /** 페이지 배경 틴트 (라이트) */
        cream: {
          50: "#fffdfb",
          100: "#fff8f0",
          200: "#ffecd8",
          300: "#fde4c4",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 4px 24px -6px rgba(251, 191, 36, 0.18), 0 12px 32px -12px rgba(14, 165, 233, 0.12)",
        card: "0 2px 14px rgba(251, 146, 60, 0.1)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
export default config;
