import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/lfuk-prijimacky-testovac/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('OtazkyBio.json')) return 'data-bio';
          if (id.includes('OtazkyChem.json')) return 'data-chem';
          if (id.includes('sourceImageUtils')) return 'source-images';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
})
