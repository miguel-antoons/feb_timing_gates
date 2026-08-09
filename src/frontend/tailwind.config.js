
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#74FA81",
        "primary-dark": "#084C3E",
        "primary-glow": "rgba(116, 250, 129, 0.5)",
        "secondary": "#757083",
        "background-dark": "#020408",
        "surface-dark": "#0b101a",
        "surface-border": "#1e2636",
        "text-main": "#ffffff",
        "text-muted": "#94a3b8",
      },
      fontFamily: {
        "display": ["Spline Sans", "sans-serif"],
        "mono": ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        'neon': '0 0 5px theme("colors.primary"), 0 0 20px theme("colors.primary-glow")',
        'neon-sm': '0 0 2px theme("colors.primary"), 0 0 10px theme("colors.primary-glow")',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #1e2636 1px, transparent 1px), linear-gradient(to bottom, #1e2636 1px, transparent 1px)",
      }
    },
  },
}
