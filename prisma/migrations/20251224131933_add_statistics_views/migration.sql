-- 1. Индексы для ускорения исходных выборок (ОБЯЗАТЕЛЬНО)
CREATE INDEX IF NOT EXISTS "idx_defect_project_status" ON "Defect"("project_id", "status");
CREATE INDEX IF NOT EXISTS "idx_defect_assignee" ON "Defect"("assignee_id");
CREATE INDEX IF NOT EXISTS "idx_defect_duedate" ON "Defect"("due_date");

-- 2. Материализованное представление: Статистика по Проекту
-- Считает: Всего, Открыто, Закрыто, Просрочено, % Прогресса
CREATE MATERIALIZED VIEW "project_stats_mv" AS
SELECT
    p.id AS project_id,
    COUNT(d.id) AS total_defects,
    -- Активные (Новые, В работе, На проверке)
    COUNT(CASE WHEN d.status IN ('NEW', 'IN_PROGRESS', 'ON_CHECK') THEN 1 END) AS active_defects,
    -- Закрытые
    COUNT(CASE WHEN d.status = 'CLOSED' THEN 1 END) AS closed_defects,
    -- Просроченные (Не закрытые и дедлайн прошел)
    COUNT(CASE WHEN d.status NOT IN ('CLOSED', 'CANCELED') AND d.due_date < NOW() THEN 1 END) AS overdue_defects,
    -- Эффективность (Процент закрытых от общего числа, исключая отмененные)
    CASE 
        WHEN COUNT(d.id) = 0 THEN 0
        ELSE ROUND(
            (COUNT(CASE WHEN d.status = 'CLOSED' THEN 1 END)::numeric / 
             NULLIF(COUNT(CASE WHEN d.status != 'CANCELED' THEN 1 END), 0) * 100), 
        2)
    END AS progress_percentage
FROM "Project" p
LEFT JOIN "Defect" d ON d.project_id = p.id
GROUP BY p.id;

-- Создаем уникальный индекс для быстрого поиска по MV
CREATE UNIQUE INDEX "idx_project_stats_id" ON "project_stats_mv"("project_id");


-- 3. Материализованное представление: Эффективность Участников (Рейтинг)
-- Считает статистику по каждому инженеру внутри проекта
CREATE MATERIALIZED VIEW "user_project_stats_mv" AS
SELECT
    d.project_id,
    d.assignee_id AS user_id,
    u.name AS user_name,
    u.email AS user_email,
    COUNT(d.id) AS total_assigned,
    COUNT(CASE WHEN d.status = 'CLOSED' THEN 1 END) AS completed,
    COUNT(CASE WHEN d.status NOT IN ('CLOSED', 'CANCELED') AND d.due_date < NOW() THEN 1 END) AS overdue,
    -- Рейтинг эффективности
    CASE 
        WHEN COUNT(d.id) = 0 THEN 0
        ELSE ROUND((COUNT(CASE WHEN d.status = 'CLOSED' THEN 1 END)::numeric / COUNT(d.id) * 100), 2)
    END AS efficiency_rate
FROM "Defect" d
JOIN "User" u ON d.assignee_id = u.id
WHERE d.assignee_id IS NOT NULL
GROUP BY d.project_id, d.assignee_id, u.name, u.email;

-- Индекс для фильтрации по проекту
CREATE UNIQUE INDEX "idx_user_stats_proj_user" ON "user_project_stats_mv"("project_id", "user_id");