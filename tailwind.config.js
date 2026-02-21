// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nurture & Nest Palette
        terracotta: {
          DEFAULT: '#E08F7E',
          dark: '#CD7D68',
          light: '#F2B5A6',
        },
        sage: {
          DEFAULT: '#A4B494',
          dark: '#8F9E8B',
          light: '#C5D4B8',
        },
        cream: {
          DEFAULT: '#F8F5F0',
          dark: '#F0EAE2',
        },
        charcoal: '#3D3B37',
        gold: '#C7B299',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
        body: ['Lato', 'sans-serif'],
      },
      borderRadius: {
        'soft': '12px',
        'gentle': '8px',
      },
     
boxShadow: {
  'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
  'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 25px -5px rgba(0, 0, 0, 0.04)',
},
animation: {
  'bounce-slow': 'bounce 3s infinite',
},

      backgroundImage: {
        'subtle-texture': "url('/texture.png')",
      },
    },
  },
  plugins: [],
}
