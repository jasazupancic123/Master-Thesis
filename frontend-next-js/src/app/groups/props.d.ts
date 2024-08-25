import { User } from '@/type/user.type';
import { Group } from '@/type/group.type';
import { Cycle } from '@/type/cycle.type';
import { SetState } from '@/type/react-state.type';
import { Training } from '@/type/training.type';
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