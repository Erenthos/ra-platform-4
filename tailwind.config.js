/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2EE59D",
        secondary: "#0A192F",
        accent: "#FFD700",
        text: "#EAEAEA",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 10px rgba(46, 229, 157, 0.5)",
      },
    },
  },
  plugins: [],
};
