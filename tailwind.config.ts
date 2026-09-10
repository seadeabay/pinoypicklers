import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#5fcf7a',
          yellow: '#f5c842',
          dark: '#071f13',
          mid: '#0d3d24',
        },
      },
      fontFamily: { serif: ['Georgia', 'Times New Roman', 'serif'] },
      backgroundImage: {
        'court-gradient': 'linear-gradient(160deg, #0a2a1a 0%, #0d3d24 40%, #071f13 100%)',
      },
    },
  },
  plugins: [],
}
export default config
