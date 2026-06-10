export class UserDashboardDto {
  totalDefects: number;   // Всего задач (дефектов)
  activeDefects: number;  // В работе
  closedDefects: number;  // Закрыто
  overdueDefects: number; // Просрочено
  projectsCount: number;  // Проектов
}