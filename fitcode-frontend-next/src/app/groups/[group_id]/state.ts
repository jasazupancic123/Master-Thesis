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
  token: string,
  router: AppRouterInstance
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
      GroupController.update(token, selectedGroup.id, {
        cycles: selectedGroup.cycles,
      }),
    (response) => {
      if (cycle) {
        const newCycle = response.cycles.find((c) => c.id === cycle.id);
        setCycle(newCycle);
      }

      setSelectedGroup(response);
      setDetectedChanges(false);

      toast.success('Group successfully saved');
    },
    undefined,
    'Failed to save group'
  );
}
