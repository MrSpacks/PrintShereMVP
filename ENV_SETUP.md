# Настройка окружения PrintShare

Окружения: **локально** (`.env.local`), **dev на Vercel** (ветка `dev`), **production** (ветка `main`).

## 🌿 Ветки и базы данных

| Окружение | Git-ветка | Neon DB | Vercel env |
|-----------|-----------|---------|------------|
| Local | любая | **dev** (текущая тестовая) | — |
| Dev (staging) | `dev` | **dev** (та же или отдельная) | Preview |
| Production | `main` | **prod** (отдельный Neon-проект) | Production |

⚠️ **Не используйте одну базу для dev и prod.**  
`npm run db:seed` и `prisma migrate reset` — только на dev-базе.

---

## 📋 Обязательные переменные

### 1. DATABASE_URL
**PostgreSQL connection string от Neon**

```bash
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
```

**Как получить:**
1. Зарегистрируйтесь на [Neon](https://neon.tech)
2. Создайте проект **printshare-dev** (локал + Vercel dev) и **printshare-prod** (Vercel production)
3. Скопируйте "Pooled connection string" для каждого
4. Dev URL → `.env.local` и Vercel **Preview**
5. Prod URL → Vercel **Production** только

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

## 🌿 Dev на Vercel (ветка `dev`)

Ветка **`dev`** уже в репозитории. Vercel деплоит её как **Preview** при каждом `git push origin dev`.

### Шаг 1: Production Branch = `main`

Vercel Dashboard → Project → **Settings → Git**:
- **Production Branch:** `main`

### Шаг 2: Env для Preview (dev)

Settings → **Environment Variables** — для каждой переменной укажите окружение **Preview** (не Production):

| Variable | Preview (dev) | Production (main) |
|----------|---------------|-------------------|
| `DATABASE_URL` | Neon **dev** | Neon **prod** |
| `AUTH_SECRET` | dev secret | **другой** prod secret |
| `BLOB_READ_WRITE_TOKEN` | dev Blob store | prod Blob store |
| `CRON_SECRET` | dev | prod |
| `NEXT_PUBLIC_SITE_URL` | URL preview-деплоя или `https://dev.printshare.cz` | `https://printshare.cz` |

После смены env: **Deployments → Redeploy** ветки `dev`.

### Шаг 3: Постоянный URL для dev (опционально)

Settings → **Domains** → Add → например `dev.printshare.cz` → **Git Branch:** `dev`.

### Шаг 4: Деплой dev

```bash
git checkout dev
# ... изменения ...
git push origin dev
```

Preview URL: `https://<project>-git-dev-<team>.vercel.app` или ваш `dev.printshare.cz`.

Cron (`purge-order-files`) на Preview **не запускается** — только на Production.

---

## ☁️ Production (Vercel, ветка `main`)

### Шаг 1: Подключить проект к Vercel
```bash
npm install -g vercel
vercel link
```

### Шаг 2: Добавить переменные окружения

**Через Vercel Dashboard:**
1. Откройте https://vercel.com/dashboard
2. Выберите свой проект на Vercel
3. Settings → Environment Variables
4. Добавьте по одной:

| Variable | Value | Environments |
|----------|-------|--------------|
| `DATABASE_URL` | Neon **prod** pooled URL | **Production** only |
| `AUTH_SECRET` | prod secret | **Production** only |
| `DATABASE_URL` | Neon **dev** pooled URL | **Preview** only |
| `AUTH_SECRET` | dev secret | **Preview** only |
| `NEXT_PUBLIC_SITE_URL` | `https://printshare.cz` | Production |
| `NEXT_PUBLIC_SITE_URL` | dev preview URL | Preview |

**Через CLI:**
```bash
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
```

### Шаг 3: Миграции на production

Миграции применяются **автоматически** при `npm run build` на Vercel (`scripts/migrate-deploy.mjs`).

Для первого подключения prod-базы вручную:

```bash
DATABASE_URL="postgresql://...prod..." npx prisma migrate deploy
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
- Убедитесь, что `DATABASE_URL` задан для нужного окружения (Preview vs Production)
- Build уже запускает `prisma migrate deploy` — смотрите логи деплоя
- После добавления env нужен **redeploy**

### "Missing required environment variables" на Vercel
- Убедитесь, что переменные добавлены для всех окружений (Production + Preview)
- После добавления переменных нужен **redeploy**
- Trigerните новый deploy: `git commit --allow-empty -m "trigger deploy" && git push`

---

## 📚 Дополнительная информация

- `.env.example` — шаблон с пояснениями
- `AGENTS.md` — инструкции для AI агентов
- `.cursor/rules/` — правила проекта для Cursor IDE
