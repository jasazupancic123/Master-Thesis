import type { Group } from '@/group/entity/group.entity';
import type { Cycle } from '@/group/entity/cycle.entity';
import type { SetState } from '@/common/type/state.type';
import type { User } from '@/user/type/user.type';
import type { TrainingFilter } from '@/app/groups/components/training-filter';
import { Dayjs } from 'dayjs';
import { Subgroup } from '@/group/entity/subgroup.entity';
import { useFetch } from '@/hook/use-fetch';

export type GroupPageProps = {
  users: ReturnType<typeof useFetch<User[]>>, // users, loading, error, fetchData, setData
  groups: ReturnType<typeof useFetch<Group[]>>, // groups, loading, error, fetchData, setData
  filter: TrainingFilter, // filter by year, month, week, day
  setFilter: SetState<TrainingFilter>,
  selected: {
    group: Group | null, // active group with populated subgroups, members, cycles and trainings
    subgroup: Subgroup | null, // active subgroup from selected group
    cycle: Cycle | null, // active cycle from selected subgroup (also has filtered trainings by date)
  },
  setSelected: SetState<GroupPageProps['selected']>,
  date: {
    start: Dayjs,
    end: Dayjs,
    custom: boolean,
  },
  setDate: SetState<GroupPageProps['date']>,
}