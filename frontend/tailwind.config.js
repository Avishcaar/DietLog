/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cb: {
          primary: "#0052ff",
          'primary-active': "#003ecc",
          'primary-disabled': "#a8b8cc",
          ink: "#0a0b0d",
          body: "#5b616e",
          'body-strong': "#0a0b0d",
          muted: "#7c828a",
          'muted-soft': "#a8acb3",
          hairline: "#dee1e6",
          'hairline-soft': "#eef0f3",
          canvas: "#ffffff",
          'surface-soft': "#f7f7f7",
          'surface-card': "#ffffff",
          'surface-strong': "#eef0f3",
          'surface-dark': "#0a0b0d",
          'surface-dark-elevated': "#16181c",
          'on-primary': "#ffffff",
          'on-dark': "#ffffff",
          'on-dark-soft': "#a8acb3",
        }
      },
      fontFamily: {
        display: ['"Coinbase Display"', 'Inter', 'sans-serif'],
        sans: ['"Coinbase Sans"', 'Inter', 'sans-serif'],
        mono: ['"Coinbase Mono"', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        pill: '100px',
        full: '9999px',
      }
    },
  },
  plugins: [],
}
