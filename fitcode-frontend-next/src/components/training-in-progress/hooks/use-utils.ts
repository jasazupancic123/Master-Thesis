import { TrackingMethod } from '@/common/enum/tracking-method.enum';
import { ExerciseTrainingView } from '@/common/type/exercise-or-training.type';
import { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTraining } from '@/store/training.provider';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

export type UseTrainingInProgressUtilsReturnType = ReturnType<
  typeof useTrainingInProgressUtils
>;

export default function useTrainingInProgressUtils() {
  const {
    trainingInProgress,
    setTrainingInProgress,
    setView,
    clearTrainingState,
  } = useTraining();

  const { setSelectedSuperset } = useTrainingInProgress();

  const { selectedTrackingMethod } = useAthleteHeader();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [showUndoneSetsWarning, setShowUndoneSetsWarning] = useState(false);
  const [showUndoneSetsError, setShowUndoneSetsError] = useState(false);
  const [openCancelTrainingModal, setOpenCancelTrainingModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    if (!trainingInProgress) return;
    if (!trainingInProgress.startOfTraining) {
      setTrainingInProgress(
        (prev) =>
          ({
            ...prev,
            startOfTraining: dayjs(),
          }) as TrainingInProgress
      );
    }

    const startTime = dayjs(trainingInProgress.startOfTraining).valueOf();
    const interval = setInterval(() => {
      const now = dayjs().valueOf();
      setElapsedTime(Math.floor((now - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [trainingInProgress?.startOfTraining]);

  const handleCancelTraining = () => {
    clearTrainingState();
    setView(ExerciseTrainingView.ExerciseView);
    setElapsedTime(0);
    setSelectedSuperset(undefined);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenMenu = (event: any) => {
    if (selectedTrackingMethod === TrackingMethod.CAMERA) return;

    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleCancel = () => {
    handleCloseMenu();
    setOpenCancelTrainingModal(true);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00:00'; // Default to zero time if invalid
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return {
    elapsedTime,
    setElapsedTime,
    showUndoneSetsWarning,
    setShowUndoneSetsWarning,
    showUndoneSetsError,
    setShowUndoneSetsError,
    openCancelTrainingModal,
    setOpenCancelTrainingModal,
    anchorEl,
    setAnchorEl,
    open,
    handleOpenMenu,
    handleCloseMenu,
    handleCancel,
    handleCancelTraining,
    formatTime,
  };
}
