import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface-2)",
        text: "var(--text)",
        muted: "var(--muted-text)",
        border: "var(--border)",
        primary: "var(--primary)",
      },
      boxShadow: {
        card: "0 8px 24px var(--shadow)",
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
