import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        "cell-move": {
          "0%": {
            transform:
              "translate3d(var(--from-x, 0px), var(--from-y, 0px), 0px)",
          },
          "15%, 100%": {
            transform: "translate3d(var(--to-x, 0px), var(--to-y, 0px), 0px)",
          },
        },
      },
      animation: {
        "cell-move": "cell-move 4s forwards infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animated")],
};
export default config;
