import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: '../', // <-- Esto le dice a Vite que busque el .env en la carpeta de arriba (la raíz)
});