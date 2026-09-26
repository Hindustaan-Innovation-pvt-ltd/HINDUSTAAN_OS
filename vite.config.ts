import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode`
  const env = loadEnv(mode, process.cwd(), '');
  
  // Proxy target from .env, fallback to 127.0.0.1:3000
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:3000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        // AI Lead Engine FastAPI Backend (port 8000)
        '/api/scan': {
          target: env.VITE_LEAD_ENGINE_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/api/opportunities': {
          target: env.VITE_LEAD_ENGINE_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        // Node.js Main Backend (port 3000)
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/socket.io': {
          target: proxyTarget,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});

