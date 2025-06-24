import { PeriodizationType } from '../../training/enum/periodization-type.enum';

export type Periodization = {
  type: PeriodizationType;
  basePeriodizationTrainingIds: { componentId: string; trainingId: string }[];
};