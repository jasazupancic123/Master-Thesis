import type { Group } from '@/group/entity/group.entity';
import type { Cycle } from '@/group/entity/cycle.entity';
import type { SetState } from '@/common/type/state.type';
import type { User } from '@/user/type/user.type';
import type { FilterType } from '@/group/type/filter.type';
import type { Subgroup } from '@/group/entity/subgroup.entity';
import { Dayjs } from 'dayjs';
import { useFetch } from '@/hook/use-fetch';

export type GroupPageProps = {
  loading: boolean,
  setLoading: SetState<boolean>,
  users: ReturnType<typeof useFetch<User[]>>, // users, loading, error, fetchData, setData
  groups: ReturnType<typeof useFetch<Group[]>>, // groups, loading, error, fetchData, setData
  filter: FilterType, // filter by year, month, week, day
  setFilter: SetState<FilterType>,
  selected: {
    group: Group | null, // active group with populated subgroups, members, cycles and trainings
    subgroup: Subgroup | null, // active subgroup from selected group
    cycle: Cycle | null, // active cycle from selected subgroup
  },
  setSelected: SetState<GroupPageProps['selected']>,
  date: {
    start: Dayjs,
    end: Dayjs,
    custom: boolean,
  },
  setDate: SetState<GroupPageProps['date']>,
}