import { useUndoneExercises } from '../context/undone-exercises.provider';
import UndoneExercisesList from '../training-in-progress-undone-exercises-list';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import MyModal from '@/ui/modal';

export default function UndoneSetsWarningModal(props: ModalProps) {
  const { open, setOpen } = props;

  const { undoneExercises, setUndoneExercises } = useUndoneExercises();

  return (
    <MyModal
      isOpen={open}
      setIsOpen={(open) => {
        if (!undoneExercises.length) setOpen(false);
        else setOpen(open);
      }}
      onConfirm={() => {
        setOpen(false);
        setUndoneExercises([]);
      }}
    >
      <UndoneExercisesList />
    </MyModal>
  );
}
