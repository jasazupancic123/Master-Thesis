'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import { CompletedPlanned } from '@/common/enum/past-future.enum';
import { CommonService } from '@/common/service/common.service';
import { ExerciseTrainingView } from '@/common/type/exercise-or-training.type';
import type { Pagination } from '@/common/type/paginate.type';
import AthleteTrainingCard from '@/components/athlete-training-card/athlete-training-card';
import TrainingInProgress from '@/components/training-in-progress/training-in-progress';
import type { Training } from '@/controller/training/type/training.type';
import { useTraining } from '@/store/training-provider';

const PAGE_SIZE = 3;
const commonService = CommonService.instance;

export default function TrainingPage() {
  const theme = useTheme();

  const {
    view,
    setView,
    plannedTrainings,
    completedTrainings,
    clearTrainingState,
    trainingInProgress,
    isLoaded,
  } = useTraining();

  const [filteredPlannedTrainings, setFilteredPlannedTrainings] = useState<
    Training[]
  >([]);
  const [filteredCompletedTrainings, setFilteredCompletedTrainings] = useState<
    Training[]
  >([]);

  const [filter, setFilter] = useState<CompletedPlanned>(
    CompletedPlanned.PLANNED
  );

  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [plannedTrainingsPagination, setPlannedTrainingsPagination] =
    useState<Pagination>({
      page: 0,
      pageSize: PAGE_SIZE,
      pages: Math.ceil(plannedTrainings.length / PAGE_SIZE),
      total: plannedTrainings.length,
    });
  const [completedTrainingsPagination, setCompletedTrainingsPagination] =
    useState<Pagination>({
      page: 0,
      pageSize: PAGE_SIZE,
      pages: Math.ceil(completedTrainings.length / PAGE_SIZE),
      total: completedTrainings.length,
    });
  const [hasMorePlanned, setHasMorePlanned] = useState(true);
  const [hasMoreCompleted, setHasMoreCompleted] = useState(true);

  useEffect(() => {
    if (loading || view === ExerciseTrainingView.TrainingView) return;

    if (
      (filter === CompletedPlanned.PLANNED && !hasMorePlanned) ||
      (filter === CompletedPlanned.COMPLETED && !hasMoreCompleted)
    )
      return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setLoading(true);
          await handlePaginateTrainings();
          setLoading(false);
        }
      },
      {
        root: containerRef.current,
        threshold: 1.0,
      }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [
    loading,
    filteredPlannedTrainings.length,
    filteredCompletedTrainings.length,
    filter,
    view,
  ]);

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
    await commonService.generic.sleep(1);

    const allTrainings =
      filter === CompletedPlanned.PLANNED
        ? plannedTrainings
        : completedTrainings;

    const currentPagination =
      filter === CompletedPlanned.PLANNED
        ? plannedTrainingsPagination
        : completedTrainingsPagination;

    const { page, pageSize, total } = currentPagination;

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
    } else {
      setFilteredCompletedTrainings((prev) => [...prev, ...newTrainings]);
      setCompletedTrainingsPagination(updatedPagination);
    }
  };

  return view === ExerciseTrainingView.ExerciseView ? (
    <Box display="flex" flexDirection="column" width="100%">
      <Box
        display="flex"
        justifyContent="space-evenly"
        sx={{
          backgroundColor: theme.palette.background.light,
          py: 1,
        }}
      >
        {[CompletedPlanned.COMPLETED, CompletedPlanned.PLANNED].map((type) => (
          <Box key={type} display="flex" flexDirection="column">
            <Typography
              sx={{
                fontWeight: 'bold',
                fontSize: 12,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              onClick={() => {
                setFilter(type);
              }}
            >
              {type}
            </Typography>
            {type === filter && (
              <Box
                sx={{
                  width: '100%',
                  height: 2,
                  borderRadius: 2,
                  backgroundColor: theme.palette.primary.main,
                }}
              />
            )}
          </Box>
        ))}
      </Box>
      <Box
        ref={containerRef}
        sx={{
          height: 'calc(100vh - 100px)',
          overflowY: 'auto',
          pb: 6,
        }}
      >
        {(filter === CompletedPlanned.PLANNED
          ? filteredPlannedTrainings
          : filteredCompletedTrainings
        ).map((training) => (
          <AthleteTrainingCard key={training.id} training={training} />
        ))}

        <Box ref={sentinelRef} height={'1px'} />

        {loading && (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
    </Box>
  ) : (
    <TrainingInProgress
      setTrainings={
        filter === CompletedPlanned.PLANNED
          ? setFilteredPlannedTrainings
          : setFilteredCompletedTrainings
      }
    />
  );
}
