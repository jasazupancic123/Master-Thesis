import { TrainingExerciseRecording } from '@/controller/training/type/training-exercise.type';

interface TrainingInProgressExerciseChartsProps {
  selectedExercise: TrainingExerciseRecording | undefined;
}

export default function TrainingInProgressExerciseCharts(
  props: TrainingInProgressExerciseChartsProps
) {
  const { selectedExercise } = props;
  
  return <></>;
}
