import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    fontFamily: {
      sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      mono: ["var(--font-geist-mono)", ...fontFamily.sans],
      inter: ["var(--font-inter)", ...fontFamily.sans],
      poppins: ["var(--font-poppins)", ...fontFamily.sans],
      overpass: ["var(--font-overpass)", ...fontFamily.sans],
    },
  },
  plugins: [],
} satisfies Config;

export default config;
