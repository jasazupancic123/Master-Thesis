import type { SetState } from '@/common/type/state.type';
import { Dayjs } from 'dayjs';
import { useFetch } from '@/hook/use-fetch';
import { User } from '@/controller/user/type/user.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { FilterType } from './filter.type';

export type GroupPageSidebarProps = {
  loading: boolean;
  setLoading: SetState<boolean>;
  users: ReturnType<typeof useFetch<User[]>>; // users, loading, error, fetchData, setData
  groups: ReturnType<typeof useFetch<Group[]>>; // groups, loading, error, fetchData, setData
  filter: FilterType; // filter by year, month, week, day
  setFilter: SetState<FilterType>;
  selected: {
    group: Group | null; // active group with populated subgroups, members, cycles and trainings
    subgroup: Subgroup | null; // active subgroup from selected group
    cycle: Cycle | null; // active cycle from selected subgroup
  };
  setSelected: SetState<GroupPageSidebarProps['selected']>;
  date: {
    start: Dayjs;
    end: Dayjs;
    custom: boolean;
  };
  setDate: SetState<GroupPageSidebarProps['date']>;
  modal: {
    add_group: boolean;
    members: boolean;
    settings: boolean;
  };
  setModal: SetState<GroupPageSidebarProps['modal']>;
};
