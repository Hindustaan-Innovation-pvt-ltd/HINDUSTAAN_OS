import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode`
  const env = loadEnv(mode, process.cwd(), '');
  
  // Proxy target from .env, fallback to localhost:5000
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:5000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        // Dev server proxy setup. Sirf 'npm run dev' me chalega.
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ''), // uncomment if backend doesn't expect /api
        },
      },
    },
  };
});
