'use client';

import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import { TrainingController } from '@/core/training/training.controller';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import { LINK_TRAININGS } from '@/lib/common/const/nav.const';
import type { SetState } from '@/lib/common/type/state.type';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useMain } from '@/store/main.provider';
import { useTraining } from '@/store/training.provider';

export interface ITrainingInProgressUtilsCtx {
  showUndoneSetsError: boolean;
  setShowUndoneSetsError: SetState<boolean>;
  openCancelTrainingModal: boolean;
  setOpenCancelTrainingModal: SetState<boolean>;
  openFinishTrainingModal: boolean;
  setOpenFinishTrainingModal: SetState<boolean>;
  anchorEl: HTMLElement | null;
  setAnchorEl: SetState<HTMLElement | null>;
  open: boolean;
  handleOpenMenu: (event: React.MouseEvent<HTMLElement>) => void;
  handleCloseMenu: () => void;
  handleFinish: () => void;
  handleCancel: () => void;
  handleCancelTraining: () => Promise<void>;
  handleCompleteTraining: () => Promise<void>;
}

const TrainingInProgressUtilsContext =
  createContext<ITrainingInProgressUtilsCtx | null>(null);

export const useTrainingInProgressUtils = () =>
  useContext(TrainingInProgressUtilsContext)!;

export function TrainingInProgressUtilsProvider({
  children,
}: React.PropsWithChildren) {
  const router = useRouter();

  const { setActiveTraining } = useMain();
  const { trainingInProgress, setTrainingInProgress, clearTrainingState } =
    useTraining();

  const { selectedTrackingMethod } = useAthleteHeader();

  const [showUndoneSetsError, setShowUndoneSetsError] = useState(false);
  const [openCancelTrainingModal, setOpenCancelTrainingModal] = useState(false);
  const [openFinishTrainingModal, setOpenFinishTrainingModal] = useState(false);
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

  const handlePauseTraining = async () => {
    const training = trainingInProgress?.training;
    const component = trainingInProgress?.selectedComponent;
    if (!training || !component) return;

    try {
      await TrainingController.getInstance().pauseTrainingComponent(
        training.id,
        component.id
      );
    } catch (e) {
      console.error(e);
      toast.error('Failed to pause training');
    }

    router.push(LINK_TRAININGS.href);
    // await clearTrainingState();
  };

  const handleCompleteTraining = async () => {
    const training = trainingInProgress?.training;
    const component = trainingInProgress?.selectedComponent;
    if (!training || !component) return;

    try {
      await TrainingController.getInstance().completeTrainingComponent(
        training.id,
        component.id
      );
    } catch (e) {
      console.error(e);
      toast.error('Failed to complete training');
    }

    router.push(LINK_TRAININGS.href);

    setActiveTraining(null);
    await clearTrainingState();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenMenu = (event: any) => {
    if (selectedTrackingMethod === TrackingMethod.CAMERA) return;
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleFinish = () => {
    handleCloseMenu();
    setOpenFinishTrainingModal(true);
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
    openFinishTrainingModal,
    setOpenFinishTrainingModal,
    anchorEl,
    setAnchorEl,
    open,
    handleOpenMenu,
    handleCloseMenu,
    handleFinish,
    handleCancel,
    handleCancelTraining: handlePauseTraining,
    handleCompleteTraining,
  };

  return (
    <TrainingInProgressUtilsContext.Provider value={value}>
      {children}
    </TrainingInProgressUtilsContext.Provider>
  );
}
