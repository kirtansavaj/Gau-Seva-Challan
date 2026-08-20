import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        login: resolve(import.meta.dirname, 'login.html'),
        history: resolve(import.meta.dirname, 'history.html'),
        newChallan: resolve(import.meta.dirname, 'new-challan.html'),
        profile: resolve(import.meta.dirname, 'profile.html')
      }
    }
  }
});
