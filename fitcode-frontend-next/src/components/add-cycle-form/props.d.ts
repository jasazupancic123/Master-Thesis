import { GroupContextProps } from '@/app/groups/[group_id]/props';
import { SetState } from '@/common/type/state.type';
import { Group } from '@/controller/group/type/group.type';

export type AddCycleModalProps = Pick<
  GroupContextProps,
  'token' | 'group' | 'setGroup'
> & {
  onClose: () => void;
};
