import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        grotesk: ['var(--font-space-grotesk)'],
        inter: ['var(--font-inter)']
      },
      colors: {
        prjx: {
          bg: "#f4f6f8",
          card: "#ffffff",
          ink: "#0f1115",
          muted: "#60646c",
          line: "#e7eaee",
          accent: "#C8FF00",
          accent2: "#85FF00",
          danger: "#ef4444",
          ok: "#10b981",
          warn: "#f59e0b"
        }
      },
      boxShadow: {
        soft: "0 8px 32px rgba(15,17,21,0.08)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.7)"
      },
      borderRadius: { xl2: "1.25rem" },
      backgroundImage: {
        "grid-fade": "radial-gradient(ellipse at top, rgba(200,255,0,0.15), transparent 50%), linear-gradient(180deg, #fafbfc, #eef2f6)"
      }
    }
  },
  plugins: []
};
export default config;
