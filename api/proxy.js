export const config = {
  runtime: 'nodejs',
}

// const API_BASE = 'https://api.thecatapi.com'
const API_BASE = ' https://cdn2.thecatapi.com'

export default async function handler(req, res) {
  // 1. Разрешаем ВСЕ заголовки для CORS
  const allowedHeaders = [
    'Content-Type',
    'Authorization',
    'X-Api-Key',
    'x-api-key',
    'Accept',
    'Origin',
    'X-Requested-With'
  ].join(', ')
  
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', allowedHeaders)
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400')
  
  // 2. Обрабатываем preflight (OPTIONS) запрос
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  
  try {
    // 3. Формируем URL
    let path = req.url
    
    // Убираем /api если есть
    if (path.startsWith('/api')) {
      path = path.substring(4)
    }
    
    // Сохраняем версию API как есть (v1 или v1.5)
    const targetUrl = `${API_BASE}${path}`
    
    console.log(`[${req.method}] ${targetUrl}`)
    
    // 4. Копируем все заголовки из исходного запроса
    const headers = {}
    
    // Важные заголовки для API
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type']
    }
    if (req.headers['authorization']) {
      headers['Authorization'] = req.headers['authorization']
    }
    if (req.headers['x-api-key']) {
      headers['X-API-Key'] = req.headers['x-api-key']
    }
    if (req.headers['accept']) {
      headers['Accept'] = req.headers['accept']
    }
    
    // 5. Подготовка тела запроса
    const fetchOptions = {
      method: req.method,
      headers,
    }
    
    // Добавляем тело для не-GET запросов
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body)
    }
    
    // 6. Отправляем запрос к API
    const response = await fetch(targetUrl, fetchOptions)
    
    // 7. Получаем ответ
    
    const contentType = response.headers.get('content-type') || ''
    
      if (contentType.startsWith('image/')) {
      // Для изображений — возвращаем бинарные данные
      const buffer = await response.arrayBuffer()
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Length', response.headers.get('content-length') || '')
      res.setHeader('Cache-Control', 'public, max-age=86400')
      res.send(Buffer.from(buffer))
    } 
    else if (contentType.includes('application/json')) {
      // Для JSON — возвращаем JSON
      const data = await response.json()
      res.status(response.status).json(data)
    } 
    else {
      // Для остальных типов (текст, xml и т.д.)
      const data = await response.text()
      res.setHeader('Content-Type', contentType)
      res.status(response.status).send(data)
    }
    
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ 
      error: 'Proxy request failed',
      message: error.message 
    })
  }
}