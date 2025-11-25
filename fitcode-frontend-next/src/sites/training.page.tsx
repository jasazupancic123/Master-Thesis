'use client';

import { Box } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import AthleteOptionsContainer from '@/components/athlete/athlete-options-container';
import AthleteTrainingCard from '@/components/athlete/athlete-training-card';
import CreateTrainingModal from '@/components/athlete/create-training-modal';
import TrainingReportCard from '@/components/athlete/training-report-card';
import { CompletedPlanned } from '@/core/training/enum/completed-planned.enum';
import type { Training } from '@/core/training/type/training.type';
import { lib } from '@/lib';
import type { Pagination } from '@/lib/common/type/paginate.type';
import { useTraining } from '@/store/training.provider';

const PAGE_SIZE = 3;

export default function TrainingPage() {
  const { trainings: plannedTrainings, reports } = useTraining();
  const [filteredPlannedTrainings, setFilteredPlannedTrainings] = useState<
    Training[]
  >([]);

  const [filter, setFilter] = useState<CompletedPlanned>(
    CompletedPlanned.PLANNED
  );

  const [openCreateTrainingModal, setOpenCreateTrainingModal] = useState(false);

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

    const newTrainings = lib.common.generic.paginate(allTrainings, {
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

  return (
    <>
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

      {/* <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setOpenCreateTrainingModal(true)}
      >
        <Tooltip title="Add Training">
          <Add />
        </Tooltip>
      </Fab> */}

      <CreateTrainingModal
        open={openCreateTrainingModal}
        setOpen={setOpenCreateTrainingModal}
        onCreateTraining={(training) => {
          setFilteredPlannedTrainings((prev) => [training, ...prev]);
        }}
      />
    </>
  );
}
