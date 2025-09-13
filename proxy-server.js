const http = require('http')
const url = require('url')

const PORT = 3003
const FRONTEND_PORT = 3001
const API_PORT = 3002

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true)
  
  // Определяем целевой сервер
  const isApiRequest = parsedUrl.pathname.startsWith('/api') || parsedUrl.pathname.startsWith('/health')
  const targetPort = isApiRequest ? API_PORT : FRONTEND_PORT
  const targetHost = `http://localhost:${targetPort}`
  
  // Настройки прокси
  const options = {
    hostname: 'localhost',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${targetPort}`
    }
  }
  
  // Прокси запрос
  const proxyReq = http.request(options, (proxyRes) => {
    // Копируем заголовки ответа
    res.writeHead(proxyRes.statusCode, proxyRes.headers)
    proxyRes.pipe(res)
  })
  
  proxyReq.on('error', (err) => {
    console.error(`Proxy error for ${req.url}:`, err.message)
    res.writeHead(500)
    res.end('Proxy Error')
  })
  
  // Передаем данные запроса
  req.pipe(proxyReq)
})

server.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`)
  console.log(`📱 Frontend: http://localhost:${PORT}`)
  console.log(`🔧 API: http://localhost:${PORT}/api`)
  console.log(`💡 Use: ngrok http ${PORT}`)
})