import { handleApiRequest, SetState } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import { Group } from '@/controller/group/type/group.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';
import { AddCycleInput } from './input';

export async function handleAddCycle(
  token: string,
  input: AddCycleInput,
  state: {
    router: AppRouterInstance;
    group: Group;
    setGroup: SetState<Group>;
  },
  onClose: () => void
) {
  const { group, setGroup } = state;
  const { name, description, from, to } = input;

  if (!name || !from || !to) {
    toast.error('Please fill in all required fields.');
    return;
  }

  if (from > to) {
    toast.error('Start date must be before end date.');
    return;
  }

  handleApiRequest(
    state.router,
    () =>
      GroupController.addCycle(token, group.id, {
        name,
        description,
        from,
        to,
      }),
    (cycle) => {
      setGroup((prev) => ({
        ...prev,
        cycles: [...(prev.cycles || []), cycle],
      }));

      toast.success('Cycle added successfully.');
      onClose();
    },
    (e) => {
      if (e.message?.toLowerCase().includes('overlap')) {
        toast.error('Cycle dates overlap with an existing cycle.');
        return;
      }
    },
    'Failed to add cycle.'
  );
}
