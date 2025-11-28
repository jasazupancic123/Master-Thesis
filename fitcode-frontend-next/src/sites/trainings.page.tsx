'use client';

import { Box } from '@mui/material';
import { useRef, useState } from 'react';

import AthleteOptionsContainer from '@/components/athlete/athlete-options-container';
import AthleteTrainingCard from '@/components/athlete/athlete-training-card';
import TrainingReportCard from '@/components/athlete/training-report-card';
import { CompletedPlanned } from '@/core/training/enum/completed-planned.enum';
import { useAthlete } from '@/store/athlete.provider';
import { useTrainings } from '@/store/trainings.provider';

export default function TrainingsPage() {
  const { trainings } = useAthlete();
  const { reports } = useTrainings();

  const [filter, setFilter] = useState<CompletedPlanned>(
    CompletedPlanned.PLANNED
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
            ? trainings.map((training) => (
                <AthleteTrainingCard key={training.id} training={training} />
              ))
            : reports.map((report, i) => (
                <TrainingReportCard key={i} report={report} />
              ))}
          <Box ref={sentinelRef} height={'1px'} />
        </Box>
      </Box>
    </>
  );
}
