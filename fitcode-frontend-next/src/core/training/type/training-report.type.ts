import type { TrainingStats } from './training-stats.type';
import type { DateRange } from '@/lib/common/type/date-range.type';
import type { ExerciseMuscleValue } from '@/core/exercise/type/muscle-tip.type';
import type { Cycle } from '@/core/group/type/cycle.type';
import type { Group } from '@/core/group/type/group.type';
import type { Institution } from '@/core/institution/type/institution.type';

export type TrainingReport = TrainingStats &
  Required<DateRange> & {
    institutionId?: string;
    institution?: Institution;
    groupId?: string;
    group?: Group;
    cycleId?: string;
    cycle?: Cycle;

    trainingId: string;
    userId: string;
    completed: boolean;
    duration: number; // in minutes
    components: number;
    exercises: number;
    sets: number;
    reps: number;
    recTime: number;

    // calculated fields
    tut: number; // total time under tension
    tonnage: number;
    realization: number;

    muscleValues: ExerciseMuscleValue[];
    componentStatuses: TrainingReportComponentStatus[]; // list of completed component ids, just for frontend display
    photoURLs?: string[]; // "best" photo(s) of the training session
    timeVol?: number; // total time prescribed (in seconds)
    distVol?: number; // total distance prescribed (in meters)
    recDist?: number; // total recovery distance prescribed (in meters)
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
