import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ivory: "#FDFBF7",
        champagne: "#F7E7CE",
        blush: "#FEE5E0",
        gold: "#D4AF37",
        dark: {
          900: "#0A0808",
          800: "#1A1412"
        }
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-geist-sans)", "sans-serif"],
      }
    },
  },
  plugins: [],
};
export default config;
