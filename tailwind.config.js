/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        ios: [
          "Helvetica Neue",
          "Helvetica",
          "Lucida Grande",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        "inset-gloss": "inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -1px 0 rgba(0,0,0,0.12)",
        "inset-deep": "inset 0 2px 4px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
