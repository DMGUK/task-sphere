module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      colors: {
        brand: {
          bg: "#f8fafc",
          surface: "#ffffff",
          primary: "#4f46e5",
          accent: "#6366f1",
        },
      },
    },
  },
  plugins: [],
};
