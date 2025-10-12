import MyModal from '@/util/modal/modal';
import useTrainingInProgressUtils from '../hooks/use-utils';
import useTrainingInProgressUndoneExercises from '../hooks/use-undone-exercises';
import UndoneExercisesList from '../components/undone-exercises-list/training-in-progress-undone-exercises-list';

export default function UndoneSetsWarningModal() {
  const { showUndoneSetsWarning, setShowUndoneSetsWarning } =
    useTrainingInProgressUtils();

  const { undoneExercises, setUndoneExercises } =
    useTrainingInProgressUndoneExercises();

  return (
    <MyModal
      isOpen={showUndoneSetsWarning}
      setIsOpen={(open) => {
        if (!undoneExercises.length) setShowUndoneSetsWarning(false);
        else setShowUndoneSetsWarning(open);
      }}
      onConfirm={() => {
        setShowUndoneSetsWarning(false);
        setUndoneExercises([]);
      }}
    >
      <UndoneExercisesList />
    </MyModal>
  );
}
