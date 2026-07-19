# PrintShere MVP 🖨️

P2P маркетплейс 3D печати. Загружаете STL/OBJ → видите мейкеров на карте с ценами → размещаете заказ.

**Stack:** Next.js 14 App Router, TypeScript, Prisma, Neon PostgreSQL, Leaflet, Three.js

**Deploy:** Vercel

---

## 🚀 Quick Start

### 1. Установка
```bash
npm install
```

### 2. Настройка окружения
```bash
cp .env.example .env.local
```

Заполните обязательные переменные в `.env.local`:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `AUTH_SECRET` — сгенерируйте: `openssl rand -base64 32`

**📖 Подробная инструкция:** [ENV_SETUP.md](./ENV_SETUP.md)

### 3. База данных
```bash
npm run db:migrate    # Применить миграции
npm run db:seed       # Заполнить тестовыми данными
```

### 4. Запуск
```bash
npm run dev
```

Откройте http://localhost:3000

---

## 👥 Тестовые аккаунты

| Email | Пароль | Роль |
|-------|--------|------|
| `anna@example.com` | `test123456` | Покупатель |
| `elena@workshop.cz` | `test123456` | Мейкер |
| `mr.spacks@seznam.cz` | `test123456` | Админ |

---

## 📁 Структура проекта

```
src/
├── app/              # Next.js App Router — страницы + API
│   ├── page.tsx      # Главная: панель модели + карта
│   ├── dashboard/    # Кабинет мейкера
│   ├── orders/       # Список заказов
│   └── api/          # REST API endpoints
├── components/       # React компоненты
│   ├── auth/         # Аутентификация (JWT cookies)
│   ├── map/          # Leaflet карта + фильтры
│   ├── model/        # 3D viewer (Three.js) + drag-drop
│   └── maker/        # Dashboard UI для мейкеров
├── lib/              # Server-side утилиты
│   ├── auth/         # JWT session management
│   ├── makers/       # Maker data mappers
│   ├── model/        # STL/OBJ парсинг + расчет веса
│   └── geocoding/    # Nominatim геокодинг
├── store/            # Zustand стейт (model, map)
├── types/            # TypeScript интерфейсы
└── i18n/             # Переводы (en, cs)

prisma/
├── schema.prisma     # Модели БД
├── migrations/       # SQL миграции
└── seed.ts           # Тестовые данные
```

---

## 🔑 Основные фичи

### Для покупателей
- ✅ Загрузка STL/OBJ (drag-drop)
- ✅ Просмотр 3D модели (Three.js)
- ✅ **Точный расчет веса** с учетом infill, стенок, поддержек
- ✅ Карта мейкеров с ценами (Leaflet + CartoDB)
- ✅ Фильтры: материал, технология, рейтинг, расстояние
- ✅ Два способа доставки: самовывоз / Zásilkovna
- ✅ Google OAuth вход

### Для мейкеров
- ✅ Регистрация мастерской `/become-maker`
- ✅ Dashboard `/dashboard`:
  - Настройки: адрес, цены (FDM/resin), минимальный заказ
  - **Настройки печати:** infill%, толщина стенок, коэффициент поддержек
  - Материалы: добавить filamenty (материал + цвет)
  - Статус: available / busy / hidden
- ✅ Управление заказами `/orders`

### Для админов
- ✅ Просмотр всех заказов
- ✅ Модерация пользователей
- ✅ Staff-only роли (moderator, admin)

---

## 🧮 Расчет веса (новое!)

**Проблема:** старый алгоритм считал модель как монолит (100% infill) → завышал вес в 3-5 раз.

**Решение:** реалистичная формула:
```typescript
materialUsage = infillPercent + wallFraction
realWeight = volume × density × materialUsage × supportCoefficient
```

**Результат:**
- **До:** 100 см³ → 124г → ~620 Kč
- **После:** 100 см³ → 35г → ~175 Kč ✅

Каждый мейкер может настроить:
- Infill (0-100%, default 20%)
- Толщина стенок (0.4-5mm, default 1.2mm)
- Коэффициент поддержек (1.0-2.0, default 1.15)

UI показывает разбивку: `45.8g (39.8g + 6.0g)` — модель + поддержки.

---

## 🛠️ Скрипты

```bash
npm run dev          # Запустить dev сервер (localhost:3000)
npm run build        # Production build
npm run start        # Запустить production сервер
npm run lint         # ESLint проверка

# Prisma / База данных
npm run db:migrate   # Применить миграции (через .env.local)
npm run db:push      # Push schema без миграции (dev only)
npm run db:seed      # Заполнить тестовыми данными
npm run db:studio    # Открыть Prisma Studio GUI
```

---

## 📚 Документация

- **[ENV_SETUP.md](./ENV_SETUP.md)** — настройка переменных окружения (обязательно!)
- **[AGENTS.md](./AGENTS.md)** — инструкции для AI агентов
- **`.cursor/rules/`** — правила проекта для Cursor IDE
  - `project-overview.mdc` — обзор стека
  - `api-conventions.mdc` — соглашения API
  - `database.mdc` — работа с Prisma

---

## 🚢 Деплой на Vercel

### 1. Подключить проект
```bash
npm install -g vercel
vercel link
```

### 2. Добавить переменные окружения
Vercel Dashboard → Settings → Environment Variables:
- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_SITE_URL`

### 3. Задеплоить
```bash
git push origin main
# или
vercel --prod
```

### 4. Применить миграции
Подключитесь к production БД через [Neon Console](https://console.neon.tech) и выполните миграции вручную, или используйте:
```bash
npx prisma migrate deploy
```

---

## 🧪 Технологические решения

| Задача | Выбор | Альтернативы |
|--------|-------|--------------|
| Map | Leaflet + CartoDB | ~~Mapbox~~ (убрали) |
| 3D viewer | Three.js (dynamic import) | - |
| Auth | JWT in httpOnly cookie | NextAuth, Clerk |
| DB ORM | Prisma | Drizzle, TypeORM |
| State | Zustand | Redux, Jotai |
| Styling | Tailwind v3 + Shadcn | - |
| Geocoding | Nominatim (no API key) | Google Maps API |

---

## 🐛 Troubleshooting

### "Environment variable not found: DATABASE_URL"
Проверьте `.env.local` и что переменная заполнена. Подробнее: [ENV_SETUP.md](./ENV_SETUP.md)

### Миграции не применяются
```bash
# Убедитесь, что используете npm run, а не npx prisma напрямую
npm run db:migrate
```

### Модель не загружается
- Проверьте формат: только STL или OBJ
- Убедитесь, что mesh замкнутый (watertight)
- Размер файла до 50 MB

### Карта не отображается
- Проверьте, что есть мейкеры в БД (`npm run db:seed`)
- Откройте DevTools Console на наличие ошибок

---

## 📄 License

Proprietary — все права защищены.

---

## 👨‍💻 Разработка

**Main contributors:**
- Backend, DB, Auth — AI Agent + @MrSpacks
- Frontend, UI/UX — AI Agent + @MrSpacks
- 3D parsing, weight calculation — AI Agent

**Последние изменения:**
- ✅ Google OAuth интеграция
- ✅ Мобильная версия (burger menu, sheets)
- ✅ FDM/Resin технологии с раздельными ценами
- ✅ **Точный расчет веса** с настройками печати (infill, walls, supports)
