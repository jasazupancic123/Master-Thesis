import UndoneExercisesList from '../components/undone-exercises-list/training-in-progress-undone-exercises-list';
import { useUndoneExercises } from '../context/undone-exercises.provider';
import type { ModalProps } from '@/common/type/modal-props.type';
import MyModal from '@/util/modal/modal';

export default function UndoneSetsErrorModal(props: ModalProps) {
  const { open, setOpen } = props;

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
