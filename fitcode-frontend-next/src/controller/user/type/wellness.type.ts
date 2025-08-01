export interface Wellness {
  userId: string;
  date: Date;
  weight?: number;
  sleep?: number;
  fatigue?: number;
  soreness?: number;
  comment?: string;
}

export type CreateWellness = Pick<
  Wellness,
  'date' | 'weight' | 'sleep' | 'fatigue' | 'soreness' | 'comment'
>;
