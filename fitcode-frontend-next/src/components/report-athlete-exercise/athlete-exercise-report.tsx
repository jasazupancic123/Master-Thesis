import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clear, DragIndicator, Groups, Person } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';
import { LineChart } from '@mui/x-charts';
import dayjs from 'dayjs';
import type { JSX } from 'react';
import { useState } from 'react';

import { deleteReportFromIndexDb } from './actions/actions-index-db';
import AthleteExerciseReportHeader from './athlete-exercise-report-header';
import useAthleteChartData from './hooks/useChartData';
import { theme } from '@/app/style';
import type { Workload } from '@/core/training/type/workload.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useScreenSize } from '@/store/screen-size.provider';
import ImageGallery from '@/ui/image-gallery';
import MyModal from '@/ui/modal';

interface Props {
  id: string;
  cache: Map<string, Workload[]>;
  setReports: SetState<{ id: string; element: JSX.Element }[]>;
  passedUserId?: string;
  passedUserIds?: string[];
  passedExerciseId?: string;
}

export default function AthleteExerciseReport(props: Props) {
  const screenSize = useScreenSize();

  const { data, setData, chartData, trainingIds, comparisonSeries } =
    useAthleteChartData();

  const {
    id,
    cache,
    setReports,
    passedUserId,
    passedUserIds,
    passedExerciseId,
  } = props;

  const [reportType, setReportType] = useState<'single' | 'comparison'>(
    passedUserIds && passedUserIds.length ? 'comparison' : 'single'
  );

  const [openGallery, setOpenGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
      disabled: false,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Box
      id={`athlete-exercise-report-${id}`}
      ref={setNodeRef}
      {...(!screenSize.isMobile ? attributes : {})}
      {...(!screenSize.isMobile ? listeners : {})}
      maxWidth={
        window !== undefined ? Math.min(window.innerWidth * 0.95, 400) : 400
      }
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={1}
      sx={{
        backgroundColor: theme.palette.background.light,
        borderRadius: 4,
        p: 0.5,
        position: 'relative',
        cursor: 'grab',
      }}
      style={style}
    >
      <Box
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          p: 0.5,
        }}
        gap={1}
      >
        <Tooltip
          title={
            reportType === 'single'
              ? 'Switch to comparison'
              : 'Switch to single athlete'
          }
        >
          <IconButton
            sx={{
              p: 0,
              m: 0,
            }}
            onClick={() => {
              setReportType((prev) =>
                prev === 'single' ? 'comparison' : 'single'
              );
            }}
          >
            {reportType === 'single' ? <Person /> : <Groups />}
          </IconButton>
        </Tooltip>

        {screenSize.isMobile && (
          <Box
            display="flex"
            alignItems="center"
            {...attributes}
            {...listeners}
            sx={{
              touchAction: 'none', // important for mobile
              cursor: 'grab',
            }}
          >
            <DragIndicator />
          </Box>
        )}

        <IconButton
          sx={{
            p: 0,
            m: 0,
          }}
          onClick={async () => {
            setReports((prev) => prev.filter((p) => p.id !== id));
            await deleteReportFromIndexDb(id);
          }}
        >
          <Clear fontSize="small" />
        </IconButton>
      </Box>

      <AthleteExerciseReportHeader
        id={id}
        reportType={reportType}
        setData={setData}
        cache={cache}
        passedUserId={passedUserId}
        passedUserIds={passedUserIds}
        passedExerciseId={passedExerciseId}
      />

      {/* Chart */}
      <LineChart
        dataset={reportType === 'single' ? chartData : undefined}
        width={
          window !== undefined ? Math.min(window.innerWidth * 0.95, 400) : 400
        }
        height={250}
        series={
          reportType === 'single'
            ? chartData.some((d) => d.loadR !== undefined) ||
              chartData.some((d) => d.repsR !== undefined)
              ? [
                  {
                    dataKey: 'loadR',
                    label: 'Load R(kg)',
                    showMark: true,
                    color: theme.palette.success.main,
                  },
                  {
                    dataKey: 'repsR',
                    label: 'Reps R',
                    showMark: true,
                    color: theme.palette.warning.main,
                  },

                  {
                    dataKey: 'load',
                    label: 'Load (kg)',
                    showMark: true,
                    color: theme.palette.primary.main,
                  },
                  {
                    dataKey: 'reps',
                    label: 'Reps',
                    showMark: true,
                    color: theme.palette.secondary.main,
                  },
                ]
              : [
                  {
                    dataKey: 'load',
                    label: 'Load (kg)',
                    showMark: true,
                    color: theme.palette.primary.main,
                  },
                  {
                    dataKey: 'reps',
                    label: 'Reps',
                    showMark: true,
                    color: theme.palette.secondary.main,
                  },
                ]
            : comparisonSeries // one line per user
        }
        xAxis={
          reportType === 'single'
            ? [
                {
                  dataKey: 'index',
                  scaleType: 'point',
                  label: 'Set',
                  valueFormatter: (index: number) => {
                    const row = chartData[index];

                    if (!row) return '';

                    return dayjs(new Date(row.date)).format('DD/MM');
                  },
                },
              ]
            : [
                {
                  data: trainingIds, // categorical x-axis
                  scaleType: 'point',
                  label: 'Date',
                  valueFormatter: (trainingId: string | null) => {
                    if (!trainingId) return '';
                    const workload = data.find(
                      (w) => w.trainingId === trainingId
                    );
                    if (!workload) return '';
                    return dayjs(new Date(workload.timestamp)).format('DD/MM');
                  },
                },
              ]
        }
        yAxis={[{ label: '', min: 0 }]}
        margin={{ top: 10, bottom: 0, left: 0, right: 10 }}
        onMarkClick={(_, item) => {
          // only for single mode
          if (reportType !== 'single') return;

          const workload = data[item.dataIndex || 0];
          const photoURLs = workload?.photoURLs || [];
          if (photoURLs.length > 0) {
            setGalleryImages(photoURLs);
            setOpenGallery(true);
          }
        }}
      />

      <MyModal isOpen={openGallery} setIsOpen={setOpenGallery}>
        <ImageGallery
          imagesL={galleryImages}
          imagesR={[]}
          enableImagePickerSlider
        />
      </MyModal>
    </Box>
  );
}
