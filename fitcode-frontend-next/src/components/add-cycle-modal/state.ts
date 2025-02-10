import { handleApiRequest, SetState } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import { Group } from '@/controller/group/type/group.type';
import { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';

export type AddInput = Parameters<typeof GroupController.addCycle>[2];

export async function handleAddCycle(
  token: string,
  cycleName: string,
  description: string,
  startDate: Dayjs | null,
  endDate: Dayjs | null,
  selectedGroup: Group,
  setSelectedGroup: SetState<Group>,
  onClose: () => void
) {
  if (!cycleName || !startDate || !endDate) {
    toast.error('Please fill in all required fields.');
    return;
  }

  const start: Date = startDate?.toDate();
  const end: Date = endDate?.toDate();

  if (start > end) {
    toast.error('Start date must be before end date.');
    return;
  }

  // try {
  //   const newCycle = await GroupController.addCycle(token, selectedGroup.id, {
  //     name: cycleName,
  //     description,
  //     from: start,
  //     to: end,
  //   });
  //   const updatedCycles = [...(selectedGroup.cycles || []), newCycle];

  //   setSelectedGroup({ ...selectedGroup, cycles: updatedCycles });
  //   toast.success('Cycle added successfully.');
  // } catch (error: any) {
  //   if (error.message?.toLowerCase().includes('overlap')) {
  //     toast.error('Cycle dates overlap with an existing cycle.');
  //     return;
  //   }
  //   toast.error('Failed to add cycle.');
  // }

  handleApiRequest(
    () =>
      GroupController.addCycle(token, selectedGroup.id, {
        name: cycleName,
        description,
        from: start,
        to: end,
      }),
    (cycle) => {
      setSelectedGroup((prev) => ({
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

      toast.error('Failed to add cycle.');
    }
  );
}
