import dayjs from 'dayjs';
import { createContext, useContext, useEffect, useState } from 'react';

import { ExerciseTrainingView } from '@/core/training/enum/exercise-training-view.enum';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useTraining } from '@/store/training.provider';

export interface ITrainingInProgressUtilsCtx {
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

  const { selectedTrackingMethod } = useAthleteHeader();

  const [showUndoneSetsError, setShowUndoneSetsError] = useState(false);
  const [openCancelTrainingModal, setOpenCancelTrainingModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    if (!trainingInProgress) return;
    if (!trainingInProgress.startOfTraining) {
      setTrainingInProgress(
        (prev) => ({ ...prev, startOfTraining: dayjs() }) as TrainingInProgress
      );
    }
  }, [trainingInProgress?.startOfTraining]);

  const handleCancelTraining = async () => {
    await clearTrainingState();
    setView(ExerciseTrainingView.ExerciseView);
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

  const value: ITrainingInProgressUtilsCtx = {
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
  };

  return (
    <TrainingInProgressUtilsContext.Provider value={value}>
      {children}
    </TrainingInProgressUtilsContext.Provider>
  );
}
