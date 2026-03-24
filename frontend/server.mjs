import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3000

// API 프록시
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true
}))

// 정적 파일 서빙 (빌드된 React)
app.use(express.static(path.join(__dirname, 'dist')))

// SPA 라우팅 - 모든 경로를 index.html로
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MyHouse Frontend running on http://0.0.0.0:${PORT}`)
})
