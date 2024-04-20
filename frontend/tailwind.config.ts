import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7c73e6",
        "primary-dark": "#6643b5",
        secondary: "#c4c1e0",
      },
    },
  },
  plugins: [],
} satisfies Config;
