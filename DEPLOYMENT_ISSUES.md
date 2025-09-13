# Deployment Issues & Solutions

## 📋 Deployment Issue Log

Данный документ содержит все найденные и исправленные проблемы при деплое Finance Tracker Mini App на Netlify.

---

## ❌ Issue #1: "Module not found" для UI компонентов

### 🐛 **Описание проблемы**
```
The build failed at the webpack stage with the error "Module not found" for multiple
components in the file "src/app/add-transaction/page.tsx"

Компоненты: @/components/ui/button, @/components/ui/card, @/components/ui/input, 
@/components/ui/label, @/components/ui/select
```

### 📸 **Скриншот ошибки**
Ошибка отображалась в Netlify build log как показано в photo_2025-09-13_15-10-23.jpg

### 🔍 **Root Cause Analysis**
1. **Основная причина**: В `next.config.js` была ссылка на несуществующий пакет `@finance-tracker/ui` в конфигурации `transpilePackages`
2. **Дополнительная причина**: Неправильная конфигурация сборки monorepo в `netlify.toml`

### 📂 **Затронутые файлы**
- `/apps/web/next.config.js`
- `/netlify.toml`
- `/apps/web/src/app/add-transaction/page.tsx` (файл, где проявилась ошибка)

### ✅ **Решение**

#### 1. Исправление next.config.js
**Было:**
```javascript
const nextConfig = {
  transpilePackages: ['@finance-tracker/ui'],  // ← Несуществующий пакет
  env: {
    NEXT_PUBLIC_BOT_USERNAME: process.env.NEXT_PUBLIC_BOT_USERNAME,
  },
  // ...
}
```

**Стало:**
```javascript
const nextConfig = {
  env: {
    NEXT_PUBLIC_BOT_USERNAME: process.env.NEXT_PUBLIC_BOT_USERNAME,
  },
  // ...
}
```

#### 2. Исправление netlify.toml
**Было:**
```toml
[build]
  command = "cd ../../ && npm install && cd apps/web && npm install && npm run build"
```

**Стало:**
```toml
[build]
  command = "npm install && cd apps/web && npm install && npm run build"
```

### 🧪 **Тестирование решения**
```bash
cd apps/web
npm run build
# ✅ Build successful
```

### 📝 **Commit**
```
43077fe - Fix Next.js config for Netlify deployment
- Remove transpilePackages reference to non-existent @finance-tracker/ui package
- Update netlify.toml build command for proper monorepo deployment
- Local build now successful, ready for Netlify deployment
```

---

## 📊 **Статус проекта на момент исправления**

### ✅ **Завершено**
- ✅ Исправлена проблема "Module not found" в Netlify
- ✅ Локальная сборка проходит успешно  
- ✅ Код загружен в GitHub (ветка main)
- ✅ API сервер работает на порту 3002
- ✅ ngrok туннель настроен: `https://b0be4979bb9f.ngrok-free.app`

### 🔄 **В процессе**
- 🔄 Деплой на Netlify (готов к запуску после исправлений)

### ⚙️ **Настройки для Netlify**
```bash
Repository: https://github.com/sa1to21/Finance-mini-app-vibe
Branch: main
Base directory: (empty)
Build command: npm install && cd apps/web && npm install && npm run build
Publish directory: apps/web/.next

Environment Variables:
NEXT_PUBLIC_API_URL=https://b0be4979bb9f.ngrok-free.app
NODE_ENV=production
```

---

## 🎯 **Архитектура деплоя**

### 🌐 **Frontend (Netlify)**
- **Что деплоим**: Содержимое `apps/web/`
- **Технологии**: Next.js 14, React, TypeScript, Tailwind CSS
- **URL**: будет предоставлен после деплоя на Netlify

### 🚀 **Backend (Локально + ngrok)**
- **Что запускаем**: API сервер из `apps/api/`
- **Технологии**: Fastify, PostgreSQL, Supabase
- **Локальный порт**: 3002
- **Публичный доступ**: ngrok туннель

---

## 🔧 **Инструкции для будущих деплоев**

### 1. **Проверка перед деплоем**
```bash
# 1. Локальная сборка
cd apps/web
npm install
npm run build

# 2. Проверка TypeScript
npm run type-check

# 3. Линтинг
npm run lint
```

### 2. **Обновление ngrok URL**
При каждом перезапуске ngrok нужно обновить переменную окружения:
```bash
NEXT_PUBLIC_API_URL=<новый_ngrok_url>
```

### 3. **Git workflow**
```bash
# Всегда коммитим в ветку main для автоматического деплоя
git add .
git commit -m "Feature: описание изменений"
git push origin main
```

---

## 📚 **Полезные команды**

### **Разработка**
```bash
# Запуск API
cd apps/api && npm run dev

# Запуск Frontend
cd apps/web && npm run dev

# Запуск ngrok
ngrok http 3002 --host-header="localhost:3002"
```

### **Деплой**
```bash
# Сборка для продакшена
cd apps/web && npm run build

# Проверка сборки
npm run start
```

### **Отладка**
```bash
# Просмотр логов API
cd apps/api && npm run dev

# Проверка переменных окружения
echo $NEXT_PUBLIC_API_URL
```

---

## ⚠️ **Известные ограничения**

1. **ngrok Free Plan**: Ограничение на 1 одновременный туннель
2. **Netlify Free Plan**: Ограничения на количество сборок
3. **PostgreSQL**: Используется Supabase бесплатный план

---

**Дата создания**: 2025-09-13  
**Последнее обновление**: 2025-09-13  
**Версия**: 1.0.0