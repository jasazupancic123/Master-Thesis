'use client';

import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import { TrainingStatus } from '@/core/training/enum/training-status.enum';
import { TrainingController } from '@/core/training/training.controller';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import { LINK_ATHLETE_HOME } from '@/lib/common/const/nav.const';
import type { SetState } from '@/lib/common/type/state.type';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useMain } from '@/store/main.provider';
import { useTrainings } from '@/store/trainings.provider';

export interface ITrainingInProgressUtilsCtx {
  openCancelTrainingModal: boolean;
  setOpenCancelTrainingModal: SetState<boolean>;
  openFinishTrainingModal: boolean;
  setOpenFinishTrainingModal: SetState<boolean>;
  openAddExerciseModal: boolean;
  setOpenAddExerciseModal: SetState<boolean>;
  anchorEl: HTMLElement | null;
  setAnchorEl: SetState<HTMLElement | null>;
  open: boolean;
  edit: boolean;
  setEdit: SetState<boolean>;
  handleOpenMenu: (event: React.MouseEvent<HTMLElement>) => void;
  handleCloseMenu: () => void;
  handleFinish: () => void;
  handleCancel: () => void;
  handleEdit: () => void;
  handlePauseTraining: () => Promise<void>;
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
    useTrainings();

  const { selectedTrackingMethod } = useAthleteHeader();

  const [openCancelTrainingModal, setOpenCancelTrainingModal] = useState(false);
  const [openFinishTrainingModal, setOpenFinishTrainingModal] = useState(false);
  const [openAddExerciseModal, setOpenAddExerciseModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const [edit, setEdit] = useState(false);

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
    const component = trainingInProgress?.training.components.find(
      (c) => c.id === trainingInProgress.componentId
    );

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

    setActiveTraining((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        statuses: prev.statuses.map((s) => {
          if (s.componentId === component.id && s.trainingId === training.id)
            return { ...s, status: TrainingStatus.PAUSED };

          return s;
        }),
      };
    });

    router.push(LINK_ATHLETE_HOME.href);
    // await clearTrainingState();
  };

  const handleCompleteTraining = async () => {
    const training = trainingInProgress?.training;
    const component = trainingInProgress?.training.components.find(
      (c) => c.id === trainingInProgress.componentId
    );

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

    router.push(LINK_ATHLETE_HOME.href);

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

  const handleEdit = () => {
    if (trainingInProgress) {
      const component = trainingInProgress.training.components.find(
        (c) => c.id === trainingInProgress.componentId
      );

      if (!component) return;

      const isTrainingEmpty = component.supersets.every(
        (superset) => superset.exercises.length === 0
      );

      if (isTrainingEmpty) {
        setOpenAddExerciseModal(true);
        setEdit(true);
        return;
      }
    }

    handleCloseMenu();
    setEdit((prev) => !prev);
  };

  const handleCancel = () => {
    handleCloseMenu();
    setOpenCancelTrainingModal(true);
  };

  const value: ITrainingInProgressUtilsCtx = {
    openCancelTrainingModal,
    setOpenCancelTrainingModal,
    openFinishTrainingModal,
    setOpenFinishTrainingModal,
    openAddExerciseModal,
    setOpenAddExerciseModal,
    anchorEl,
    setAnchorEl,
    open,
    edit,
    setEdit,
    handleOpenMenu,
    handleCloseMenu,
    handleFinish,
    handleCancel,
    handleEdit,
    handlePauseTraining,
    handleCompleteTraining,
  };

  return (
    <TrainingInProgressUtilsContext.Provider value={value}>
      {children}
    </TrainingInProgressUtilsContext.Provider>
  );
}
