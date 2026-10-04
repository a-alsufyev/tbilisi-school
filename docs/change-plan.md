# План изменений: URL, база данных, Docker

**Статус:** утверждён, можно реализовывать.  
Исходные варианты и обсуждение сжаты. Отклонённое не делаем.

Связанный документ: [architecture.md](./architecture.md) — обновить после внедрения.

---

## Решения

| # | Тема | Решение |
|---|---|---|
| 1 | Формат URL | `/{lang}/schools/{slug}` |
| 2 | Редирект `/` | Язык браузера, если `en\|ru\|ge\|de`, иначе `/en` |
| 3 | Путь карты | `/{lang}` — карта на корне языка |
| 4 | СУБД | PostgreSQL + Drizzle. Локально — Postgres на Windows, в проде — контейнер в Compose |
| 5 | users / comments | Не создавать живые таблицы. Заготовка: [schema-next.md](./schema-next.md), сразу под email/пароль и Google |
| 10 | Авторизация | Код, сессии и OAuth не в этой волне. В URL зарезервировать `/login`, `/register`. HTTPS — когда будем делать вход через Google |
| 6 | CSV / TXT / JSON | Оставить в git как сид и бэкап контента. В рантайме источник — БД |
| 7 | Хостинг | VPS + Docker Compose (Ubuntu, Docker уже есть) |
| 8 | Nginx / HTTPS | Не в этой волне |
| 9 | Пустая БД при старте | Автосид из CSV/описаний/имён, если в `schools` 0 строк |
| 11 | Локальная разработка | Без Docker: Node + Postgres на Windows. Docker только на VPS |

---

## 1. URL

Библиотека: `react-router-dom`. Язык в пути, школа по **латинскому kebab-case slug**, не по числовому id и не по текущим `северная_школа`.

```
/                         → редирект на /{lang}
/{lang}                   → карта
/{lang}/schools           → каталог
/{lang}/schools/{slug}    → карточка школы
/{lang}/directory         → справочник
/{lang}/about             → о проекте
```

Зарезервировать (не занимать slug школ, не делать страницы сейчас):

```
/{lang}/login
/{lang}/register
/{lang}/account
```

`lang` ∈ `en | ru | ge | de`. Неизвестный язык или slug — 404 внутри SPA (или редирект языка на `en`).

Смена языка в шапке меняет только префикс: `/ru/schools/newton-free-school` → `/ge/schools/newton-free-school`. i18next синхронизировать с `:lang`.

Slug задаётся явно при сиде (например `northern-school`, `intellect-plus`, `newton-free-school`). Старые файловые slug с кириллицей в URL не используем.

Express в production уже отдаёт `index.html` на `*`. В dev Vite SPA тоже. Дополнительный rewrite не нужен, кроме того что API регистрируется до статики.

Навигация в `Header` — `<Link>`, не `setActiveTab`. Состояние «выбранная школа» берётся из URL, не из React state как источник истины.

---

## 2. База данных

- PostgreSQL 16 в Compose, том `pgdata`.
- ORM: Drizzle.
- Подключение: `DATABASE_URL`.
- Миграции при старте контейнера приложения, затем HTTP-сервер.
- Сид: если `SELECT count(*) FROM schools = 0`, залить из `data/schools.csv`, `data/descriptions/*.txt`, `data/school-names.json`. Повторный `up` существующие строки не дублирует.
- Файлы в `data/` не удаляем.

### Таблицы первой волны

**schools**

- `id` UUID PK
- `slug` TEXT UNIQUE NOT NULL  — для URL, латиница
- `address` TEXT
- `lat` DOUBLE PRECISION NULL
- `lng` DOUBLE PRECISION NULL
- `languages` TEXT
- `cost` TEXT NULL
- `program` TEXT NULL
- `created_at` / `updated_at`

**school_translations**

- `school_id` FK → schools
- `locale` TEXT  — `en` | `ru` | `ge` | `de`
- `name` TEXT NOT NULL
- `description` TEXT NOT NULL DEFAULT ''
- UNIQUE (school_id, locale)

**site_stats**

- `key` TEXT PK  — например `visits`
- `value` INTEGER NOT NULL DEFAULT 0

Счётчик: `POST /api/visits` делает `UPDATE site_stats SET value = value + 1 WHERE key = 'visits'` (атомарно в SQL). Файл `data/stats.json` больше не используется.

### API

Сохраняем контракт, меняем источник:

- `GET /api/schools` — из БД, в ответе `slug`, координаты, поля карточки, имена по локалям или имя для текущего языка (уточнить в реализации: проще отдать все `names: { en, ru, ge, de }` и `description` не тащить в список).
- `GET /api/schools/:slug/description?locale=ge` или описание в деталке отдельным полем — slug в пути вместо произвольного identifier.
- `GET /api/config` — без изменений.
- `GET|POST /api/visits` — таблица `site_stats`.

Проверка slug: только `[a-z0-9-]+`.

### Заготовка на пользователей (не внедрять сейчас)

Схема: [schema-next.md](./schema-next.md). Рассчитана на регистрацию email/пароль и вход через Google в одной таблице `users` (`password_hash` и `google_id` оба nullable). Миграцию, сессии, Passport/Better Auth и Google Client ID в этой волне не подключаем.

---

## 3. Docker (VPS + Compose)

Состав: **app** + **db**. Без nginx.

**Dockerfile** — multi-stage:

1. build: `npm ci`, `vite build`;
2. runtime: Node, копировать `dist/`, `server.ts` (или собранный JS), `data/` для сида, `drizzle` миграции. Не копировать `.env`.

**docker-compose.yml:**

- `db`: `postgres:16-alpine`, volume, `POSTGRES_USER/PASSWORD/DB`, healthcheck `pg_isready`;
- `app`: `depends_on: db (service_healthy)`, `env_file` / environment, ports `3000:3000`, healthcheck `GET /health`;
- сеть общая.

**`.dockerignore`:** `node_modules`, `dist`, `.git`, `.env`, `docs` можно включить в образ по желанию (не обязательно).

Переменные рантайма:

```
NODE_ENV=production
PORT=3000
YANDEX_MAPS_API_KEY=
DATABASE_URL=postgres://...@db:5432/tbilisi
```

Старт app-контейнера: migrate → (seed if empty) → listen.

**Локально Docker не нужен.** На Windows: Postgres 16 с хоста + `npm run dev`, в `.env` `DATABASE_URL=...@localhost:5432/tbilisi`.  
`Dockerfile` и `docker-compose.yml` гоняем на VPS (`docker compose up --build -d`).

---

## Порядок работ

Последовательность: [implementation-checklist.md](./implementation-checklist.md). Сначала локальные этапы L0–L5, затем VPS (V1–V3). Не перескакивать и не мешать Docker-тесты с Windows.

Локально:

1. Postgres на Windows.
2. Drizzle: схема, миграции, сид, API из БД, визиты.
3. React Router и латинские slug.
4. Файловый парсер только в сиде.
5. Обновить `docs/architecture.md` (локальный запуск).

На VPS (после L5):

6. Compose + образ, healthcheck.
7. `docker compose up --build`, сид, проверка URL и визитов.
8. Документация выкладки.

Параллельный файловый режим в проде не поддерживаем.

---

## Вне скоупа этой волны

- Регистрация, сессии, вход через Google (см. [schema-next.md](./schema-next.md))
- Комментарии, рейтинги
- Nginx, TLS, домен — понадобятся перед Google OAuth в проде
- Нормализация валют и цен в отдельные колонки
- Фильтры каталога (можно позже, URL уже будут готовы к query: `/{lang}/schools?program=ib`)
