# Чек-лист реализации

ТЗ: [change-plan.md](./change-plan.md).  
Авторизация: [schema-next.md](./schema-next.md) — не в этой волне.

Сначала **локально** (Windows, Node, Postgres, без Docker).  
Потом **VPS** (Ubuntu, Docker Compose).  
Этапы внутри блока — строго по порядку. VPS не начинать, пока не закрыты локальные L0–L5.

Отмечать: `[x]` сделано, `[ ]` нет.

---

# Часть A. Локально

Docker Desktop не ставим. `Dockerfile` / `docker-compose.yml` в репозитории уже есть — на этой машине их не запускаем.

---

## L0. Перед стартом

- [x] Прочитан [change-plan.md](./change-plan.md)
- [x] Локально без Docker, Docker только на VPS
- [x] В `.env` есть `YANDEX_MAPS_API_KEY`
- [x] Порт 3000 свободен
- [x] В `.env` и `.env.example` есть `DATABASE_URL` на `127.0.0.1`

**Готово, когда:** можно вызывать `npm run dev`. Postgres нужен с L1.

---

## L1. PostgreSQL на Windows

Цель: локальная база, как в `.env` (`tbilisi` / `localhost:5432`).

### Чек-лист

- [x] PostgreSQL 16 установлен (например `winget install --id PostgreSQL.PostgreSQL.16`)
- [x] Созданы роль и БД, совпадающие с `.env` (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`)
- [x] `DATABASE_URL=postgres://...@127.0.0.1:5432/...` подключается
- [x] `npm run dev` открывает сайт на :3000 (пока файловый API — нормально до L2)

### Тест-кейсы

| ID | Шаги | Ожидание |
|---|---|---|
| TL1.1 | Подключение к `127.0.0.1:5432` пользователем из `.env` | Успех — **пройден** |
| TL1.2 | `.env` не в git (`git check-ignore .env`) | Игнорируется — **пройден** |
| TL1.3 | `npm run dev` | UI на http://localhost:3000 — **пройден** (`/health` OK, `/` и `/api/schools` 200) |

**Готово, когда:** Postgres слушает localhost, `npm run dev` стартует.

---

## L2. Drizzle, сид, API из БД, визиты

Цель: `npm run dev` читает Postgres. CSV/TXT/JSON — только сид. `stats.json` не используется.

### Чек-лист

- [x] Пакеты: `drizzle-orm`, `drizzle-kit`, драйвер `postgres` (или `pg`)
- [x] Схема: `schools`, `school_translations`, `site_stats` — **без** `users` / `comments`
- [x] Миграции в репозитории, `npm run db:migrate`
- [x] Старт dev-сервера: migrate → сид если 0 школ → listen
- [x] Сид из `data/schools.csv`, `data/descriptions/*.txt`, `data/school-names.json`
- [x] Латинские slug (таблица ниже) в `schools.slug`
- [x] Повторный сид при непустой таблице **не** дублирует строки
- [x] `GET /api/schools` из БД: `slug`, `names: { en, ru, ge, de }`, без описаний в списке
- [x] `GET /api/schools/:slug/description` — slug `[a-z0-9-]+`
- [x] Кириллица и `../` в identifier → 400
- [x] `GET /api/config` без изменений
- [x] `GET/POST /api/visits` атомарно обновляет `site_stats` (`key = visits`)
- [x] `data/stats.json` не читается и не пишется
- [x] `parseSchoolsCsv` не в обработчиках API (только сид; вычистить импорты в L4)

### Карта slug для сида

| Бывший файловый ключ | URL-slug |
|---|---|
| `american_international_school_progress` | `american-international-school-progress` |
| `british_international_school_of_tbilisi` | `british-international-school-of-tbilisi` |
| `projector_school` | `projector-school` |
| `qsi_international_school` | `qsi-international-school` |
| `newton_free_school` | `newton-free-school` |
| `european_school_tbilisi` | `european-school-tbilisi` |
| `international_school_of_georgia__new_school_` | `international-school-of-georgia` |
| `buckswood_international_school` | `buckswood-international-school` |
| `finnish_international_school` | `finnish-international-school` |
| `интеллект_плюс` | `intellect-plus` |
| `happy_school` | `happy-school` |
| `globus_school` | `globus-school` |
| `северная_школа` | `northern-school` |
| `new_georgian_gymnasium` | `new-georgian-gymnasium` |
| `german_international_school_tbilisi` | `german-international-school-tbilisi` |
| `your_way_school` | `your-way-school` |
| `british_georgian_academy` | `british-georgian-academy` |

17 школ. Описания матчить по старому ключу файла, в БД писать новый slug.

### Тест-кейсы

Все — против `localhost:3000` и локального Postgres.

| ID | Шаги | Ожидание |
|---|---|---|
| TL2.1 | Пустая БД, `npm run dev` (или migrate + seed) | 17 строк в `schools`, у каждой 4 локали — **пройден** (17 школ, 68 переводов) |
| TL2.2 | Повторить запуск без очистки БД | По-прежнему 17 школ — **пройден** (`Skipping, 17 schools`) |
| TL2.3 | `GET /api/schools` | 17 объектов, латинский `slug`, `names.en/ru/ge/de` — **пройден** |
| TL2.4 | `GET /api/schools/newton-free-school/description` | 200, текст — **пройден** |
| TL2.5 | `GET /api/schools/северная_школа/description` | 400 — **пройден** |
| TL2.6 | `GET /api/schools/..%2Fpackage.json/description` | 400 — **пройден** |
| TL2.7 | `GET /api/schools/unknown-school/description` | 404 — **пройден** |
| TL2.8 | `GET /api/visits`, два `POST /api/visits` | `total` +2 — **пройден** (0→1→2) |
| TL2.9 | Перезапуск `npm run dev` | `GET /api/visits` — то же `total`, не 0 — **пройден** (осталось 2) |
| TL2.10 | `GET /api/config` | Поле `yandexMapsApiKey` — **пройден** |
| TL2.11 | Каталог в UI (вкладки, пока нет роутера) | Карточки и описания по новому slug — API готов, клики в браузере на localhost:3000 |

**Готово, когда:** API не читает CSV в запросах, визиты в Postgres, повторный запуск без дублей.

---

## L3. React Router и латинские slug

Цель: ссылку на школу и язык можно скопировать из адресной строки. Проверка в браузере на localhost.

### Чек-лист

- [x] `react-router-dom`
- [x] Маршруты:
  - `/` → язык браузера, если `en\|ru\|ge\|de`, иначе `/en`
  - `/{lang}` карта
  - `/{lang}/schools` каталог
  - `/{lang}/schools/:slug` карточка
  - `/{lang}/directory`
  - `/{lang}/about`
- [x] Невалидный `lang` → редирект на `/en` + тот же хвост пути
- [x] Неизвестный slug → 404 в SPA, URL не подменять каталогом
- [x] Header: `<Link>`, не `setActiveTab`
- [x] Смена языка меняет только префикс
- [x] i18next берёт язык из `:lang`
- [x] Клик по метке → `/{lang}/schools/{slug}`
- [x] `/{lang}/login`, `/register`, `/account` не заняты школами (404 ок)
- [x] Клиент ходит в API только с латинским slug
- [x] Имена из `names` в ответе API, не из бандла `school-names.json` (импорт убрать в L4)

### Тест-кейсы

| ID | Шаги | Ожидание |
|---|---|---|
| TL3.1 | Открыть `http://localhost:3000/` при языке браузера `ru` | Редирект на `/ru`, карта — **пройден** (Edge headless, язык RU) |
| TL3.2 | То же при языке `fr` | Редирект на `/en` — **пройден** (`fr` не в `en\|ru\|ge\|de` → `en`) |
| TL3.3 | `/ge/schools` | Каталог, UI на грузинском — **пройден** |
| TL3.4 | `/ge/schools/newton-free-school` | Карточка Newton, язык GE — **пройден** |
| TL3.5 | Скопировать URL из TL3.4 в новое окно | Та же школа, тот же язык — **пройден** (прямой заход на URL) |
| TL3.6 | На `/ru/schools/northern-school` нажать GE | `/ge/schools/northern-school` — **пройден** (префикс: `/ru/schools/northern-school` → `/ge/...`) |
| TL3.7 | Клик по школе на карте `/de` | `/de/schools/{slug}` — **пройден** (`/de` карта; клик ведёт на `/{lang}/schools/{slug}`) |
| TL3.8 | Назад с карточки | Предыдущая история, не пустой state — **пройден** (`navigate(-1)`, иначе список) |
| TL3.9 | `/xx/schools` | Редирект на `/en/schools` — **пройден** |
| TL3.10 | `/en/schools/does-not-exist` | 404 в UI — **пройден** («School not found», URL не сменён на каталог) |
| TL3.11 | `/en/login` | Не карточка школы — **пройден** («Page not found») |
| TL3.12 | F5 на `/ru/directory` | Справочник, язык RU — **пройден** (прямой заход = F5) |
| TL3.13 | Футер: новая вкладка vs F5 | POST визита один раз за вкладку — **пройден** (`sessionStorage`, без изменений с L2) |

**Готово, когда:** школу на любом из четырёх языков открывает URL с localhost.

---

## L4. Файловый парсер только в сиде

Цель: локальный горячий путь не парсит CSV и не читает описания с диска.

### Чек-лист

- [x] `server.ts` / API не импортирует `parseSchoolsCsv` для запросов
- [x] Нет чтения `data/descriptions/*.txt` и `data/school-names.json` из обработчиков
- [x] Нет импорта `school-names.json` в клиентском бандле
- [x] Сид — единственное место чтения CSV/TXT/JSON школ
- [x] Код `stats.json` удалён
- [x] Нет fallback на кириллический файловый slug
- [x] `npm run lint` и `npm run build` без ошибок
- [x] `npm start` после `npm run build` отдаёт каталог из БД

### Тест-кейсы

| ID | Шаги | Ожидание |
|---|---|---|
| TL4.1 | Grep по `src/` и `server.ts`: `schools.csv`, `parseSchoolsCsv`, `stats.json`, `school-names.json` | Только сид / docs / `data/` — **пройден** (`parse-csv.ts` + `seed.ts`; в `server.ts` нет) |
| TL4.2 | Переименовать `data/schools.csv`, перезапустить **уже засиженный** `npm run dev` | `GET /api/schools` — 17 школ — **пройден** (порт 3001, CSV скрыт, `Skipping, 17`) |
| TL4.3 | Вернуть CSV, очистить таблицы школ, снова запустить | Сид создаёт 17 школ — **пройден** (`Inserted 17 schools`) |
| TL4.4 | `npm run lint` && `npm run build` | exit 0 — **пройден** |
| TL4.5 | `npm start`, открыть карточку | Описание и перевод имени есть — **пройден** (`/ru/schools/newton-free-school`, описание + `names.ru`) |

**Готово, когда:** заполненная БД обслуживает каталог без CSV; пустая БД заполняется сидом из файлов.

---

## L5. Документация (локальный запуск)

- [x] [architecture.md](./architecture.md): Postgres, Drizzle, URL; CSV не рантайм
- [x] Локальный запуск: Postgres на Windows + `npm run dev` / `npm start`
- [x] Схема и API совпадают с кодом
- [x] Ссылки на этот чек-лист и [schema-next.md](./schema-next.md)
- [x] Команды Docker в architecture — в разделе «VPS», не как способ локальной работы

### Тест-кейсы

| ID | Шаги | Ожидание |
|---|---|---|
| TL5.1 | Прочитать architecture.md | Нет «базы нет» / «только CSV» как текущей схемы — **пройден** |
| TL5.2 | Маршруты в docs = Header + router | Совпадают — **пройден** |
| TL5.3 | Env в docs = `.env.example` | Совпадают; локальный host — `127.0.0.1` — **пройден** |

**Готово, когда:** по architecture.md можно поднять проект на Windows без Docker.

---

# Часть B. VPS

Начинать после закрытия L0–L5. На сервере уже Ubuntu и Docker.

Файлы `Dockerfile`, `docker-compose.yml`, `.dockerignore` уже в репозитории (сделаны заранее). Здесь — проверка и выкладка.

---

## V1. Compose и образ на сервере

### Чек-лист

- [ ] Репозиторий на VPS, `.env` на сервере (пароли и ключ Яндекса, `DATABASE_URL` с хостом `db` задаёт compose)
- [ ] `docker compose config` валиден
- [ ] `docker compose up db -d` — Postgres healthy
- [ ] `docker build .` — `.env` не попал в образ
- [ ] Healthcheck `GET /health` в Dockerfile / compose
- [ ] Образ копирует миграции и `data/` для сида
- [ ] `app` зависит от `db` (`service_healthy`), порт 3000

### Тест-кейсы

| ID | Шаги | Ожидание |
|---|---|---|
| TV1.1 | `docker compose up db -d` | `db` healthy |
| TV1.2 | `docker compose exec db pg_isready -U tbilisi -d tbilisi` | `accepting connections` |
| TV1.3 | `docker compose restart db` | Снова healthy, volume жив |
| TV1.4 | `docker compose config` | Валидный YAML |
| TV1.5 | `docker build .` затем проверить, что в образе нет `.env` | Сборка ок, секретов нет |

**Готово, когда:** на VPS поднимается healthy Postgres, образ собирается без секретов.

---

## V2. Приложение в Compose, сид, прогон API и UI

### Чек-лист

- [ ] `docker compose up --build -d` — app + db
- [ ] Пустая БД засиживается сама (17 школ)
- [ ] Повторный `up` не плодит дубли
- [ ] Сайт открывается с VPS (порт 3000 или как пробросите)
- [ ] Выборочно повторить локальные сценарии: список школ, карточка по slug, визиты, URL языка

### Тест-кейсы

| ID | Шаги | Ожидание |
|---|---|---|
| TV2.1 | Чистый volume, `docker compose up --build -d` | 17 школ, 4 локали |
| TV2.2 | Повторный `up` без удаления volume | Снова 17 |
| TV2.3 | `GET /api/schools` с сервера | Как TL2.3 |
| TV2.4 | `GET /api/schools/newton-free-school/description` | 200 |
| TV2.5 | Два `POST /api/visits`, `docker compose restart app` | `total` не сбросился |
| TV2.6 | Открыть `/{lang}/schools/{slug}` в браузере | Как TL3.4 / TL3.5 |
| TV2.7 | Healthcheck контейнера `app` | healthy |

**Готово, когда:** прод на VPS совпадает с локальным поведением каталога и ссылок.

---

## V3. Документация выкладки

- [ ] В architecture.md: `docker compose up --build -d` на VPS, volume, переменные с хостом `db`
- [ ] В change-plan.md вверху: реализовано / выложено (по факту)

| ID | Шаги | Ожидание |
|---|---|---|
| TV3.1 | По architecture.md выкладка на чистый VPS | Хватает команд без чата |

---

## Не делать в этой волне

- `users`, `comments`, сессии, Google OAuth
- Nginx, TLS, домен
- Страницы login/register
- Фильтры каталога, нормализация валют

---

## Прогресс

| Этап | Где | Статус |
|---|---|---|
| L0 Подготовка | локально | сделано |
| L1 Postgres на Windows | локально | сделано |
| L2 Drizzle + сид + API | локально | сделано |
| L3 Роутер | локально | сделано |
| L4 Вычистка файлов | локально | сделано |
| L5 Документация | локально | сделано |
| V1 Compose на сервере | VPS | не начат |
| V2 App + сид на сервере | VPS | не начат |
| V3 Документация выкладки | VPS | не начат |
