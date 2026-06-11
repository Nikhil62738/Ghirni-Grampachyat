/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gov: {
          DEFAULT: "#1e3a8a",
          dark: "#172554",
          light: "#3b82f6",
        },
        saffron: "#FF9933",
        india: "#138808",
      },
    },
  },
  plugins: [],
};
