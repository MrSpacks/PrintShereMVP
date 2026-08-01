# Настройка домена 3dprintshare.xyz

## Проблема
После регистрации URL меняется с `3dprintshare.xyz` на `print-shere-mvp.vercel.app`

## Решение

### 1. Настройка домена в Vercel

1. Откройте проект в [Vercel Dashboard](https://vercel.com/dashboard)
2. Перейдите в **Settings** → **Domains**
3. Нажмите **Add Domain**
4. Добавьте оба варианта:
   - `3dprintshare.xyz` (основной)
   - `www.3dprintshare.xyz` (алиас)

### 2. Настройка DNS записей

У вашего DNS провайдера (где купили домен `3dprintshare.xyz`) добавьте следующие записи:

#### Для apex домена (@):
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

#### Для www поддомена:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**Если провайдер не поддерживает A-запись для apex домена**, используйте CNAME FLATTENING или ANAME:
```
Type: CNAME (или ANAME)
Name: @
Value: cname.vercel-dns.com
TTL: 3600
```

### 3. Переменная окружения в Vercel (опционально)

Для гарантии правильного URL добавьте переменную окружения:

1. **Settings** → **Environment Variables**
2. Добавьте:
   - **Name:** `NEXT_PUBLIC_SITE_URL`
   - **Value:** `https://3dprintshare.xyz`
   - **Scope:** Production, Preview, Development

### 4. Ожидание распространения DNS

- DNS изменения могут занять **до 48 часов**
- Обычно работает через **15-30 минут**
- Проверить статус можно в Vercel: статус домена должен стать "Valid" ✅

### 5. SSL сертификат

Vercel автоматически выпустит SSL сертификат (Let's Encrypt) после успешной проверки домена.

## Проверка

После настройки:

1. Откройте `https://3dprintshare.xyz` — должен открыться ваш сайт
2. Откройте `https://www.3dprintshare.xyz` — должен перенаправить на основной домен
3. Проверьте PWA: `chrome://inspect/#service-workers` — должен быть активен manifest

## Что было изменено в коде

1. ✅ Создан `/public/manifest.json` для PWA
2. ✅ Добавлена ссылка на манифест в `layout.tsx`
3. ✅ Обновлен fallback URL в `src/lib/site.ts` на `https://3dprintshare.xyz`

## Если проблема сохраняется

1. Очистите кеш браузера (Ctrl+Shift+Del)
2. Попробуйте Incognito/Private режим
3. Проверьте DNS: `nslookup 3dprintshare.xyz` (должен показать 76.76.21.21)
4. Проверьте Vercel Deployment Logs на наличие ошибок
