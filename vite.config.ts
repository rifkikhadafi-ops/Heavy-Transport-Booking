
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
  define: {
    // Provide a fallback for process.env in the browser environment
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  }
});
