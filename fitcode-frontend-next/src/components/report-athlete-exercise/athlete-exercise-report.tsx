import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clear, DragIndicator, Groups, Person } from '@mui/icons-material';
import {
  Box,
  Checkbox,
  IconButton,
  Radio,
  Slider,
  Tooltip,
  Typography,
} from '@mui/material';
import { LineChart } from '@mui/x-charts';
import dayjs from 'dayjs';
import { useState } from 'react';

import { deleteReportFromIndexDb } from './actions/actions-index-db';
import AthleteExerciseReportHeader from './athlete-exercise-report-header';
import AthleteExerciseChartTooltip from './custom-tooltip';
import useAthleteChartData from './hooks/use-chart-data';
import useAthleteChartSeries from './hooks/use-chart-series';
import useAthleteExerciseReportParams from './hooks/use-params';
import type { AthleteExerciseReportType } from './types/athlete-exercise-report-type';
import { theme } from '@/app/style';
import type { Workload } from '@/core/training/type/workload.type';
import type { SetState } from '@/lib/common/type/state.type';

interface Props {
  id: string;
  cache: Map<string, Workload[]>;
  setReports: SetState<AthleteExerciseReportType[]>;
  reportType?: 'single' | 'comparison';
  userId?: string;
  userIds?: string[];
  exerciseId?: string;
  setActiveWorkloadsForTooltip: SetState<Workload[]>;
  setActiveSetNumber: SetState<number | null>;
  openWorkloadModal: boolean;
  setOpenWorkloadModal: SetState<boolean>;
}

export const LOAD_Y_AXIS_ID = 'yAxisLoad';
export const REPS_Y_AXIS_ID = 'yAxisReps';

export default function AthleteExerciseReport(props: Props) {
  const {
    id,
    cache,
    setReports,
    reportType: passedReportType,
    userId: passedUserId,
    userIds: passedUserIds,
    exerciseId: passedExerciseId,
    setActiveWorkloadsForTooltip,
    setActiveSetNumber,
    openWorkloadModal,
    setOpenWorkloadModal,
  } = props;

  const [reportType, setReportType] = useState<'single' | 'comparison'>(
    passedReportType || 'single'
  );
  const [groupByTraining, setGroupByTraining] = useState(false);

  const {
    data,
    setData,
    allSetsData,
    setAllSetsData,
    chartData,
    range,
    max,
    handleChange,
  } = useAthleteChartData(reportType);

  const {
    possibleParams,
    selectedParams,
    setSelectedParams,
    comparisonParam,
    setComparisonParam,
    paramSeriesMap,
    getParamColor,
  } = useAthleteExerciseReportParams(data);

  const { singleModeSeries, comparisonSeries, trainingIds } =
    useAthleteChartSeries(
      reportType,
      chartData,
      selectedParams,
      possibleParams,
      comparisonParam,
      paramSeriesMap,
      getParamColor,
      range
    );

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
      disabled: false,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const prettyLabel = (label: string) => {
    if (!label) return '';
    if (label === 'loadKg') return 'Load (kg)';
    if (label === 'reps') return 'Reps';
    if (label === 'loadKgR') return 'Load R (kg)';
    if (label === 'repsR') return 'Reps R';
    return label;
  };

  return (
    <Box
      maxWidth={
        typeof window !== 'undefined'
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
      }}
      style={style}
    >
      <Box
        id={`athlete-exercise-report-${id}`}
        ref={setNodeRef}
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={1}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="flex-end"
          justifyContent="center"
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            p: 0.5,
          }}
          gap={0.5}
        >
          <Box
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
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
          {reportType === 'single' && (
            <Box
              display="flex"
              justifyContent="flex-end"
              alignItems="center"
              gap={0.5}
            >
              <Typography
                fontSize={12}
                lineHeight={1}
                sx={{ userSelect: 'none' }}
              >
                Group by Training
              </Typography>
              <Checkbox
                size="small"
                sx={{ p: 0 }}
                checked={groupByTraining}
                onChange={(_, checked) => {
                  setGroupByTraining(checked);
                }}
              />
            </Box>
          )}
        </Box>

        <AthleteExerciseReportHeader
          id={id}
          reportType={reportType}
          setData={setData}
          setAllSetsData={setAllSetsData}
          cache={cache}
          passedUserId={passedUserId}
          passedUserIds={passedUserIds}
          passedExerciseId={passedExerciseId}
          groupByTraining={groupByTraining}
          setReports={setReports}
        />

        <Box
          width={'100%'}
          display="flex"
          alignItems={'center'}
          justifyContent="center"
          sx={{ cursor: 'pointer' }}
          gap={1}
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
          dataset={
            reportType === 'single'
              ? chartData.slice(range[0] - 1, range[1])
              : undefined
          }
          width={
            typeof window !== 'undefined'
              ? Math.min(window.innerWidth * 0.95, 400)
              : 400
          }
          height={250}
          onAxisClick={(_, id) => {
            const index = id?.dataIndex;

            if (index === undefined) return;

            const workload = data[index];

            if (!workload) return;

            setActiveSetNumber(workload.setNumber);

            const workloads = allSetsData.filter(
              (w) =>
                w.institutionId === workload.institutionId &&
                w.trainingId === workload.trainingId &&
                w.exerciseId === workload.exerciseId &&
                w.userId === workload.userId
            );

            setActiveWorkloadsForTooltip(workloads);
            setOpenWorkloadModal(true);
          }}
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
                      return dayjs(new Date(workload.timestamp)).format(
                        'DD/MM'
                      );
                    },
                  },
                ]
          }
          yAxis={[
            {
              id: LOAD_Y_AXIS_ID,
              label:
                reportType === 'single'
                  ? 'Load (kg)'
                  : prettyLabel(comparisonParam || ''),
              min: 0,
              position: 'left',
              max:
                Math.max(
                  ...chartData.map((d) => d.load ?? 0),
                  ...chartData.map((d) => d.loadR ?? 0)
                ) * 1.1,
            },
            reportType === 'single'
              ? {
                  id: REPS_Y_AXIS_ID,
                  label: 'Reps',
                  min: 0,
                  position: 'right',
                  max:
                    Math.max(
                      ...chartData.map((d) => d.reps ?? 0),
                      ...chartData.map((d) => d.repsR ?? 0)
                    ) * 1.1,
                }
              : {},
          ]}
          margin={{
            top: 10,
            bottom: 0,
            left: reportType === 'single' ? 10 : 2,
            right: 10,
          }}
          slots={{
            tooltip: () => (
              <AthleteExerciseChartTooltip
                data={data}
                reportType={reportType}
                groupByTraining={groupByTraining}
                openWorkloadModal={openWorkloadModal}
              />
            ),
          }}
          slotProps={{ tooltip: { trigger: 'axis' } }}
          sx={{
            cursor: 'pointer',
          }}
        />
      </Box>

      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        zIndex={1}
      >
        <Slider
          value={range}
          onChange={handleChange}
          valueLabelDisplay="off"
          min={1}
          max={max}
          step={1}
          sx={{
            width: '80%',
            color: 'background.paper',
            '& .MuiSlider-thumb': {
              backgroundColor: theme.palette.primary.main,
              width: 20,
              height: 20,
            },
            '& .MuiSlider-track': {
              height: 5,
              backgroundColor: 'background.paper',
            },
            '& .MuiSlider-rail': {
              backgroundColor: 'white',
              height: 5,
              opacity: 1,
            },
          }}
        />
      </Box>
    </Box>
  );
}
