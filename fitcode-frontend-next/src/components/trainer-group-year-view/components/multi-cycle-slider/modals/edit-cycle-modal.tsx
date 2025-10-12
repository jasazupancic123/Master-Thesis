import { ModalProps } from '@/common/type/modal-props.type';
import EditCycleForm from '@/components/edit-cycle-form/edit-cycle-form';
import { useMultiCycleSliderCyclesProvider } from '@/components/trainer-group-year-view/context/cycles.provider';
import { useGroup } from '@/store/group.provider';
import MyModal from '@/util/modal/modal';

export default function EditCycleModal(props: ModalProps) {
  const { selectedGroup, setSelectedGroup, setDetectedChanges } = useGroup();
  const { editCycle } = useMultiCycleSliderCyclesProvider();

  const { open, setOpen } = props;

  return (
    <MyModal
      isOpen={open}
      setIsOpen={setOpen}
      onCancel={() => setOpen(false)}
      cancelText="Close"
      onConfirm={() => {
        if (!editCycle) return;

        const newCycles = selectedGroup.cycles.map((c) =>
          c.id === editCycle.id ? { ...editCycle } : c
        );
        setSelectedGroup({ ...selectedGroup, cycles: newCycles });
        setDetectedChanges(true);
        setOpen(false);
      }}
    >
      <EditCycleForm />
    </MyModal>
  );
}
