# Настройка окружения PrintShere MVP

Этот файл содержит инструкции по настройке переменных окружения для локальной разработки и production деплоя.

## 📋 Обязательные переменные

### 1. DATABASE_URL
**PostgreSQL connection string от Neon**

```bash
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
```

**Как получить:**
1. Зарегистрируйтесь на [Neon](https://neon.tech)
2. Создайте новый проект
3. Скопируйте "Pooled connection string"
4. Добавьте в `.env.local` и Vercel Environment Variables

### 2. AUTH_SECRET
**Секрет для подписи JWT сессий**

```bash
AUTH_SECRET="ваш-случайный-секрет-минимум-32-символа"
```

**Как сгенерировать:**
```bash
openssl rand -base64 32
```

Скопируйте результат в `.env.local` и Vercel.

---

## 🔧 Локальная разработка

### Шаг 1: Создать `.env.local`
```bash
cp .env.example .env.local
```

### Шаг 2: Заполнить обязательные переменные
Отредактируйте `.env.local`:
```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."
```

### Шаг 3: Установить зависимости
```bash
npm install
```

### Шаг 4: Применить миграции
```bash
npm run db:migrate
```

### Шаг 5: Заполнить тестовые данные
```bash
npm run db:seed
```

### Шаг 6: Запустить dev сервер
```bash
npm run dev
```

Откройте http://localhost:3000

---

## ☁️ Production (Vercel)

### Шаг 1: Подключить проект к Vercel
```bash
npm install -g vercel
vercel link
```

### Шаг 2: Добавить переменные окружения

**Через Vercel Dashboard:**
1. Откройте https://vercel.com/dashboard
2. Выберите проект `PrintShereMVP`
3. Settings → Environment Variables
4. Добавьте по одной:

| Variable | Value | Environments |
|----------|-------|--------------|
| `DATABASE_URL` | `postgresql://...` | Production, Preview, Development |
| `AUTH_SECRET` | `<secret>` | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | `https://printshare.cz` | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://preview-url.vercel.app` | Preview (optional) |

**Через CLI:**
```bash
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
```

### Шаг 3: Применить миграции на production
```bash
# Подключитесь к production БД через Neon Dashboard SQL Editor
# Или используйте Prisma Studio:
npx prisma studio --browser none
```

### Шаг 4: Задеплоить
```bash
git push origin main
# или
vercel --prod
```

---

## 🎨 Опциональные переменные

### Google OAuth (опционально)
**Для входа через Google**

1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials → Create OAuth 2.0 Client ID
3. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://printshare.cz/api/auth/callback/google` (prod)
4. Добавьте в окружение:

```bash
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
```

### Vercel Blob Storage (опционально)
**Для загрузки STL/OBJ файлов клиентами**

1. Vercel Dashboard → Storage → Create Blob Store
2. Connect to project
3. Storage → your store → `.env.local` tab
4. Скопируйте `BLOB_READ_WRITE_TOKEN`
5. Добавьте в Environment Variables (Production + Preview)

```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxx"
```

⚠️ **Без этого токена:** загрузка файлов работает только в dev режиме (сохраняет на диск).

### Stripe (будущее)
**Для приема платежей** — пока не реализовано

```bash
STRIPE_SECRET_KEY="sk_live_xxx"
STRIPE_FEE_RATE="0.014"
STRIPE_FEE_FIXED_CZK="2"
```

---

## 🧪 Тестовые аккаунты

После `npm run db:seed` доступны:

| Email | Password | Role |
|-------|----------|------|
| anna@example.com | test123456 | customer |
| elena@workshop.cz | test123456 | maker |
| mr.spacks@seznam.cz | test123456 | admin |

---

## 🚨 Troubleshooting

### "Environment variable not found: DATABASE_URL"
```bash
# Проверьте, что файл существует
cat .env.local

# Убедитесь, что DATABASE_URL заполнен
grep DATABASE_URL .env.local
```

### "Can't reach database server"
- Проверьте, что connection string правильный
- Убедитесь, что IP разрешен в Neon (по умолчанию разрешены все)
- Проверьте, что используется Pooled connection string

### Миграции не применяются на Vercel
- Миграции нужно применять вручную через Prisma Studio или SQL Editor
- Vercel не запускает `prisma migrate` автоматически
- Альтернатива: добавьте в `package.json`:
  ```json
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
  ```

### "Missing required environment variables" на Vercel
- Убедитесь, что переменные добавлены для всех окружений (Production + Preview)
- После добавления переменных нужен **redeploy**
- Trigerните новый deploy: `git commit --allow-empty -m "trigger deploy" && git push`

---

## 📚 Дополнительная информация

- `.env.example` — шаблон с пояснениями
- `AGENTS.md` — инструкции для AI агентов
- `.cursor/rules/` — правила проекта для Cursor IDE
