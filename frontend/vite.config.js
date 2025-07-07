import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // -------------------------------------------------------------------
  // ADD THIS 'server' BLOCK TO PROXY API REQUESTS TO YOUR DJANGO BACKEND
  // -------------------------------------------------------------------
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Your Django server address
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // -------------------------------------------------------------------
});