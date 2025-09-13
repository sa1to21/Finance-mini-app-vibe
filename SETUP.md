# Finance Tracker Setup Guide

## 📋 Настройка MVP

Этот гайд поможет вам запустить Finance Tracker MVP с реальной Supabase базой данных.

## 1. 🗄️ Настройка Supabase

### Создание проекта
1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Дождитесь создания базы данных

### Настройка схемы БД
1. Откройте **SQL Editor** в Supabase Dashboard
2. Скопируйте содержимое файла `supabase-schema.sql`
3. Вставьте и выполните SQL код
4. Проверьте что все таблицы созданы в **Database** -> **Tables**

### Получение ключей
Из **Settings** -> **API**:
- `SUPABASE_URL` - Project URL  
- `SUPABASE_ANON_KEY` - anon public key
- `SUPABASE_SERVICE_ROLE_KEY` - service_role secret key

## 2. 🤖 Настройка Telegram Bot

### Создание бота
1. Напишите @BotFather в Telegram
2. Создайте нового бота: `/newbot`
3. Сохраните токен бота

### Настройка Mini App
1. В чате с @BotFather: `/newapp`
2. Выберите вашего бота
3. Укажите URL: `http://localhost:3003` (для разработки)
4. Описание: "Finance Tracker Mini App"

## 3. ⚙️ Конфигурация Backend API

### Обновите файл `.env` в `apps/api/.env`:
```bash
# Замените на ваши реальные данные
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
JWT_SECRET=your-super-secret-jwt-key-must-be-at-least-32-characters-long

PORT=3001
HOST=0.0.0.0
NODE_ENV=development
FRONTEND_URL=http://localhost:3003
```

## 4. 🌐 Конфигурация Frontend

### Обновите файл `apps/web/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BOT_USERNAME=your_bot_username
```

## 5. 🚀 Запуск приложения

### Вариант 1: Запуск всего сразу (из корня монорепо)
```bash
cd "Finance Mini App/finance-tracker"
npm run dev
```

### Вариант 2: Запуск отдельно

**Backend API:**
```bash
cd "Finance Mini App/finance-tracker/apps/api"
npm run dev
```

**Frontend:**
```bash
cd "Finance Mini App/finance-tracker/apps/web"
npm run dev
```

## 6. ✅ Проверка

### API Health Check
Откройте: http://localhost:3001/health

Ожидаемый ответ:
```json
{
  "status": "ok",
  "timestamp": "2025-09-10T...",
  "uptime": 123.456,
  "environment": "development"
}
```

### Frontend
Откройте: http://localhost:3003

### Тестирование в Telegram
1. Откройте вашего бота в Telegram
2. Нажмите кнопку "Open Mini App"
3. Проверьте что приложение загружается

## 7. 🔧 Разработка

### Mock данные (для разработки)
Если хотите протестировать без Telegram:

```bash
# Создать mock пользователя
curl -X POST http://localhost:3001/api/auth/mock
```

### Полезные команды

**Type check:**
```bash
npm run type-check
```

**Build:**
```bash
npm run build
```

## 8. 🐛 Troubleshooting

### Проблема: API не запускается
- Проверьте `.env` файл
- Убедитесь что все переменные заполнены
- Проверьте логи в консоли

### Проблема: Ошибки Supabase
- Проверьте что схема БД создана
- Убедитесь что RLS политики активны
- Проверьте ключи API

### Проблема: Telegram не работает
- Проверьте токен бота
- Убедитесь что Mini App настроен правильно
- Для локальной разработки используйте ngrok

### Проблема: CORS ошибки
- Проверьте `FRONTEND_URL` в API `.env`
- Убедитесь что фронтенд работает на правильном порту

## 9. 📊 Следующие шаги

После успешного запуска MVP:

1. **Деплой**: Настроить production окружение
2. **Тесты**: Добавить unit и integration тесты  
3. **Аналитика**: Реализовать продвинутые графики
4. **PWA**: Добавить offline support
5. **Уведомления**: Telegram notifications

## 🎉 Готово!

Если все настроено правильно, у вас должен работать полноценный MVP Finance Tracker с:

- ✅ Telegram авторизацией
- ✅ Реальной БД (Supabase)
- ✅ CRUD операциями с транзакциями
- ✅ Управлением счетами и категориями
- ✅ Безопасностью (RLS + JWT)

Удачи в разработке! 🚀