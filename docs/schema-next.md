# Следующая схема: пользователи и комментарии

Не входит в текущую волну (Postgres + URL + Docker). Файл — чтобы не переделывать `users`, когда появятся email/пароль и Google.

## Зачем не делать это в коде сейчас

- Нет домена и HTTPS: Google OAuth в проде без них почти бесполезен.
- Пустые таблицы и библиотеки авторизации без экранов входа — мёртвый код.
- Текущей волне достаточно Postgres: пользователей туда добавим отдельной миграцией.

Что уже заложено в [change-plan.md](./change-plan.md): пути `/{lang}/login`, `/{lang}/register`, `/{lang}/account` не использовать под школы.

## users

Одна таблица на оба способа входа.

| Колонка | Тип | Заметки |
|---|---|---|
| `id` | UUID PK | |
| `email` | TEXT UNIQUE NOT NULL | Для Google берём email из профиля |
| `email_verified` | BOOLEAN NOT NULL DEFAULT false | true сразу для Google |
| `password_hash` | TEXT NULL | NULL, если пользователь только через Google |
| `google_id` | TEXT UNIQUE NULL | NULL, если только email/пароль |
| `name` | TEXT NULL | |
| `role` | TEXT NOT NULL DEFAULT `user` | `user` / `admin` |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

Ограничение: хотя бы одно из `password_hash` или `google_id` NOT NULL (CHECK). Позже можно привязать Google к уже существующему email.

Сессии лучше серверные (cookie httpOnly + таблица `sessions` или аналог в выбранной библиотеке), не JWT в localStorage. Конкретную библиотеку (Better Auth, Lucia, Passport) выбирать в волне авторизации, не сейчас.

Переменные, которые понадобятся тогда (не добавлять в `.env` этой волны):

```
SESSION_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://site.com/api/auth/google/callback
```

## comments

| Колонка | Тип |
|---|---|
| `id` | UUID PK |
| `school_id` | FK → schools |
| `user_id` | FK → users |
| `body` | TEXT NOT NULL |
| `hidden` | BOOLEAN NOT NULL DEFAULT false |
| `created_at` | TIMESTAMPTZ |

Модерация — флаг `hidden` или роль `admin`, не отдельный продукт в первой версии комментариев.

## Когда внедрять

1. Эта волна: каталог в Postgres, URL, Docker.
2. Nginx + HTTPS на VPS.
3. Миграция `users` + регистрация email/пароль.
4. Google OAuth (нужны callback URL и HTTPS).
5. Комментарии к школам.
