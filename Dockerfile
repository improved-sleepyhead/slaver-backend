# --- Stage 1: Builder ---
FROM node:22-alpine AS builder

# Создаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости (npm ci надежнее npm install для CI/CD)
RUN npm ci

# Копируем исходный код
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Компилируем проект (TypeScript -> JavaScript в папку dist)
RUN npm run build

# Удаляем devDependencies, чтобы уменьшить размер образа (опционально, но полезно)
# RUN npm prune --production

# --- Stage 2: Production Runner ---
FROM node:22-alpine

WORKDIR /app

# Копируем только нужное из этапа builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Экспортируем порт (информативно)
EXPOSE 3000

# Команда запуска будет переопределена в docker-compose, 
# но по умолчанию запускаем прод-версию
CMD ["npm", "run", "start:prod"]