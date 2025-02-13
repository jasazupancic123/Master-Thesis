import { SetState } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import { GroupService } from '@/controller/group/group.service';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { TrainingService } from '@/controller/training/training.service';
import toast from 'react-hot-toast';

export async function handleUpdateCycle(
  token: string,
  selectedGroup: Group,
  setSelectedGroup: SetState<Group>,
  editCycle: Cycle | null,
  setEditCycle: SetState<Cycle | null>,
  setShowEditModal: SetState<boolean>,
  selectedCycle: Cycle | null,
  setSelectedCycle: SetState<Cycle | null>
) {
  setShowEditModal(false);

  if (!editCycle) {
    toast.error('No cycle selected.');
    return;
  }

  try {
    const updatedCycle = await GroupController.updateCycle(
      token,
      selectedGroup.id,
      editCycle.id,
      {
        name: editCycle.name,
        from: editCycle.from,
        to: editCycle.to,
      }
    );

    const updatedCycles = selectedGroup.cycles.map((cycle) =>
      cycle.id === updatedCycle.id ? updatedCycle : cycle
    );

    setSelectedGroup({ ...selectedGroup, cycles: updatedCycles });
    if (selectedCycle?.id === editCycle.id) setSelectedCycle(updatedCycle);

    toast.success('Cycle updated successfully.');

    setEditCycle(null);
  } catch (error) {
    toast.error('Failed to update cycle.');
  }
}
