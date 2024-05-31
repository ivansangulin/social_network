import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7c73e6",
        "primary-dark": "#6E66CC",
        secondary: "#F2F4FF",
        "secondary-dark": "#E6E9FF",
      },
    },
    screens: {
      "3xl": "1920px",
      "4xl": "2560px",
    },
  },
  plugins: [],
} satisfies Config;
