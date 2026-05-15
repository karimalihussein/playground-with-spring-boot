/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        glass: "rgba(30, 41, 59, 0.65)",
      },
      boxShadow: {
        glow: "0 0 24px rgba(91, 140, 255, 0.15)",
      },
    },
  },
  plugins: [],
};
