import dayjs from 'dayjs';
import { createContext, useContext, useEffect, useState } from 'react';

import { ExerciseTrainingView } from '@/core/training/enum/exercise-training-view.enum';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';

export interface ITrainingInProgressUtilsCtx {
  elapsedTime: number;
  setElapsedTime: SetState<number>;
  showUndoneSetsWarning: boolean;
  setShowUndoneSetsWarning: SetState<boolean>;
  showUndoneSetsError: boolean;
  setShowUndoneSetsError: SetState<boolean>;
  openCancelTrainingModal: boolean;
  setOpenCancelTrainingModal: SetState<boolean>;
  anchorEl: HTMLElement | null;
  setAnchorEl: SetState<HTMLElement | null>;
  open: boolean;
  handleOpenMenu: (event: React.MouseEvent<HTMLElement>) => void;
  handleCloseMenu: () => void;
  handleCancel: () => void;
  handleCancelTraining: () => Promise<void>;
  formatTime: (seconds: number) => string;
}

const TrainingInProgressUtilsContext =
  createContext<ITrainingInProgressUtilsCtx | null>(null);

export const useTrainingInProgressUtils = () =>
  useContext(TrainingInProgressUtilsContext)!;

export function TrainingInProgressUtilsProvider({
  children,
}: React.PropsWithChildren) {
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
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    if (!trainingInProgress) return;
    if (!trainingInProgress.startOfTraining) {
      console.log('set training in progress 1');
      setTrainingInProgress(
        (prev) => ({ ...prev, startOfTraining: dayjs() }) as TrainingInProgress
      );
    }

    const startTime = dayjs(trainingInProgress.startOfTraining).valueOf();
    const interval = setInterval(() => {
      const now = dayjs().valueOf();
      setElapsedTime(Math.floor((now - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [trainingInProgress?.startOfTraining]);

  const handleCancelTraining = async () => {
    await clearTrainingState();
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

  const value: ITrainingInProgressUtilsCtx = {
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

  return (
    <TrainingInProgressUtilsContext.Provider value={value}>
      {children}
    </TrainingInProgressUtilsContext.Provider>
  );
}
