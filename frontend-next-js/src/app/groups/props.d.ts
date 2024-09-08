import { User } from '@/user/type/user.type';
import { Group } from '@/group/type/group.type';
import { Cycle } from '@/group/type/cycle.type';
import { SetState } from '@/common/type/react-state.type';
import { Training } from '@/training/type/training.type';
import { TrainingFilter } from '@/app/groups/components/training-filter';
import { Dayjs } from 'dayjs';

export type GroupPageProps = {
  selected: {
    group?: Group | null,
    subgroup?: Group | null,
    cycle?: Cycle | null,
    cycles: Cycle[],
    trainings: Training[],
  },
  loading: boolean,
  setLoading: SetState<boolean>,
  setSelected: SetState<GroupPageProps['selected']>,
  users: User[],
  setUsers: SetState<User[]>,
  groups: Group[],
  setGroups: SetState<Group[]>,
  filter: TrainingFilter,
  setFilter: SetState<TrainingFilter>,
  date: {
    start: Dayjs,
    end: Dayjs,
    custom: boolean,
  },
  setDate: SetState<GroupPageProps['date']>,
}