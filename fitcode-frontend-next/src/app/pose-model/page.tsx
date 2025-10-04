import MobileMovementValidation from '@/components/mobile-movement-validation/mobile-movement-validation';

export default function Page() {
  return (
    <MobileMovementValidation
      selectedExercise={undefined}
      selectedTrackingMethod={undefined}
      setSelectedTrackingMethod={undefined}
      updateExerciseValues={undefined}
      trainingId="trainingId"
      componentId="componentId"
      supersetIndex={0}
      setIndex={0}
    />
  );
}
