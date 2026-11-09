import { defineConfig } from 'astro/config';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  site: 'https://chemqc.ir',
  vite: {
    css: {
      postcss: {
        plugins: [tailwindcss()],
      },
    },
  },
});
