export interface ProjectStatsView {
  project_id: string;
  total_defects: number; // приходит как string из BigInt (Postgres), надо парсить
  active_defects: number;
  closed_defects: number;
  overdue_defects: number;
  progress_percentage: number;
}

export interface UserStatsView {
  user_id: string;
  user_name: string;
  user_email: string;
  total_assigned: number;
  completed: number;
  overdue: number;
  efficiency_rate: number;
}