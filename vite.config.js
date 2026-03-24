import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // هذا هو سر التحديث التلقائي!
      manifest: {
        name: 'MessagePartner',
        short_name: 'MPartner',
        description: 'بوصلتك في الرسائل والتواصل',
        theme_color: '#0c1f3f', // لون شريط الجوال (الأزرق الداكن)
        icons: [
          {
            src: 'favicon.svg', // البوصلة التي صممناها
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
})
