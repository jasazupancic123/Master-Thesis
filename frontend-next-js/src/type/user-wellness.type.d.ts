export interface UserWellness {
  id: string;
  userId: string;
  date: Date;
  sleep?: number;
  fatigue?: number;
  soreness?: number;
  comment?: string;
}