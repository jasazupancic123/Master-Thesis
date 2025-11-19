import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clear, DragIndicator, Groups, Person } from '@mui/icons-material';
import {
  Box,
  Checkbox,
  IconButton,
  Radio,
  Tooltip,
  Typography,
} from '@mui/material';
import { LineChart } from '@mui/x-charts';
import dayjs from 'dayjs';
import type { JSX } from 'react';
import { useState } from 'react';

import { deleteReportFromIndexDb } from './actions/actions-index-db';
import AthleteExerciseReportHeader from './athlete-exercise-report-header';
import useAthleteChartData from './hooks/use-chart-data';
import { theme } from '@/app/style';
import type { Workload } from '@/core/training/type/workload.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useScreenSize } from '@/store/screen-size.provider';
import ImageGallery from '@/ui/image-gallery';
import MyModal from '@/ui/modal';
import useAthleteExerciseReportParams from './hooks/use-params';
import { useMain } from '@/store/main.provider';
import useAthleteChartSeries from './hooks/use-chart-series';

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

  const { data, setData, chartData } = useAthleteChartData();

  const {
    possibleParams,
    selectedParams,
    setSelectedParams,
    comparisonParam,
    setComparisonParam,
    paramSeriesMap,
    getParamColor,
  } = useAthleteExerciseReportParams(data);

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

  const { singleModeSeries, comparisonSeries, trainingIds } =
    useAthleteChartSeries(
      reportType,
      chartData,
      selectedParams,
      possibleParams,
      comparisonParam,
      paramSeriesMap,
      getParamColor
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
        typeof window !== undefined
          ? Math.min(window.innerWidth * 0.95, 400)
          : 400
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

      <Box
        width={'100%'}
        display="flex"
        alignItems={'center'}
        justifyContent="center"
        sx={{ cursor: 'pointer' }}
        gap={0.5}
        flexWrap="wrap"
        ml={4}
      >
        {possibleParams.map((param) => {
          const paramName =
            param === 'loadKg'
              ? 'Load (kg)'
              : param === 'reps'
                ? 'Reps'
                : param === 'loadKgR'
                  ? 'Load R (kg)'
                  : 'Reps R';

          const isSelected = selectedParams.includes(param);

          const color = getParamColor(param);

          return (
            <Box key={param} display="flex" alignItems="center" gap={0.5}>
              {reportType === 'single' ? (
                <Checkbox
                  size="small"
                  sx={{ color: `${color} !important`, p: 0 }}
                  checked={selectedParams.includes(param)}
                  onClick={() => {
                    setSelectedParams((prev) => {
                      if (isSelected) return prev.filter((p) => p !== param);
                      else return [...prev, param];
                    });
                  }}
                />
              ) : (
                <Radio
                  size="small"
                  sx={{ p: 0 }}
                  checked={comparisonParam === param}
                  onClick={() => {
                    setComparisonParam(param);
                  }}
                />
              )}
              <Typography
                fontSize={14}
                sx={{
                  color:
                    reportType === 'single' && isSelected
                      ? color
                      : theme.palette.text.primary,
                }}
              >
                {paramName}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Chart */}
      <LineChart
        dataset={reportType === 'single' ? chartData : undefined}
        width={
          typeof window !== undefined
            ? Math.min(window.innerWidth * 0.95, 400)
            : 400
        }
        height={250}
        hideLegend={reportType === 'single'}
        series={reportType === 'single' ? singleModeSeries : comparisonSeries}
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
