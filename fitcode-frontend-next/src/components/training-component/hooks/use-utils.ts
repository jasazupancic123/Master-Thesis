import { useState } from 'react';

export default function useTrainingComponentLayoutUtils() {
  const [openAddExerciseModal, setOpenAddExerciseModal] = useState(false);
  const [heatmapView, setHeatmapView] = useState(false);
  const [expandedExercisesView, setExpandedExercisesView] = useState(false);

  return {
    openAddExerciseModal,
    setOpenAddExerciseModal,
    heatmapView,
    setHeatmapView,
    expandedExercisesView,
    setExpandedExercisesView,
  };
}
