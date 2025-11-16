import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { LineChart } from '@mui/x-charts';
import { useEffect, useState } from 'react';

import { TrainingController } from '@/core/training/training.controller';
import type { Workload } from '@/core/training/type/workload.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import ImageGallery from '@/ui/image-gallery';
import MyModal from '@/ui/modal';

type Props = {
  selectedUserId?: string;
};

const cache = new Map<string, Workload[]>();

export default function AthleteExerciseReport({ selectedUserId }: Props) {
  const { exercises } = useMain();
  const { selectedInstitution, trainings } = useDashboard();
  const [data, setData] = useState<Workload[]>([]);

  const [openGallery, setOpenGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const uniqueExerciseIds = [
    ...new Set(
      trainings.flatMap((t) =>
        t.components.flatMap((c) => [
          ...c.supersets.flatMap((s) => s.exercises.map((e) => e.id)),
          ...c.subgroups.flatMap((sg) =>
            sg.supersets.flatMap((ss) => ss.exercises.map((e) => e.id))
          ),
        ])
      )
    ),
  ];

  const exercisesToSelect = uniqueExerciseIds
    .map((id) => exercises.find((e) => e.id === id))
    .filter((e): e is NonNullable<typeof e> => !!e);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    exercisesToSelect[0]?.id || null
  );

  useEffect(() => {
    if (!selectedUserId || !selectedExerciseId) return;

    const key = `${selectedUserId}-${selectedExerciseId}`;
    if (cache.has(key)) {
      setData(cache.get(key)!);
      return;
    }

    const fetchExerciseWorkloads = async () => {
      const workloads =
        await TrainingController.getInstance().getUserExerciseReport(
          selectedInstitution!.id,
          selectedUserId,
          selectedExerciseId
        );

      cache.set(key, workloads);
      setData(workloads);
    };

    fetchExerciseWorkloads();
  }, [selectedUserId, selectedExerciseId, selectedInstitution]);

  if (!selectedUserId)
    return <Typography variant="body1">Select an athlete</Typography>;

  if (!uniqueExerciseIds.length)
    return <Typography variant="body1">No exercises found</Typography>;

  const chartData = data.map((w) => ({
    date: new Date(w.timestamp),
    load: w.loadKg || 0,
  }));

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      width="100%"
      gap={3}
    >
      {/* Chart */}
      <LineChart
        dataset={chartData}
        series={[
          {
            dataKey: 'load',
            label: 'Load (kg)',
            showMark: true,
          },
        ]}
        xAxis={[
          {
            dataKey: 'date',
            scaleType: 'time',
            label: 'Date',
            valueFormatter: (v: Date) =>
              v instanceof Date
                ? v.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : '',
          },
        ]}
        yAxis={[{ label: '', min: 0 }]}
        width={650}
        height={350}
        margin={{ top: 40, bottom: 60, left: 60, right: 20 }}
        onMarkClick={(_, item) => {
          const workload = data[item.dataIndex || 0];
          const photoURLs = workload?.photoURLs || [];
          if (photoURLs.length > 0) {
            setGalleryImages(photoURLs);
            setOpenGallery(true);
          }
        }}
      />

      {/* Exercise selector */}
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel id="exercise-select-label">Exercise</InputLabel>
        <Select
          labelId="exercise-select-label"
          value={selectedExerciseId}
          label="Exercise"
          onChange={(e) => setSelectedExerciseId(e.target.value as string)}
        >
          {exercisesToSelect.map((exercise) => (
            <MenuItem key={exercise.id} value={exercise.id}>
              {exercise.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

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