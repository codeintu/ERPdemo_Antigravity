import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const FM_HOST = env.VITE_FM_HOST;

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/fmi': {
          target: `https://${FM_HOST}`,
          changeOrigin: true,
          secure: false, // Accept self-signed certs common in local FM Servers
        },
      },
    },
  };
});
