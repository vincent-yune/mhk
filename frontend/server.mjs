import express from 'express'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3000
const BACKEND_HOST = 'localhost'
const BACKEND_PORT = 8080
const distPath = path.join(__dirname, 'dist')
const indexHtml = path.join(distPath, 'index.html')

// API 프록시 - Node.js http 모듈로 직접 구현
app.use('/api', (req, res) => {
  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: req.url === '/' ? '/api' : `/api${req.url}`,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${BACKEND_HOST}:${BACKEND_PORT}`
    }
  }

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers)
    proxyRes.pipe(res, { end: true })
  })

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message)
    res.status(502).json({ error: 'Backend unavailable' })
  })

  req.pipe(proxyReq, { end: true })
})

// 정적 파일 서빙 (빌드된 React)
app.use(express.static(distPath))

// SPA 라우팅 - Express 5 호환
app.use((req, res) => {
  res.sendFile(indexHtml)
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MyHouse Frontend running on http://0.0.0.0:${PORT}`)
})
