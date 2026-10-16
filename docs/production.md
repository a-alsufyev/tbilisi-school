# Выкладка на VPS

Порядок первого запуска каталога на Ubuntu VPS и переноса данных из среды разработки (Windows, PostgreSQL 16 на хосте).

Связанные документы: [architecture.md](./architecture.md) (как устроены контейнеры и restore), [implementation-checklist.md](./implementation-checklist.md) (этапы V1–V3).

Приложение и база уже описаны в репозитории: `Dockerfile`, `docker-compose.yml`, `deploy/restore.sh`. На сервере их собирают и запускают. Nginx в репозиторий не входит: его ставят на хост, перед контейнером.

## Что переносится

Источник боевого каталога — локальная база, в которой уже есть правки из админки. Файлы `data/schools.csv`, `data/descriptions/*.txt` и `data/school-names.json` остаются запасным сидом. На первом запуске VPS они базу не заполняют.

| Данные | Где лежат в разработке | Как попадают на VPS |
|---|---|---|
| Школы (`schools`) | Postgres | Дамп `deploy/tbilisi.dump`, один раз в пустой volume |
| Имена и описания (`school_translations`) | Postgres | Тот же дамп |
| Справочники (`lookup_items`, `school_lookup_items`) | Postgres | Тот же дамп |
| Счётчик визитов (`site_stats`) | Postgres | Тот же дамп |
| Журнал миграций Drizzle (`drizzle.__drizzle_migrations`) | Postgres | Тот же дамп. Уже применённые миграции на сервере повторно не выполняются |
| Обложки школ и районов | `public/schools/<slug>.jpg`, `public/districts/<id>.jpg` | Файлы в каталоге репозитория на сервере до сборки образа. Сейчас в git только `.gitkeep` |
| Сид CSV / TXT / JSON | `data/`, уже в git | Копируется в образ как запасной путь. Срабатывает только если в `schools` 0 строк |
| Секреты | локальный `.env` | Задаются заново на сервере. Файл `.env` и дамп в git не коммитятся |

Диалоги ассистента живут в `sessionStorage` браузера. Сессия админки — подписанная cookie, в базе её нет. Оба на сервер не переносятся. Счётчик неудачных входов админки хранится в памяти процесса и после перезапуска контейнера обнуляется.

Дамп снимают после того, как локальное приложение хотя бы раз стартовало на том же коммите, который поедет на сервер. Тогда журнал Drizzle совпадает с файлами в `drizzle/`. Более новый код на сервере догонит схему своими миграциями поверх восстановленных строк. Более старый код, чем схема в дампе, на старте может упасть.

## Перед выкладкой в репозитории

Две правки нужны до первой боевой сборки. Пока их нет в текущих файлах.

1. В стадии `build` файла `Dockerfile`, до `RUN npm run build`, добавить `COPY public ./public`. Vite кладёт содержимое `public/` в `dist/`, а Express в production отдаёт статику только из `dist/`. Без этой строки обложки, даже если они лежат рядом с репозиторием на сервере, в образ не попадут.
2. В `docker-compose.yml` у сервиса `app` заменить проброс порта на `127.0.0.1:3000:3000`. Сайт снаружи открывается через nginx. Порт 3000 на всех интерфейсах и порт 5432 снаружи не публикуются.

Пароль `POSTGRES_PASSWORD` Compose подставляет в `DATABASE_URL` как есть. В нём не должно быть `@`, `:`, `/` и пробелов. Для пароля базы, пароля админки и `SESSION_SECRET` подходит `openssl rand -hex 24` (для секрета сессии — `openssl rand -hex 32`).

## Сервер

Нужны Ubuntu, Docker Engine и плагин Compose, свободные 2 ГБ RAM и около 10 ГБ диска под образы и volume. DNS: A-запись домена на IP сервера, до запуска certbot.

Пользователь выкладки входит в группу `docker`. Каталог — например `/opt/tbilisi-school`.

Открытые порты хоста: 22, 80, 443. Порт Postgres наружу не открывать.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Снимок локальной базы

На Windows, в каталоге репозитория, из `.env` берутся пользователь, пароль и имя базы. Хост в `DATABASE_URL` — `127.0.0.1`. Клиент — PostgreSQL 16, та же major-версия, что образ `postgres:16-alpine`. Проверка: `pg_dump --version` печатает 16.

Записать числа. После восстановления на сервере они должны совпасть.

```powershell
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
& $psql -h 127.0.0.1 -p 5432 -U tbilisi -d tbilisi -c @"
select 'schools' as t, count(*) from schools
union all select 'school_translations', count(*) from school_translations
union all select 'lookup_items', count(*) from lookup_items
union all select 'school_lookup_items', count(*) from school_lookup_items
union all select 'site_stats', count(*) from site_stats
order by 1;
select key, value from site_stats order by key;
select count(*) as migrations from drizzle.__drizzle_migrations;
"@
```

Дамп в custom-формате, без владельцев и прав. Файл в git не входит (`.gitignore`, `.dockerignore`).

```powershell
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -h 127.0.0.1 -p 5432 -U tbilisi -d tbilisi -Fc --no-owner --no-acl -f deploy\tbilisi.dump
```

Рядом посмотреть обложки: всё, что лежит в `public\schools\*.jpg` и `public\districts\*.jpg`. Код обложки запрашивает только `.jpg`.

## Файлы на сервере

Репозиторий клонируют с того коммита, на котором снят дамп. Дамп в git не кладут.

```bash
sudo mkdir -p /opt/tbilisi-school
sudo chown "$USER:$USER" /opt/tbilisi-school
git clone <url-репозитория> /opt/tbilisi-school
cd /opt/tbilisi-school
```

С машины разработки, до первого `docker compose up`:

```powershell
scp deploy\tbilisi.dump user@server:/opt/tbilisi-school/deploy/tbilisi.dump
scp public\schools\*.jpg user@server:/opt/tbilisi-school/public/schools/
scp public\districts\*.jpg user@server:/opt/tbilisi-school/public/districts/
```

Если jpg нет, два последних вызова не нужны: карточки покажут градиент. `deploy/restore.sh` в git уже с переводами строк LF (`.gitattributes`). На сервере его не пересохранять из редактора Windows.

## Секреты

```bash
cp .env.example .env
```

Заполнить на сервере:

| Переменная | Значение |
|---|---|
| `YANDEX_MAPS_API_KEY` | Ключ карты. В кабинете Яндекса ограничить его боевым доменом |
| `POSTGRES_USER` | `tbilisi`, как в дампе и в примере |
| `POSTGRES_PASSWORD` | Новый пароль, hex, без `@`, `:`, `/` и пробелов |
| `POSTGRES_DB` | `tbilisi` |
| `ADMIN_USERNAME` | Имя входа в `/admin` |
| `ADMIN_PASSWORD` | Новый пароль админки |
| `SESSION_SECRET` | Длинная случайная строка. Её смена разлогинивает админку |
| `OPENAI_API_KEY` | Ключ ассистента. Пустое значение: страница ассистента отвечает 503, каталог работает |
| `OPENAI_MODEL` | По умолчанию `gpt-4o-mini` |

`DATABASE_URL` в файле можно оставить как в примере. Compose подменяет его на `postgres://…@db:5432/tbilisi` и этим перекрывает `.env`. Локальный файл `.env` с машины разработки на сервер не копировать.

В production cookie админки ставится с флагом `Secure`. Браузер сохранит её только по HTTPS. Вход в `/admin` проверяют по домену, после сертификата.

## Первый запуск базы и приложения

Дамп уже лежит в `deploy/tbilisi.dump`. Volume ещё нет.

```bash
docker compose config
docker compose up --build -d
docker compose ps
docker compose logs db
```

`docker compose config` показывает сервис `db` без проброса `5432` и сервис `app` на `127.0.0.1:3000`. В логах базы есть строка `Restore finished`.

Что происходит один раз, на пустом volume:

1. Образ Postgres создаёт роль и базу из `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.
2. Entrypoint выполняет `deploy/restore.sh`. Скрипт восстанавливает дамп: `pg_restore --no-owner --no-acl --exit-on-error --single-transaction`. Запись `SCHEMA public` из оглавления пропускается, потому что схему `public` уже создал entrypoint.
3. В базе оказываются схема, школы, переводы, справочники, связи, визиты и журнал Drizzle.
4. Контейнер `app` ждёт healthy `db`, затем при старте гоняет миграции. Записи, которые уже есть в дампе, повторно не применяются. Если в коммите есть более новые SQL-файлы, применяются только они.
5. Сид из CSV видит ненулевое число школ и пропускается.
6. `backfillStructuredCosts` дописывает структурную цену только тем строкам, где сумма пустая, а старое текстовое поле `cost` ещё разбирается. На уже разобранных школах он ничего не меняет.

Повторный `docker compose up` дамп не применяет: скрипт в `docker-entrypoint-initdb.d` выполняется только при пустом каталоге данных.

Если дампа нет или `pg_restore` падает, скрипт очищает каталог данных и контейнер `db` завершается с ошибкой. Приложение не стартует и пустую базу из CSV не заполняет. `restart: unless-stopped` поднимает `db` снова, init и restore повторяются. Достаточно положить исправленный дамп на место.

Если volume успел инициализироваться, а скрипт не смог очистить каталог, повторный restore возможен после удаления volume. Из каталога проекта:

```bash
docker compose down -v
```

Команда удаляет данные Postgres этого проекта. Перед ней нужен свежий дамп или отдельная копия, если в volume уже было что-то нужное.

## Проверка, что данные доехали

Числа — те же, что в снимке на Windows.

```bash
docker compose exec db psql -U tbilisi -d tbilisi -c "
select 'schools' as t, count(*) from schools
union all select 'school_translations', count(*) from school_translations
union all select 'lookup_items', count(*) from lookup_items
union all select 'school_lookup_items', count(*) from school_lookup_items
union all select 'site_stats', count(*) from site_stats
order by 1;
select key, value from site_stats order by key;
select count(*) as migrations from drizzle.__drizzle_migrations;
"
curl -fsS http://127.0.0.1:3000/health
curl -fsS http://127.0.0.1:3000/api/schools
curl -fsS http://127.0.0.1:3000/api/directory
curl -fsS http://127.0.0.1:3000/api/visits
```

Оба сервиса в `docker compose ps` — healthy. В ответе `/api/schools` есть школы из локальной базы, с теми же slug, координатами, ценами и справочниками. `/health` отвечает `OK`.

Дальше в браузере, уже по HTTPS:

- `/{lang}`, `/{lang}/map`, `/{lang}/schools`, карточка `/{lang}/schools/{slug}`, `/{lang}/directory`;
- обложка: файл `/schools/<slug>.jpg` или `/districts/<id>.jpg` открывается, если jpg копировали до сборки;
- `/admin` пускает по серверному логину и паролю и показывает те же школы и справочники;
- смена языка в шапке меняет только префикс URL.

## HTTPS

Nginx стоит на хосте и проксирует на `127.0.0.1:3000`. Приложение само отдаёт `index.html` для маршрутов SPA, отдельный fallback в nginx не нужен.

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

`/etc/nginx/sites-available/tbilisi-school`:

```nginx
server {
    listen 80;
    server_name schools.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`schools.example.com` заменить на боевой домен.

```bash
sudo ln -s /etc/nginx/sites-available/tbilisi-school /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d schools.example.com
```

Certbot добавляет редирект на HTTPS и продление сертификата. После этого в кабинете Яндекса ключ карты ограничивают этим доменом.

## Повторная выкладка кода

Volume `pgdata` сохраняется. Дамп второй раз не накатывается. Новые файлы в `drizzle/` применятся при старте `app`.

```bash
cd /opt/tbilisi-school
git pull
docker compose up --build -d
```

Новые jpg кладут в `public/schools` и `public/districts` до этой команды: они попадают в образ на этапе `vite build`.

Откат кода — `git checkout` предыдущего коммита и снова `docker compose up --build -d`. Миграция, которая уже записалась в `drizzle.__drizzle_migrations`, от отката файлов не отменяется. Коммит с такой миграцией откатывают только вместе с восстановлением базы из дампа, снятого до неё.

## Повторный перенос базы из разработки

Так обновляют боевой каталог целиком из локальной базы: школы, переводы, справочники, визиты и журнал миграций. Правки, сделанные уже на сервере в админке, и визиты, накопленные на сервере после первого запуска, этот перенос затирает. Перед этим снять резервную копию с VPS (команда ниже).

1. На Windows снять новый `deploy\tbilisi.dump` и записать свежие `count(*)`.
2. Скопировать файл на сервер поверх `deploy/tbilisi.dump`.
3. На сервере: `docker compose down -v`, затем `docker compose up --build -d`.
4. Сверить числа с новым снимком.

Пока volume жив, замена файла дампа сама по себе базу не обновляет.

## Резервные копии

Раз в сутки, с VPS, тем же форматом, которым восстанавливается первая база:

```bash
mkdir -p /var/backups/tbilisi-school
docker compose exec -T db pg_dump -U tbilisi -d tbilisi -Fc --no-owner --no-acl \
  > /var/backups/tbilisi-school/tbilisi-$(date +%F).dump
```

Копию уносят с сервера. Для возврата к ней кладут файл в `deploy/tbilisi.dump`, останавливают стек с удалением volume и поднимают снова, как при повторном переносе. Каталог `deploy/` с дампом в образ приложения не входит.

## Краткий порядок

1. В репозитории: `COPY public` в Dockerfile, порт приложения только на `127.0.0.1`.
2. На Windows снять counts и `pg_dump` в `deploy\tbilisi.dump`. Скопировать jpg, если они есть.
3. На VPS: clone, свой `.env`, дамп на месте, jpg на месте.
4. `docker compose up --build -d`. Дождаться `Restore finished` и healthy у обоих сервисов.
5. Сверить counts, `/health` и `/api/schools`.
6. Nginx и certbot на домен. Проверить сайт и `/admin` по HTTPS. Ограничить ключ Яндекса доменом.
7. Дальше код выкладывать через `git pull` и `docker compose up --build -d`. Базу из разработки заменять только новым дампом и `docker compose down -v`.
