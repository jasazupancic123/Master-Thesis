import MyModal from '@/util/modal/modal';
import UndoneExercisesList from '../components/undone-exercises-list/training-in-progress-undone-exercises-list';
import { ModalProps } from '@/common/type/modal-props.type';
import { useUndoneExercises } from '../context/undone-exercises.provider';

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
