import MyModal from '@/util/modal/modal';
import UndoneExercisesList from '../components/undone-exercises-list/training-in-progress-undone-exercises-list';
import useTrainingInProgressUtils from '../hooks/use-utils';
import useTrainingInProgressUndoneExercises from '../hooks/use-undone-exercises';

export default function UndoneSetsErrorModal() {
  const { showUndoneSetsError, setShowUndoneSetsError } =
    useTrainingInProgressUtils();

  const { setUndoneExercises } = useTrainingInProgressUndoneExercises();
  return (
    <MyModal
      isOpen={showUndoneSetsError}
      setIsOpen={(open) => setShowUndoneSetsError(open)}
      onConfirm={() => {
        setShowUndoneSetsError(false);
        setUndoneExercises([]);
      }}
    >
      <UndoneExercisesList />
    </MyModal>
  );
}
