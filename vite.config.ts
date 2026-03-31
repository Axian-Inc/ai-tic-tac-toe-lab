import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiOrigin = env.VITE_API_ORIGIN ?? 'http://127.0.0.1:8787';
  const websocketTarget = apiOrigin.startsWith('https://')
    ? apiOrigin.replace('https://', 'wss://')
    : apiOrigin.replace('http://', 'ws://');

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/games': apiOrigin,
        '/ws': {
          target: websocketTarget,
          ws: true,
        },
      },
    },
  };
});
