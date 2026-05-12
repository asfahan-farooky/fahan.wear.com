/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0A0A0A",
          white: "#FAFAFA",
          grey: {
            50: "#F7F7F7",
            100: "#E8E8E8",
            200: "#D4D4D4",
            300: "#A3A3A3",
            400: "#737373",
            500: "#525252",
            600: "#404040",
            700: "#262626",
            800: "#171717",
            900: "#0A0A0A",
          },
          beige: "#F5F0EB",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        wider: "0.08em",
        widest: "0.12em",
      },
    },
  },
  plugins: [],
};