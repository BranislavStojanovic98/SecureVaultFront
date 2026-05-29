import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('./certs/frontend.key'),
      cert: fs.readFileSync('./certs/frontend.crt'),
    },
    host: 'localhost',
    port: 5173,
  },

  define: {
    global: "window",
  }
});
