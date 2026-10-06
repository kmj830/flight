/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        radar: {
          bg: '#050811',
          panel: '#0B1220',
          panelLight: '#111B2E',
          border: '#1E293B',
          borderLight: '#334155',
          green: '#10B981',
          cyan: '#06B6D4',
          amber: '#F59E0B',
          red: '#EF4444',
          text: '#E2E8F0',
          dim: '#64748B'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
}
