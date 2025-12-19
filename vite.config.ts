import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      // Remove import map from production build (it's only needed for dev CDN loading)
      {
        name: 'remove-importmap',
        transformIndexHtml(html, ctx) {
          if (ctx.bundle) {
            // Production build - remove the importmap script
            return html.replace(/<script type="importmap">[\s\S]*?<\/script>/g, '');
          }
          return html;
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
