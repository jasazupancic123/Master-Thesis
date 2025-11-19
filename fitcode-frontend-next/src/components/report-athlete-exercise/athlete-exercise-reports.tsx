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
import type { JSX } from 'react';
import { Fragment, useEffect, useState } from 'react';
import { v4 } from 'uuid';

import AthleteExerciseReport from './athlete-exercise-report';
import { INDEX_DB_ATHLETE_EXERCISE_REPORTS_ID } from './const/index-db-id.const';
import type { IndexDbAthleteExerciseReport } from './types/index-db-athlete-exercise-report';
import { theme } from '@/app/style';
import type { Workload } from '@/core/training/type/workload.type';
import { lib } from '@/lib';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import AddButton from '@/ui/add-button';
import { useDashboard } from '@/store/dashboard.provider';
import AthleteExerciseDataGridHeader from '../report-athlete-exercise-data-grid/athlete-exercise-data-grid-header';
import AthleteExerciseDataGrid from '../report-athlete-exercise-data-grid/athlete-exercise-data-grid';

interface Props {
  cache: Map<string, Workload[]>;
}

export default function AthleteExerciseReports(props: Props) {
  const { selectedInstitution } = useDashboard();

  const { cache } = props;

  const [reports, setReports] = useState<
    { id: string; element: JSX.Element }[]
  >([]);

  const [flexWrap, setFlexWrap] = useState<'wrap' | 'nowrap'>('wrap');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100, // ms to hold before drag
        tolerance: 5, // how much you can wobble while holding
      },
    })
  );

  useEffect(() => {
    if (!selectedInstitution) return;

    const setupReports = async () => {
      if (reports.length) return;

      const items = await lib.common.indexedDb.items.get(
        INDEX_DB_ATHLETE_EXERCISE_REPORTS_ID
      );

      const data: IndexDbAthleteExerciseReport[] = items?.payload;

      const filteredData = (data || []).filter((item) => {
        return item.institutionId === selectedInstitution.id;
      });

      if (filteredData && filteredData.length) {
        setReports(
          filteredData.map((item) => ({
            id: item.id,
            element: (
              <AthleteExerciseReport
                id={item.id}
                cache={cache}
                setReports={setReports}
                passedUserId={item.userId}
                passedUserIds={!item.userId ? item.userIds : undefined}
                passedExerciseId={item.exerciseId}
              />
            ),
          }))
        );

        return;
      }

      const id = v4();
      setReports([
        {
          id,
          element: (
            <AthleteExerciseReport
              id={id}
              cache={cache}
              setReports={setReports}
            />
          ),
        },
      ]);
    };

    setupReports();
  }, []);

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
          onClick={() => {
            const id = v4();
            setReports((prev) => [
              ...prev,
              {
                id,
                element: (
                  <AthleteExerciseReport
                    id={id}
                    cache={cache}
                    setReports={setReports}
                  />
                ),
              },
            ]);
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
              overflowX: 'auto',
              ...styledScrollbarSx(theme),
            }}
            flexWrap={flexWrap}
          >
            {reports.map((report) => (
              <Fragment key={report.id}>{report.element}</Fragment>
            ))}
          </Box>
        </SortableContext>
      </DndContext>
      <AthleteExerciseDataGrid cache={cache} />
    </Box>
  );
}
