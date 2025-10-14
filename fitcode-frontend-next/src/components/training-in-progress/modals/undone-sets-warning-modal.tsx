import UndoneExercisesList from '../components/undone-exercises-list/training-in-progress-undone-exercises-list';
import { useUndoneExercises } from '../context/undone-exercises.provider';
import type { ModalProps } from '@/common/type/modal-props.type';
import MyModal from '@/util/modal/modal';

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
