/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#060607", navy: "#0A1424", navy2: "#0D1B33",
        beige: "#E4D6BD", gold: "#E8B44A", golddeep: "#C99530",
        hi: "#F2EDE2", mid: "#A9A08E", low: "#5E594E",
        ok: "#7FBF9E", info: "#7EA6D9", warn: "#D9A46B", bad: "#CE7B6E"
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        script: ["'Cormorant Garamond'", "serif"]
      }
    }
  },
  plugins: []
};
