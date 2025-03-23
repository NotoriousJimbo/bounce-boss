/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF1B6B',
          light: 'rgba(255, 27, 107, 0.1)',
          dark: '#e01861',
        },
        secondary: {
          DEFAULT: '#8A2BE2',
          light: 'rgba(138, 43, 226, 0.1)',
          dark: '#6a1eb0',
        },
        accent: {
          DEFAULT: '#00B4D8',
          light: 'rgba(0, 180, 216, 0.1)',
          dark: '#0090ad',
        },
        orange: {
          DEFAULT: '#FF8C42',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
        'gradient-primary-hover': 'linear-gradient(135deg, var(--primary-dark) 0%, var(--secondary-dark) 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} 