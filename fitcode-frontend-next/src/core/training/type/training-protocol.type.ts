import type { Superset } from './superset.type';

export type TrainingProtocol = {
  id: string;
  institutionId?: string;
  name: string;
  componentId: string;
  description?: string;
  supersets: Superset[];
};

export type CreateTrainingProtocol = Pick<
  TrainingProtocol,
  'name' | 'componentId' | 'description' | 'supersets'
>;

export type UpdateTrainingProtocol = Partial<CreateTrainingProtocol>;
