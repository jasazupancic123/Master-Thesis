import { Box, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { theme } from '@/app/style';
import type { Attribute } from '@/core/attribute/type/attribute.type';
import { core } from '@/core/core.service';
import { useGroup } from '@/store/group.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

interface Props {
  heatmapLevel: number;
  maxHeatmapLevel: number;
  range: number[];
  selectedMuscle: Attribute | null;
  selectedMuscleName: string | null;
}

export default function MuscleChart(props: Props) {
  const { trainings } = useGroup();
  const { component, selectedAthlete } = useTrainerDayView();

  const {
    heatmapLevel,
    maxHeatmapLevel,
    range,
    selectedMuscle,
    selectedMuscleName,
  } = props;

  const [dataset, setDataset] = useState<
    {
      index: number;
      concentric: number;
      eccentric: number;
      isometric: number;
      timestamp: Date;
    }[]
  >([]);

  useEffect(() => {
    if (!selectedMuscle || !component) return;

    let filteredTrainings = trainings.filter((t, index) => {
      return index + 1 >= range[0] && index + 1 <= range[1];
    });

    if (selectedAthlete) {
      filteredTrainings = filteredTrainings.map((t) =>
        core.training.getAthleteTraining(selectedAthlete.uid, t)
      );
    }

    // group by day string
    const dayMap = new Map<
      string,
      {
        timestamp: Date;
        concentric: number;
        eccentric: number;
        isometric: number;
      }
    >();

    for (let t of filteredTrainings) {
      if (selectedAthlete)
        t = core.training.getAthleteTraining(selectedAthlete.uid, t);

      const dayStr = dayjs(t.from).format('YYYY-MM-DD');
      const dayStart = dayjs(t.from).startOf('day').toDate();

      const exercises = core.training.getExercises(t, {
        componentId: component.id,
      });

      const loads = core.exercise.muscle.generateLoads(
        exercises,
        heatmapLevel,
        maxHeatmapLevel
      );

      const muscleLoad = loads.find((l) => l[0] === selectedMuscle.field);

      const concentric = muscleLoad?.[1].concentric || 0;
      const eccentric = muscleLoad?.[1].eccentric || 0;
      const isometric = muscleLoad?.[1].isometric || 0;

      const prev = dayMap.get(dayStr);
      if (prev) {
        prev.concentric += concentric;
        prev.eccentric += eccentric;
        prev.isometric += isometric;
      } else {
        dayMap.set(dayStr, {
          timestamp: dayStart,
          concentric,
          eccentric,
          isometric,
        });
      }
    }

    // turn map -> array, sort by time, add index if you still want it
    const newDataset = Array.from(dayMap.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((d, index) => ({
        index,
        ...d,
      }));

    setDataset(newDataset);
  }, [
    heatmapLevel,
    maxHeatmapLevel,
    range,
    selectedAthlete,
    selectedMuscle,
    trainings,
  ]);

  const uniqueDayTicks = Array.from(
    new Map(
      dataset.map((d) => {
        const dayStart = dayjs(d.timestamp).startOf('day').toDate();
        // key by ms so Map dedupes same day
        return [dayStart.getTime(), dayStart];
      })
    ).values()
  );

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Typography variant="h6" align="center" marginBottom={2}>
        {selectedMuscleName ? selectedMuscleName : 'Select a Muscle'}
      </Typography>
      <LineChart
        height={400}
        dataset={dataset}
        localeText={{
          noData: 'Select a muscle',
        }}
        xAxis={[
          {
            dataKey: 'timestamp',
            label: 'Training Date',
            valueFormatter: (value: Date) => {
              return dayjs(value).format('MM-DD');
            },
            tickInterval: uniqueDayTicks,
            scaleType: 'time',
          },
        ]}
        yAxis={[
          {
            min: 0,
            max: 10,
          },
        ]}
        series={[
          {
            dataKey: 'concentric',
            label: 'Concentric',
            color: theme.palette.primary.main,
          },
          {
            dataKey: 'eccentric',
            label: 'Eccentric',
            color: theme.palette.info.main,
          },
          {
            dataKey: 'isometric',
            label: 'Isometric',
            color: theme.palette.secondary.main,
          },
        ]}
      />
    </Box>
  );
}
