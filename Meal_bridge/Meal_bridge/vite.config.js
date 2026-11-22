import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules\/(react|react-dom|react-router|react-router-dom)\//,
            },
            {
              name: 'charts',
              test: /node_modules\/(recharts|recharts-scale|victory-vendor)\//,
            },
          ],
        },
      },
    },
  },
})
