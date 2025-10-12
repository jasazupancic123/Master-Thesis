import MyModal from '@/util/modal/modal';
import UndoneExercisesList from '../components/undone-exercises-list/training-in-progress-undone-exercises-list';
import { ModalProps } from '@/common/type/modal-props.type';
import { useUndoneExercises } from '../context/undone-exercises.provider';

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
