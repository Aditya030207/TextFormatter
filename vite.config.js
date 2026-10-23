import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createApiHandler } from './server/api.mjs'

export default defineConfig(() => {
  const api = createApiHandler()
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
