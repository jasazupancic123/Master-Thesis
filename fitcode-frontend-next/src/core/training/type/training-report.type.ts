import type { PrescribedTrainingStats } from './training-stats.type';
import type { ExerciseMuscleValue } from '@/core/exercise/type/exercise-muscle-value.entity';
import type { Cycle } from '@/core/group/type/cycle.type';
import type { Group } from '@/core/group/type/group.type';
import type { Institution } from '@/core/institution/type/institution.type';
import type { DateRange } from '@/lib/common/type/date-range.type';

export type TrainingReport = PrescribedTrainingStats &
  Required<DateRange> & {
    // meta
    institutionId?: string;
    institution?: Institution;
    groupId?: string;
    group?: Group;
    cycleId?: string;
    cycle?: Cycle;
    trainingId: string;
    userId: string;

    // report data
    completed: boolean;
    realization: number;
    muscleValues: ExerciseMuscleValue[];
    componentStatuses: TrainingReportComponentStatus[]; // list of completed component ids, just for frontend display
    photoURLs?: string[]; // "best" photo(s) of the training session
  };

export enum TrainingComponentStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export type TrainingReportComponentStatus = {
  componentId: string;
  status: TrainingComponentStatus;
};
