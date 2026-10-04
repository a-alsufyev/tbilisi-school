# Архитектура Tbilisi Schools

Каталог школ Тбилиси: карта, карточки школ, справочник программ и интерфейс на четырёх языках (EN, RU, GE, DE).

Приложение — React-клиент и Express-сервер. В рантайме источник данных — **PostgreSQL**. CSV, TXT и JSON в `data/` остаются в git как сид и бэкап контента; запросы API их не читают.

Подбор школ в диалоге идёт через OpenAI на сервере (`POST /api/assistant`). Ключ в браузер не отдаётся. Переводы интерфейса — в `src/i18n/index.ts`, имена школ — в таблице `school_translations`.

Связанные документы: [change-plan.md](./change-plan.md), [implementation-checklist.md](./implementation-checklist.md), ассистент — [assistant.md](./assistant.md), заготовка авторизации — [schema-next.md](./schema-next.md).

## Общая схема

```
Браузер
  ├── React UI + react-router-dom
  ├── i18next (язык из :lang в URL)
  └── Yandex Maps JS API
        │
        │  GET /api/schools
        │  GET /api/schools/:slug/description
        │  GET /api/config
        │  GET|POST /api/visits
        │  POST /api/assistant
        ▼
Express (`server.ts`)
  ├── Vite middleware (dev) или статика dist/ (production)
  └── Drizzle → PostgreSQL
        ▲
        │  только если в schools 0 строк
        │
data/schools.csv
data/descriptions/*.txt
data/school-names.json
```

При старте: миграции → сид, если таблица школ пустая → listen.

## Стек

| Слой | Технологии |
|---|---|
| UI | React 19, TypeScript, Tailwind CSS 4, Motion, Lucide |
| Маршруты | `react-router-dom` |
| Сборка | Vite 6, `@vitejs/plugin-react` |
| Сервер | Node.js, Express 4, `tsx` |
| Локализация | i18next, react-i18next (язык из URL, не detector браузера) |
| Карта | Yandex Maps JavaScript API 2.1 |
| БД | PostgreSQL 16, Drizzle ORM, драйвер `postgres` |

## URL

`lang` ∈ `en | ru | ge | de`. Школа в пути — латинский kebab-case slug, не числовой id и не старые файловые ключи вроде `северная_школа`.

```
/                              → /{lang} по языку браузера, если en|ru|ge|de, иначе /en
/{lang}                        карта
/{lang}/schools                каталог
/{lang}/schools/{slug}         карточка школы
/{lang}/directory              справочник
/{lang}/assistant              диалог подбора школы
/{lang}/about                  о проекте
/{lang}/login
/{lang}/register               404 (пути зарезервированы, страниц входа нет)
/{lang}/account
```

Невалидный `lang` → редирект на `/en` + тот же хвост пути. Неизвестный slug → 404 в SPA, URL каталогом не подменяется. Смена языка в шапке меняет только префикс.

Навигация в `Header` — `<NavLink>` на эти пути.

## Данные

### Рантайм — Postgres

Схема: `src/db/schema.ts`. Таблиц `users` и `comments` в этой волне нет.

**schools**

- `id` UUID PK
- `slug` TEXT UNIQUE NOT NULL
- `address` TEXT
- `lat` / `lng` DOUBLE PRECISION NULL
- `languages` TEXT
- `website` TEXT NULL
- `cost` TEXT NULL
- `cost_status` TEXT NOT NULL DEFAULT `approximate` — `official`, `approximate` или `unknown`. При `unknown` сумма пустая
- `program` TEXT NULL
- `name_locale` TEXT NOT NULL DEFAULT `en` — какое из четырёх имён основное: `en`, `ru`, `ge` или `de`
- `created_at` / `updated_at`

**school_translations**

- `school_id` FK → schools (PK вместе с `locale`)
- `locale` TEXT — `en` | `ru` | `ge` | `de`
- `name` TEXT NOT NULL
- `description` TEXT NOT NULL DEFAULT ''

**site_stats**

- `key` TEXT PK — сейчас `visits`
- `value` INTEGER NOT NULL DEFAULT 0

Правки контента на заполненной БД — в Postgres (или повторный сид после очистки таблиц школ). Файлы в `data/` сами по себе API не меняют. В админке (`/admin`) основное имя выбирается радиокнопкой напротив одного из четырёх написаний, статус цены — «официальная / ориентировочная / нет информации». При «нет информации» поле суммы недоступно, и в базе цена сохраняется пустой. У существующих школ основное имя по умолчанию английское; пустая цена стала `unknown`, остальные цены — `approximate`.

### Сид — файлы

Если при старте в `schools` 0 строк, сид читает:

| Файл | Назначение |
|---|---|
| `data/schools.csv` | Адрес, координаты, языки, стоимость, программа |
| `data/descriptions/{file-slug}.txt` | Описание (матч по старому файловому ключу) |
| `data/school-names.json` | Имена `en` / `ru` / `ge` / `de` |
| `src/i18n/index.ts` | Строки UI (не сид БД) |

В БД пишется латинский URL-slug (`newton-free-school`, `northern-school`, `intellect-plus`). Повторный старт при непустой таблице строки не дублирует.

Парсер CSV: `src/db/parse-csv.ts`, вызывается только из `src/db/seed.ts`.

## Клиент

Точка входа: `src/main.tsx` (`BrowserRouter`) → `src/App.tsx`.

Список школ и ключ Яндекса загружаются один раз (`GET /api/schools`, `GET /api/config`). Описание — при открытии карточки по латинскому slug. Имена приходят в поле `names` ответа API (`useSchoolTranslations`), не из бандла `school-names.json`.

Чёрным показывается основное имя: `names[nameLocale]`. Серым — перевод на язык страницы, и только если он непустой и отличается от основного. В выдаче ассистента серой строки нет: и карточки, и заголовки сравнения используют основное имя. Цена в каталоге и у ассистента сопровождается статусом: официальная, ориентировочная или «нет информации».

В балунах карты HTML экранируется (`src/lib/escapeHtml.ts`). Клик по школе на карте ведёт на `/{lang}/schools/{slug}`.

## Сервер

`server.ts` слушает `PORT` (по умолчанию 3000) на `0.0.0.0`. Сначала `prepareDatabase()`.

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/health` | Проверка живости |
| GET | `/api/schools` | Список из БД: `slug`, координаты, поля карточки, `nameLocale`, `costStatus`, `names: { en, ru, ge, de }` (без описаний) |
| GET | `/api/schools/:slug/description` | Текст описания; query `locale` |
| GET | `/api/config` | Ключ Yandex Maps |
| GET | `/api/visits` | Текущее число посещений |
| POST | `/api/visits` | +1 в `site_stats`, вернуть новое значение |
| POST | `/api/assistant` | Диалог подбора: тело `{ locale, messages }`, ответ `{ reply, schools, comparison }` |

Slug: только `[a-z0-9-]+` (кириллица и `../` → 400). Неизвестная школа → 404.

Режимы:

- `npm run dev` — не production, Vite middleware;
- `npm run build` затем `npm start` — статика из `dist/`, SPA fallback на `index.html`.

## Счётчик посещений

Клиент (`Footer.tsx`) один раз за вкладку вызывает `POST /api/visits` и ставит флаг в `sessionStorage`. Обновление страницы идёт через `GET` и не увеличивает число.

Сервер пишет в `site_stats` (`key = visits`) атомарно в SQL. IP не сохраняются. Файл `stats.json` не используется.

## Внешние сервисы

Обязательная внешняя зависимость в UI — **Yandex Maps**. Ключ: `YANDEX_MAPS_API_KEY` в `.env`, клиенту отдаётся через `/api/config`. В кабинете Яндекса ключ нужно ограничить боевым доменом.

Ассистент на `/{lang}/assistant` опционален. `OPENAI_API_KEY` остаётся на сервере. Модель по умолчанию `gpt-4o-mini` (`OPENAI_MODEL`). Без ключа `POST /api/assistant` отвечает 503.

Postgres — локально на Windows или контейнер `db` на VPS.

## Локализация

Языки: английский, русский, грузинский (`ge`), немецкий. Источник истины для UI — префикс URL. Запасной язык — английский.

Описания школ в сиде — на языке оригинала из `.txt`; в рантайме отдаётся запись перевода (пока один и тот же текст на все локали).

## Безопасность

- секреты не попадают в клиентский бандл, кроме ключа Яндекса;
- slug API ограничен латинским алфавитом с дефисом;
- `.env` не коммитится;
- GET API не пишет файлы на диск.

## Локальный запуск (Windows, без Docker)

Docker Desktop не нужен. `Dockerfile` / `docker-compose.yml` на этой машине не запускаем.

1. Установить PostgreSQL 16 на хост (например `winget install --id PostgreSQL.PostgreSQL.16`).
2. Создать роль и БД, совпадающие с `.env` (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`).
3. Скопировать `.env.example` в `.env`. Заполнить `YANDEX_MAPS_API_KEY`. Локальный `DATABASE_URL` — хост **`127.0.0.1`**, не `localhost` (на Windows `localhost` может резолвиться в IPv6 `::1` и соединение падает). Пример:

   `DATABASE_URL=postgres://tbilisi:change_me@127.0.0.1:5432/tbilisi`

4. `npm install`
5. Разработка: `npm run dev` — сайт на http://localhost:3000. Миграции и сид (если школ 0) выполняются сами.
6. Продакшен локально: `npm run build` затем `npm start`.

Ручные команды (не обязательны, если уже вызван `dev` / `start`):

```bash
npm run db:migrate
npm run db:seed
```

Переменные — как в `.env.example`: `YANDEX_MAPS_API_KEY`, `PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`.

## Ассистент

Страница `/{lang}/assistant`. Клиент отправляет историю диалога на `POST /api/assistant` (не больше 12 сообщений, история в базе не хранится). Модель вызывает инструмент `search_schools`, а сервер сам фильтрует каталог. Подробности — в [assistant.md](./assistant.md).

## VPS

Файлы `Dockerfile` и `docker-compose.yml` уже в репозитории. Их гоняют **только на Ubuntu VPS**, после закрытия локальных этапов L0–L5. Локально Compose не используем.

На сервере хост БД в `DATABASE_URL` — `db` (имя сервиса Compose), не `127.0.0.1`. Старт:

```bash
docker compose up --build -d
```

Контейнер приложения: migrate → сид если пусто → listen, healthcheck `GET /health`. Подробности выкладки — этапы V1–V3 в [implementation-checklist.md](./implementation-checklist.md).
