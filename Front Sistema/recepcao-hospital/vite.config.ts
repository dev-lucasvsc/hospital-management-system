import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // ✨ Resolve o erro "global is not defined" transformando 'global' em 'window'
    global: 'window',
  },
})