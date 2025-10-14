'use client';

import { Box } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import { CompletedPlanned } from '@/common/enum/completed-planned.enum';
import { CommonService } from '@/common/service/common.service';
import { ExerciseTrainingView } from '@/common/type/exercise-or-training.type';
import type { Pagination } from '@/common/type/paginate.type';
import AthleteOptionsContainer from '@/components/athlete/athlete-options-container/athlete-options-container';
import AthleteTrainingCard from '@/components/athlete/athlete-training-card/athlete-training-card';
import TrainingReportCard from '@/components/athlete/athlete-training-card/components/training-report-card';
import { TrainingInProgressUtilsProvider } from '@/components/training-in-progress/context/training-in.progress-utils.provider';
import { UndoneExercisesProvider } from '@/components/training-in-progress/context/undone-exercises.provider';
import TrainingInProgress from '@/components/training-in-progress/training-in-progress';
import type { Training } from '@/controller/training/type/training.type';
import { useTraining } from '@/store/training.provider';
import { TrainingInProgressProvider } from '@/store/training-in-progress.provider';

const PAGE_SIZE = 3;
const commonService = CommonService.instance;

export default function TrainingPage() {
  const {
    view,
    setView,
    trainings: plannedTrainings,
    reports,
    clearTrainingState,
    trainingInProgress,
    isLoaded,
  } = useTraining();

  const [filteredPlannedTrainings, setFilteredPlannedTrainings] = useState<
    Training[]
  >([]);

  const [filter, setFilter] = useState<CompletedPlanned>(
    CompletedPlanned.PLANNED
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [plannedTrainingsPagination, setPlannedTrainingsPagination] =
    useState<Pagination>({
      page: 0,
      pageSize: PAGE_SIZE,
      pages: Math.ceil(plannedTrainings.length / PAGE_SIZE),
      total: plannedTrainings.length,
    });

  const [_hasMorePlanned, setHasMorePlanned] = useState(true);
  const [_hasMoreCompleted, setHasMoreCompleted] = useState(true);

  useEffect(() => {
    handlePaginateTrainings().then();
  }, [filter, plannedTrainings, reports]);

  useEffect(() => {
    if (!isLoaded) return;
    if (
      trainingInProgress &&
      trainingInProgress.training &&
      trainingInProgress.selectedComponent
    ) {
      setView(ExerciseTrainingView.TrainingView);
    } else {
      clearTrainingState();
    }
  }, [isLoaded]);

  const handlePaginateTrainings = async () => {
    if (filter !== CompletedPlanned.PLANNED) return;

    const allTrainings = plannedTrainings;
    const currentPagination = plannedTrainingsPagination;
    const { page, pageSize } = currentPagination;

    const nextPage = page + 1;
    const totalPages = Math.ceil(allTrainings.length / pageSize);

    if (nextPage > totalPages) {
      if (filter === CompletedPlanned.PLANNED) setHasMorePlanned(false);
      else setHasMoreCompleted(false);
      return;
    }

    const newTrainings = commonService.generic.paginate(allTrainings, {
      page: nextPage,
      pageSize,
    });

    const updatedPagination: Pagination = {
      page: nextPage,
      pageSize,
      total: allTrainings.length,
      pages: totalPages,
    };

    if (newTrainings.length < pageSize) {
      if (filter === CompletedPlanned.PLANNED) setHasMorePlanned(false);
      else setHasMoreCompleted(false);
    }

    if (filter === CompletedPlanned.PLANNED) {
      setFilteredPlannedTrainings((prev) => [...prev, ...newTrainings]);
      setPlannedTrainingsPagination(updatedPagination);
    }
  };

  return view === ExerciseTrainingView.ExerciseView ? (
    <Box display="flex" flexDirection="column" width="100%">
      <AthleteOptionsContainer
        items={[CompletedPlanned.COMPLETED, CompletedPlanned.PLANNED]}
        selectedItem={filter}
        onClick={(type) => {
          setFilter(type as CompletedPlanned);
        }}
        title="Trainings"
      />
      <Box
        ref={containerRef}
        sx={{
          height: 'calc(100vh - 100px)',
          overflowY: 'auto',
          pb: 6,
        }}
      >
        {filter === CompletedPlanned.PLANNED
          ? filteredPlannedTrainings.map((training) => (
              <AthleteTrainingCard key={training.id} training={training} />
            ))
          : reports.map((report, i) => (
              <TrainingReportCard key={i} report={report} />
            ))}

        <Box ref={sentinelRef} height={'1px'} />
      </Box>
    </Box>
  ) : (
    <TrainingInProgressProvider>
      <TrainingInProgressUtilsProvider>
        <UndoneExercisesProvider>
          <TrainingInProgress />
        </UndoneExercisesProvider>
      </TrainingInProgressUtilsProvider>
    </TrainingInProgressProvider>
  );
}
