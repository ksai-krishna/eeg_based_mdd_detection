import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/eeg_based_mdd_detection/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
