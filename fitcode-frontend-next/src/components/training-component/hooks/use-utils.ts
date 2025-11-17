import { useState } from 'react';

export default function useTrainingComponentLayoutUtils() {
  const [openAddExerciseModal, setOpenAddExerciseModal] = useState({
    open: false,
    warmup: false,
    cooldown: false,
  });
  const [heatmapView, setHeatmapView] = useState(false);

  return {
    openAddExerciseModal,
    setOpenAddExerciseModal,
    heatmapView,
    setHeatmapView,
  };
}
