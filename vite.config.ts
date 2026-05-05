import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import htmlTransformConfig from './src/config/html-transform-config';
import { version } from './package.json';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [vue(), tailwindcss(), htmlTransformConfig(version)],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
  };
});
