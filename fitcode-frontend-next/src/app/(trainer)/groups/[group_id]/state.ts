import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import { InstitutionController } from '@/core/institution/institution.controller';
import type { Cycle } from '@/core/institution/type/cycle.type';
import type { Group } from '@/core/institution/type/group.type';
import type { SetState } from '@/lib/common/type/state.type';
import { handleApiRequest } from '@/lib/common/type/state.type';

export async function handleSaveGroup(
  selectedGroup: Group,
  setSelectedGroup: SetState<Group>,
  cycle: Cycle | undefined,
  setCycle: SetState<Cycle | undefined>,
  setDetectedChanges: SetState<boolean>,
  router: AppRouterInstance,
  setGroup: SetState<Group>,
  setGroups: SetState<Group[]>
) {
  for (const cycle of selectedGroup.cycles) {
    if (cycle.from >= cycle.to) {
      toast.error('Start date must be before end date.');
      return;
    }
  }

  const controller = InstitutionController.getInstance();

  handleApiRequest(
    router,
    () =>
      controller.updateGroup(selectedGroup.institutionId, selectedGroup.id, {
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
      setGroups((prev) => prev.map((g) => (g.id === group.id ? group : g)));
      setSelectedGroup(group);
      setDetectedChanges(false);

      toast.success('Group successfully saved');
    },
    undefined,
    'Failed to save group'
  );
}
