<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Slaver Backend

## Описание

Slaver Backend — это NestJS API для системы управления работами, дефектами и исполнителями на предприятии или строительном объекте.

Сервис отвечает за регистрацию и вход пользователей, проекты/объекты, роли участников, дефекты/замечания, назначение ответственных, Kanban-статусы, комментарии, вложения к дефектам и статистику выполнения работ.

## Стек проекта

* NestJS 11
* TypeScript
* Prisma ORM
* PostgreSQL
* JWT-аутентификация
* Refresh-token cookies
* Passport JWT
* Argon2 / bcrypt
* S3-compatible storage для вложений
* Docker и Docker Compose
* Cron-задачи для обновления статистики

## Требования

* Docker и Docker Compose
* Node.js 22, если нужно запускать API без Docker
* PostgreSQL, если проект запускается локально без Docker
* S3-compatible storage для загрузки файлов, например Selectel, MinIO или AWS S3

## Важно про порт

Приложение в `src/main.ts` запускается на порту `4200`.

Если в `docker-compose.yml` указан проброс:

```yaml
ports:
  - "3000:3000"
```

его нужно заменить на:

```yaml
ports:
  - "4200:4200"
```

После этого API будет доступно по адресу:

```text
http://localhost:4200/api
```

## Быстрый запуск через Docker

Docker Compose поднимает:

* PostgreSQL 16
* backend-приложение
* отдельный volume для хранения данных PostgreSQL
* общую Docker-сеть для backend и базы данных

Создай `.env` в корне проекта:

```env
POSTGRES_USER=slaver
POSTGRES_PASSWORD=slaver
POSTGRES_DATABASE=slaver

JWT_SECRET=dev-jwt-secret-change-me

CLIENT_URL=http://localhost:3000

S3_ENDPOINT=http://localhost:9000
S3_REGION=ru-1
S3_BUCKET_NAME=slaver
S3_ACCESS_KEY=access-key
S3_SECRET_KEY=secret-key
```

Проверь, что в `docker-compose.yml` порт backend указан так:

```yaml
ports:
  - "4200:4200"
```

Поднять PostgreSQL и API:

```bash
docker compose up --build
```

После запуска будут доступны:

* API: `http://localhost:4200/api`
* PostgreSQL для подключения с хоста: `localhost:5434`

При старте backend-контейнер автоматически выполняет:

```bash
npx prisma migrate deploy
npm run start:prod
```

Остановить контейнеры:

```bash
docker compose down
```

Остановить контейнеры и удалить volume базы данных:

```bash
docker compose down -v
```

## Переменные окружения

Docker Compose использует переменные из `.env` и на их основе собирает строки подключения к PostgreSQL:

```env
POSTGRES_USER=slaver
POSTGRES_PASSWORD=slaver
POSTGRES_DATABASE=slaver
```

Внутри Docker-сети backend подключается к базе по адресу сервиса `postgres`:

```env
POSTGRES_URL=postgresql://slaver:slaver@postgres:5432/slaver?schema=public
DATABASE_URL=postgresql://slaver:slaver@postgres:5432/slaver?schema=public
```

Для подключения к базе из хоста используй:

```env
POSTGRES_URL=postgresql://slaver:slaver@localhost:5434/slaver?schema=public
DATABASE_URL=postgresql://slaver:slaver@localhost:5434/slaver?schema=public
```

Также проекту нужны переменные для JWT, invite-ссылок и S3-хранилища:

```env
JWT_SECRET=dev-jwt-secret-change-me
CLIENT_URL=http://localhost:3000

S3_ENDPOINT=http://localhost:9000
S3_REGION=ru-1
S3_BUCKET_NAME=slaver
S3_ACCESS_KEY=access-key
S3_SECRET_KEY=secret-key
```

## Локальный запуск без Docker

Установить зависимости:

```bash
npm install
```

Создать `.env`:

```env
POSTGRES_URL=postgresql://slaver:slaver@localhost:5434/slaver?schema=public
DATABASE_URL=postgresql://slaver:slaver@localhost:5434/slaver?schema=public

JWT_SECRET=dev-jwt-secret-change-me
CLIENT_URL=http://localhost:3000

S3_ENDPOINT=http://localhost:9000
S3_REGION=ru-1
S3_BUCKET_NAME=slaver
S3_ACCESS_KEY=access-key
S3_SECRET_KEY=secret-key
```

Сгенерировать Prisma Client:

```bash
npx prisma generate
```

Применить миграции:

```bash
npx prisma migrate deploy
```

Запустить API в development-режиме:

```bash
npm run start:dev
```

API будет доступно по адресу:

```text
http://localhost:4200/api
```

## Production-сборка без Docker

Сгенерировать Prisma Client:

```bash
npx prisma generate
```

Собрать проект:

```bash
npm run build
```

Применить миграции:

```bash
npx prisma migrate deploy
```

Запустить production-сборку:

```bash
npm run start:prod
```

## Полезные команды

```bash
# Development-запуск
npm run start:dev

# Обычный запуск через Nest
npm run start

# Production-сборка
npm run build

# Production-запуск
npm run start:prod

# Линтинг
npm run lint

# Форматирование
npm run format

# Unit-тесты
npm run test

# Unit-тесты отдельной командой
npm run test:unit

# E2E-тесты
npm run test:e2e

# Coverage
npm run test:cov

# Проверка Prisma-схемы
npx prisma validate

# Генерация Prisma Client
npx prisma generate

# Применение миграций
npx prisma migrate deploy
```

## Основные модули

* `auth` — регистрация, вход, выход, JWT access-token, refresh-token cookies.
* `user` — получение данных пользователя.
* `project` — CRUD проектов/объектов, участники, роли, инвайт-ссылки.
* `defect` — CRUD дефектов, фильтры, статусы, приоритеты, назначение исполнителей.
* `comment` — комментарии к дефектам.
* `attachments` — загрузка и удаление файлов через S3-compatible storage.
* `stats` — статистика по проектам и участникам.
* `common` — guards и decorators для авторизации и проверки доступа к проектам.
* `config` — конфигурация приложения.
* `prisma` — подключение к PostgreSQL через Prisma ORM.

## Основные сущности

### User

Пользователь системы. Может создавать проекты, участвовать в проектах, получать дефекты в работу, создавать замечания, оставлять комментарии и загружать вложения.

### Project

Проект или объект предприятия. Содержит название, описание, адрес, заказчика, сроки, владельца, участников и список дефектов.

### ProjectUser

Связь пользователя с проектом и его ролью.

Роли в проекте:

* `MANAGER` — менеджер, управляет проектом, участниками, задачами и отчетностью;
* `ENGINEER` — инженер или исполнитель, работает с дефектами и устранением замечаний;
* `OBSERVER` — наблюдатель или заказчик, получает доступ к просмотру.

### Defect

Дефект, замечание или рабочий тикет внутри проекта.

Дефект содержит:

* заголовок;
* описание;
* локацию;
* статус;
* приоритет;
* срок устранения;
* проект;
* автора;
* назначенного исполнителя;
* комментарии;
* вложения.

Статусы дефекта:

* `NEW` — новый;
* `IN_PROGRESS` — в работе;
* `ON_CHECK` — на проверке;
* `CLOSED` — закрыт;
* `CANCELED` — отменен.

Приоритеты:

* `LOW` — низкий;
* `MEDIUM` — средний;
* `HIGH` — высокий.

### Comment

Комментарий к дефекту. Используется для обсуждения задачи, уточнений и фиксации хода работ.

### Attachment

Файл, прикрепленный к дефекту. Поддерживаются изображения и PDF.

### Log

Запись действия пользователя. Нужна для аудита и истории изменений.

## Основная API-логика

### Авторизация

API использует JWT-аутентификацию.

Доступные сценарии:

* регистрация пользователя;
* вход по email и паролю;
* обновление access-token через refresh-token cookie;
* выход с очисткой refresh-token cookie.

### Проекты

Пользователь может создавать проекты/объекты. Создатель проекта автоматически становится менеджером.

В проекте можно:

* получать список своих проектов;
* смотреть один проект;
* обновлять проект;
* удалять проект;
* добавлять участников вручную;
* удалять участников;
* менять роли участников;
* создавать invite-ссылки;
* принимать invite-ссылки.

### Дефекты

Дефекты создаются внутри проекта и используются как тикеты для контроля работ.

Поддерживается:

* создание дефекта;
* получение списка дефектов проекта;
* фильтрация по статусу;
* фильтрация по приоритету;
* фильтрация по исполнителю;
* поиск по названию, описанию и локации;
* получение одного дефекта;
* обновление дефекта;
* удаление дефекта.

### Kanban

Для доски задач предусмотрено массовое обновление дефектов внутри проекта.

Это позволяет переносить карточки между статусами:

```text
NEW → IN_PROGRESS → ON_CHECK → CLOSED
```

Также дефект может быть переведен в статус:

```text
CANCELED
```

### Комментарии

К каждому дефекту можно добавлять комментарии.

Поддерживается:

* создание комментария;
* получение комментариев дефекта;
* обновление комментария;
* удаление комментария.

### Вложения

К дефектам можно прикреплять файлы.

Поддерживаемые типы:

* `jpg`
* `jpeg`
* `png`
* `pdf`

Максимальный размер файла:

```text
5 MB
```

Файл загружается в S3-compatible storage, а метаданные сохраняются в PostgreSQL.

### Статистика

Проект содержит отдельный модуль статистики.

Поддерживается:

* общая статистика по проекту;
* статистика по участникам;
* количество всех дефектов;
* количество активных дефектов;
* количество закрытых дефектов;
* количество просроченных дефектов;
* процент прогресса;
* эффективность участников.

Статистика хранится в PostgreSQL materialized views и автоматически обновляется cron-задачей раз в 10 минут.

Также есть ручное обновление статистики для менеджера проекта.
