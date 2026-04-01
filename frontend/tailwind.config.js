/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: "#5865F2",
        discordDark: "#36393F",
      }
    },
  },
  plugins: [],
}
