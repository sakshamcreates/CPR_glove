/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          primary: '#F5F2EA',
          secondary: '#ECE8DE',
          muted: '#E4DFD3',
        },
        brand: {
          green: '#173F35',
          deep: '#0F2D26',
          burgundy: '#7F2929',
          mutedBurgundy: '#A55353',
        },
        content: {
          primary: '#1E2421',
          secondary: '#68706B',
          muted: '#8A928D',
        },
        border: {
          DEFAULT: '#D8D4C9',
          subtle: '#E4E0D6',
          strong: '#BDB7A7',
        },
        status: {
          success: '#3D765A',
          warning: '#B7791F',
          danger: '#A33A32',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '14px',
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(30, 36, 33, 0.04), 0 1px 2px rgba(30, 36, 33, 0.02)',
        'elevated': '0 4px 12px rgba(30, 36, 33, 0.06), 0 1px 3px rgba(30, 36, 33, 0.04)',
      }
    },
  },
  plugins: [],
}
