import { SetState, handleApiRequest } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import toast from 'react-hot-toast';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export async function handleSaveGroup(
  selectedGroup: Group,
  setSelectedGroup: SetState<Group>,
  cycle: Cycle | undefined,
  setCycle: SetState<Cycle | undefined>,
  setDetectedChanges: SetState<boolean>,
  router: AppRouterInstance,
  setGroup: SetState<Group>
) {
  for (const cycle of selectedGroup.cycles) {
    if (cycle.from >= cycle.to) {
      toast.error('Start date must be before end date.');
      return;
    }
  }

  handleApiRequest(
    router,
    () =>
      GroupController.update(selectedGroup.id, {
        cycles: selectedGroup.cycles,
      }),
    (group) => {
      if (group.cycles.length === 1) setCycle(group.cycles[0]);
      else if (cycle) {
        group.cycles.forEach((groupCycle) => {
          if (groupCycle.id === cycle.id) setCycle(groupCycle);
        });
      }

      setGroup(group);
      setSelectedGroup(group);
      setDetectedChanges(false);

      toast.success('Group successfully saved');
    },
    undefined,
    'Failed to save group'
  );
}
