import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

export type UseTrainingMembersReturnType = ReturnType<
  typeof useTrainingMembers
>;

export default function useTrainingMembers() {
  const { users } = useMain();
  const { group } = useGroup();
  const { training } = useTrainerDayView();

  const item = training || group;

  const members = users.filter((user) => item.membersIds.includes(user.uid));

  const sortedMembers = [...members].sort((a, b) => {
    if (!training) return 0;

    const getSubgroupIndex = (uid: string) =>
      training.components
        .flatMap((c) => c.subgroups)
        .findIndex((s) => s.membersIds.includes(uid));

    const subgroupIndexA = getSubgroupIndex(a.uid);
    const subgroupIndexB = getSubgroupIndex(b.uid);

    // Place users without a subgroup first
    if (subgroupIndexA === -1 && subgroupIndexB !== -1) return -1;
    if (subgroupIndexA !== -1 && subgroupIndexB === -1) return 1;

    // If both have a subgroup, sort by subgroup index
    return subgroupIndexA - subgroupIndexB;
  });

  return { members, sortedMembers, item };
}
