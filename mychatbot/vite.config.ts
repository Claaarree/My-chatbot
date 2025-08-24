import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'My Chatbot',
        short_name: 'Chatbot',
        description: 'Your friendly AI assistant',
        theme_color: '#e7eaf3',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '.',
        icons: [
          {
            src: '/bot-svgrepo-com.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/bot-svgrepo-com.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
});