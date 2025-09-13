# 🧪 Тестирование Finance Tracker MVP

## 🚀 Быстрый старт

### 1. Проверьте что все готово
Убедитесь что выполнили все шаги из `SETUP.md`:
- ✅ Supabase проект создан и схема применена
- ✅ Telegram бот настроен
- ✅ Переменные окружения заполнены
- ✅ Зависимости установлены

### 2. Запустите сервисы

**Терминал 1 (API):**
```bash
cd "Finance Mini App/finance-tracker/apps/api"
npm run dev
```

**Терминал 2 (Frontend):**
```bash
cd "Finance Mini App/finance-tracker/apps/web"
npm run dev
```

### 3. Проверьте что сервисы работают

**API Health Check:**
```bash
curl http://localhost:3001/health
```

Ожидаемый ответ:
```json
{
  "status": "ok",
  "timestamp": "2025-09-10T...",
  "uptime": 123.456,
  "environment": "development"
}
```

**Frontend:**
Откройте http://localhost:3003

## 🧪 Тестирование API

### Auth endpoints

**1. Mock авторизация (только development):**
```bash
curl -X POST http://localhost:3001/api/auth/mock
```

**2. Telegram авторизация:**
```bash
curl -X POST http://localhost:3001/api/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{"initData": "YOUR_INIT_DATA_FROM_TELEGRAM"}'
```

**3. Получить данные пользователя:**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Account endpoints

**1. Получить счета:**
```bash
curl -X GET http://localhost:3001/api/accounts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**2. Создать счет:**
```bash
curl -X POST http://localhost:3001/api/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Тестовый счет",
    "type": "cash",
    "currency": "RUB",
    "balance": 10000
  }'
```

### Categories endpoints

**1. Получить категории:**
```bash
curl -X GET http://localhost:3001/api/categories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**2. Получить категории по типу:**
```bash
curl -X GET http://localhost:3001/api/categories/by-type/expense \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Transaction endpoints

**1. Создать транзакцию:**
```bash
curl -X POST http://localhost:3001/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "account_id": "YOUR_ACCOUNT_ID",
    "category_id": "YOUR_CATEGORY_ID",
    "amount": 500,
    "type": "expense",
    "description": "Тестовая транзакция"
  }'
```

**2. Получить транзакции:**
```bash
curl -X GET "http://localhost:3001/api/transactions?limit=10&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📱 Тестирование фронтенда

### Локальное тестирование

1. Откройте http://localhost:3003
2. Приложение должно загрузиться
3. В developer tools проверьте что нет ошибок

### Mock авторизация для разработки

Если хотите протестировать без Telegram:

1. Откройте Developer Tools (F12)
2. В Console выполните:
```javascript
// Создать mock пользователя
const mockAuth = async () => {
  const response = await fetch('http://localhost:3001/api/auth/mock', {
    method: 'POST'
  });
  const data = await response.json();
  console.log('Mock auth data:', data);
  
  // Теперь можно использовать initData для авторизации
  return data;
}

mockAuth();
```

### Основные функции для тестирования

1. **Авторизация через Telegram**
2. **Просмотр баланса**
3. **Создание нового счета**
4. **Добавление транзакции (доход/расход)**
5. **Просмотр истории транзакций**
6. **Редактирование транзакции**
7. **Удаление транзакции**

## 🤖 Тестирование в Telegram

### Для реального тестирования в Telegram:

1. **Настройте ngrok** (для локального тестирования):
```bash
ngrok http 3003
```

2. **Обновите URL Mini App** в @BotFather:
```
/myapps
[Выберите ваше приложение]
Edit Web App URL
https://your-ngrok-url.ngrok.io
```

3. **Обновите CORS в API** (`apps/api/.env`):
```bash
FRONTEND_URL=https://your-ngrok-url.ngrok.io
```

4. **Перезапустите API** с новыми настройками

5. **Откройте бота в Telegram**:
   - Найдите вашего бота
   - Нажмите "Open Mini App"
   - Проверьте авторизацию и функционал

## 🔧 Troubleshooting

### API не запускается
```bash
# Проверьте .env файл
cat apps/api/.env

# Проверьте что все переменные заполнены
grep -E "(SUPABASE|TELEGRAM|JWT)" apps/api/.env

# Проверьте логи
npm run dev  # и смотрите на ошибки
```

### Ошибки Supabase
1. Убедитесь что схема БД применена
2. Проверьте что RLS политики активны
3. Проверьте URL и ключи в .env

### CORS ошибки
1. Проверьте FRONTEND_URL в API .env
2. Убедитесь что фронтенд запущен на правильном порту
3. Для Telegram используйте ngrok

### Frontend не подключается к API
1. Проверьте NEXT_PUBLIC_API_URL в web/.env.local
2. Убедитесь что API запущен и health check работает
3. Проверьте developer console на ошибки

## ✅ Чек-лист готовности MVP

### Backend ✅
- [ ] API запускается без ошибок
- [ ] Health check отвечает
- [ ] Supabase подключение работает
- [ ] JWT авторизация работает
- [ ] CRUD операции с транзакциями
- [ ] Управление счетами
- [ ] Категории загружаются

### Frontend ✅
- [ ] Приложение запускается
- [ ] API клиент подключен
- [ ] Stores работают с реальным API
- [ ] Формы отправляют данные
- [ ] Данные отображаются корректно

### Telegram Integration ✅
- [ ] Mini App открывается в Telegram
- [ ] Авторизация через Telegram работает
- [ ] Пользователь создается в БД
- [ ] UI адаптирован для Telegram

## 📊 Следующие шаги после MVP

После успешного тестирования MVP:

1. **Production Deploy**: Railway/Vercel + production Supabase
2. **Real Telegram Bot**: Публичный бот с правильным доменом
3. **Enhanced Features**: Аналитика, бюджеты, уведомления
4. **Testing**: Unit/Integration/E2E тесты
5. **Performance**: Оптимизация загрузки и запросов

## 🎉 Поздравляем!

Если все тесты прошли успешно, у вас готов полноценный Finance Tracker MVP! 🚀

- ✅ Реальная авторизация через Telegram
- ✅ Безопасная база данных с RLS
- ✅ Полноценный CRUD функционал
- ✅ Современный API на Fastify
- ✅ React фронтенд с Zustand
- ✅ TypeScript типизация

Готово к показу пользователям и дальнейшему развитию!