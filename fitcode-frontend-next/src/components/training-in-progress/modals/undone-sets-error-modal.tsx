import { useUndoneExercises } from '../context/undone-exercises.provider';
import UndoneExercisesList from '../training-in-progress-undone-exercises-list';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import MyModal from '@/util/modal';

export default function UndoneSetsErrorModal({ open, setOpen }: ModalProps) {
  const { setUndoneExercises } = useUndoneExercises();

  return (
    <MyModal
      isOpen={open}
      setIsOpen={(open) => setOpen(open)}
      onConfirm={() => {
        setOpen(false);
        setUndoneExercises([]);
      }}
    >
      <UndoneExercisesList />
    </MyModal>
  );
}
