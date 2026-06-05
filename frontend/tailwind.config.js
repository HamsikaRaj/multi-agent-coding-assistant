/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', "Consolas", "monospace"],
      },
      colors: {
        cyan: {
          DEFAULT: "#00ffff",
          400: "#00ffff",
          500: "#00e5e5",
        },
        green: {
          DEFAULT: "#00ff88",
          400: "#00ff88",
          500: "#00cc6e",
        },
      },
      animation: {
        pulse: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
