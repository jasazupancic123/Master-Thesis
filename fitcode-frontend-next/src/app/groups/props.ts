import { GroupDateFilter } from '@/common/type/filter.type';
import { SetState } from '@/common/type/state.type';
import { Group } from '@/controller/group/type/group.type';
import { User } from '@/controller/user/type/user.type';

export interface GroupPageProps {
  token: string;
  groups: Group[];
}

export interface GroupDateFilterButtonGroupProps {
  filter: GroupDateFilter;
  setFilter: SetState<GroupDateFilter>;
}
