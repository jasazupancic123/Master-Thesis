import type { DragEndEvent } from '@dnd-kit/core';
import type { Dayjs } from 'dayjs';

import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { Method } from '@/core/exercise/type/method.type';
import type { Cycle } from '@/core/institution/type/cycle.type';
import type { Group } from '@/core/institution/type/group.type';
import type { MainSet } from '@/core/training/enum/main-set.enum';
import type { Subgroup } from '@/core/training/type/subgroup.type';
import type { Superset } from '@/core/training/type/superset.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { TrainingProtocol } from '@/core/training/type/training-protocol.type';
import type { UserProgress } from '@/core/training/type/workload.type';
import type { User } from '@/core/user/type/user.type';
import type { Day } from '@/lib/common/service/date.util';
import type { GroupDateFilter } from '@/lib/common/type/filter.type';
import type { Pagination } from '@/lib/common/type/paginate.type';
import type { SetState, SetStateNullable } from '@/lib/common/type/state.type';

export type GroupIdPageParams = { params: Promise<{ group_id: string }> };

export interface GroupIdPageProps {
  group: Group;
  trainings: Training[];
}

export type GroupContextProps = GroupIdPageProps & {
  filter: GroupDateFilter;
  setFilter: SetState<GroupDateFilter>;
  group: Group;
  setGroup: SetState<Group>;
  selectedGroup: Group;
  setSelectedGroup: SetState<Group>;
  cycle: Cycle | undefined;
  setCycle: SetStateNullable<Cycle>;
  dateFrom: Dayjs;
  setDateFrom: SetState<Dayjs>;
  dateTo: Dayjs;
  setDateTo: SetState<Dayjs>;
  filteredUsers: User[];
  setFilteredUsers: SetState<User[]>;
  detectedChanges: boolean;
  setDetectedChanges: SetState<boolean>;
  handleMoveTraining: (e: DragEndEvent) => Promise<void>;
};

export type TrainerDayViewContextProps = {
  day: Day;
  setDay: SetState<Day>;
  training: Training | undefined;
  setTraining: SetStateNullable<Training>;
  progress: UserProgress[];
  selectedPeriod: { key: Date; value: 'AM' | 'PM' } | undefined; // selected period for the training
  setSelectedPeriod: SetState<{ key: Date; value: 'AM' | 'PM' } | undefined>;
  component: TrainingComponent | undefined; // selected training component
  setComponent: SetStateNullable<TrainingComponent>;
  selectedExerciseIds: string[]; // selected exercises in the component
  setSelectedExerciseIds: SetState<string[]>;
  supersets: Superset[]; // supersets of the selected component
  setSupersets: SetState<Superset[]>;
  selectedAthlete: User | undefined;
  setSelectedAthlete: SetStateNullable<User>;
  selectedSubgroup: Subgroup | null;
  setSelectedSubgroup: SetState<Subgroup | null>;
  filteredExercises: Exercise[];
  setFilteredExercises: SetState<Exercise[]>;
  pagination: Pagination;
  setPagination: SetState<Pagination>;
  search: string;
  setSearch: SetState<string>;
  protocols: TrainingProtocol[];
  setProtocols: SetState<TrainingProtocol[]>;
  previousSelectedAthlete: React.RefObject<User | undefined>;
  expandedExercisesView: boolean;
  setExpandedExercisesView: SetState<boolean>;
  loading: boolean;
  setLoading: SetState<boolean>;
  handleAddMember: (user: User) => Promise<void>;
  handleRemoveMember: (user: User) => Promise<void>;
  addTrainingExercises: (
    exercises: TrainingExercise[],
    mainSet: MainSet,
    options: { warmup: boolean; cooldown: boolean }
  ) => void;
  deleteSupersetExercise: (
    exerciseId: string,
    supersetIndex: number,
    exerciseIndex: number
  ) => void;
  addWarmupSuperset: () => void;
  addCooldownSuperset: () => void;
  applyMethod: (method: Method | undefined) => void;
  changeSupersetMainSet: (supersetIndex: number, mainSet: MainSet) => void;
  getGrid2DivisionNumber: () => number;
};
