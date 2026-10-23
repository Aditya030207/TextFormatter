import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createApiHandler } from './server/api.mjs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const api = createApiHandler({
    baseUrl: env.LIBRETRANSLATE_URL || 'https://libretranslate.com',
    apiKey: env.LIBRETRANSLATE_API_KEY || '',
  })
  const middleware = server => {
    server.middlewares.use('/api', (req, res) => {
      req.url = `/api${req.url}`
      api(req, res)
    })
  }
  return {
    plugins: [react(), {
      name: 'translation-api',
      configureServer: middleware,
      configurePreviewServer: middleware,
    }],
  }
})
