import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable';
import { GridView, ViewWeek } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { useState } from 'react';
import { v4 } from 'uuid';

import AthleteExerciseDataGrid from '../report-athlete-exercise-data-grid/athlete-exercise-data-grid';
import { updateReportInIndexDb } from './actions/actions-index-db';
import AthleteExerciseReport from './athlete-exercise-report';
import SetDetailsModal from './modals/set-details-modal';
import type { AthleteExerciseReportType } from './types/athlete-exercise-report-type';
import type { IndexDbAthleteExerciseReport } from './types/index-db-athlete-exercise-report';
import { theme } from '@/app/style';
import type { Workload } from '@/core/training/type/workload.type';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import type { SetState } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
import AddButton from '@/ui/add-button';

interface Props {
  reports: AthleteExerciseReportType[];
  setReports: SetState<AthleteExerciseReportType[]>;
  cache: Map<string, Workload[]>;
}

export default function AthleteExerciseReports(props: Props) {
  const { selectedInstitution } = useDashboard();

  const { reports, setReports, cache } = props;

  const [activeWorkloadsForTooltip, setActiveWorkloadsForTooltip] = useState<
    Workload[]
  >([]);
  const [activeSetNumber, setActiveSetNumber] = useState<number | null>(null);
  const [openWorkloadModal, setOpenWorkloadModal] = useState(false);

  const [flexWrap, setFlexWrap] = useState<'wrap' | 'nowrap'>('wrap');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 0, // ms to hold before drag
        tolerance: 5, // how much you can wobble while holding
      },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setReports((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return items;

      return arrayMove(items, oldIndex, newIndex);
    });
  }

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <IconButton
          onClick={() => {
            setFlexWrap('wrap');
          }}
        >
          <GridView
            sx={{
              color:
                flexWrap === 'wrap' ? theme.palette.primary.main : undefined,
            }}
          />
        </IconButton>
        <IconButton
          onClick={() => {
            setFlexWrap('nowrap');
          }}
        >
          <ViewWeek
            sx={{
              color:
                flexWrap === 'nowrap' ? theme.palette.primary.main : undefined,
            }}
          />
        </IconButton>
      </Box>
      <Box>
        <AddButton
          onClick={async () => {
            if (!selectedInstitution) return;

            const id = v4();

            const prevReport = reports.length
              ? reports[reports.length - 1]
              : null;

            const newReport: AthleteExerciseReportType = prevReport
              ? {
                  id,
                  userId: prevReport.userId,
                  userIds: prevReport.userIds,
                  exerciseId: prevReport.exerciseId,
                  type: prevReport.type,
                }
              : {
                  id,
                  userId: undefined,
                  userIds: [],
                  exerciseId: undefined,
                  type: 'single',
                };

            const item: IndexDbAthleteExerciseReport | undefined = prevReport
              ? {
                  id,
                  exerciseId: prevReport.exerciseId,
                  institutionId: selectedInstitution.id,
                  userId: prevReport.userId,
                  userIds: prevReport.userIds,
                  type: prevReport.type,
                }
              : undefined;

            if (item) await updateReportInIndexDb(item);

            setReports((prev) => [...prev, newReport]);
          }}
        />
      </Box>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          id={'athlete-exercise-reports-container'}
          items={reports.map((r) => r.id)}
          strategy={rectSortingStrategy}
        >
          <Box
            width="100%"
            display="flex"
            justifyContent={flexWrap === 'wrap' ? 'center' : undefined}
            gap={2}
            sx={{
              overflowX: flexWrap === 'nowrap' ? 'auto' : undefined,
              overflowY: 'hidden',
              ...styledScrollbarSx(theme),
            }}
            flexWrap={flexWrap}
          >
            {reports.map((report) => (
              <AthleteExerciseReport
                key={report.id}
                id={report.id}
                userId={report.userId}
                userIds={report.userIds}
                exerciseId={report.exerciseId}
                reportType={report.type}
                cache={cache}
                setReports={setReports}
                setActiveWorkloadsForTooltip={setActiveWorkloadsForTooltip}
                setActiveSetNumber={setActiveSetNumber}
                openWorkloadModal={openWorkloadModal}
                setOpenWorkloadModal={setOpenWorkloadModal}
              />
            ))}
          </Box>
        </SortableContext>
      </DndContext>
      <AthleteExerciseDataGrid cache={cache} />

      <SetDetailsModal
        open={openWorkloadModal}
        setOpen={setOpenWorkloadModal}
        workloads={activeWorkloadsForTooltip}
        setWorkloads={setActiveWorkloadsForTooltip}
        activeSetNumber={activeSetNumber}
        setActiveSetNumber={setActiveSetNumber}
      />
    </Box>
  );
}
