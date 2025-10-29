import { Box, MenuItem, Select, Slider, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { HEATMAP_LEVEL_LABELS } from './constant/heatmap-level-labels.constant';
import useMuscleHeatmap from './hooks/use-muscle-heatmap';
import MuscleChart from './muscle-chart';
import { theme } from '@/app/style';
import HeatmapBackYellow from '@/assets/svg/heatmap_back_yellow.svg';
import HeatmapFrontYellow from '@/assets/svg/heatmap_front_yellow.svg';
import MuscleMapWithTooltip from '@/components/muscle-map-with-tooltip/muscle-map-with-tooltip';
import type { Attribute } from '@/core/attribute/type/attribute.type';
import { HEATMAP_COLORS } from '@/core/const/color.const';
import { core } from '@/core/core.service';
import { MuscleLoadType } from '@/core/exercise/enum/muscle-load-type.enum';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

export default function MuscleHeatmapView() {
  const screenSize = useScreenSize();

  const { trainings } = useGroup();
  const { supersets, selectedAthlete } = useTrainerDayView();

  const [exercises, setExercises] = useState<TrainingExercise[]>([]);

  const [selectedMuscle, setSelectedMuscle] = useState<Attribute | null>(null);
  const [selectedMuscleName, setSelectedMuscleName] = useState<string | null>(
    null
  );

  const {
    heatmapLevel,
    setHeatmapLevel,
    maxHeatmapLevel,
    muscleLoads,
    tipHeatmapFront,
    setTipHeatmapFront,
    tipHeatmapBack,
    setTipHeatmapBack,
    selectedLoadType,
    setSelectedLoadType,
    range,
    setRange,
  } = useMuscleHeatmap(exercises);

  useEffect(() => {
    setExercises(supersets.flatMap((s) => s.exercises));
  }, [supersets]);

  const handleChange = (_event: Event, newValue: number | number[]) => {
    setRange(newValue as number[]);
  };

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      {/* Slider here */}
      <Box
        display="flex"
        width={
          screenSize.isMobile
            ? '75%'
            : screenSize.isSmallerThanLaptop
              ? '50%'
              : '100%'
        }
        justifyContent="center"
        mb={2}
        gap={1}
      >
        <Select
          value={heatmapLevel ? heatmapLevel : 1}
          onChange={(e) => setHeatmapLevel(e.target.value as number)}
          fullWidth
          sx={{
            '& .MuiSelect-select': {
              p: 1,
            },
            width: 200,
          }}
        >
          {Array.from({ length: maxHeatmapLevel }, (_, i) => i + 1).map(
            (level, i) => {
              const label = HEATMAP_LEVEL_LABELS[i] || `Heatmap Level ${level}`;
              return (
                <MenuItem key={level} value={level}>
                  {label}
                </MenuItem>
              );
            }
          )}
        </Select>
        <Select
          value={selectedLoadType}
          onChange={(e) =>
            setSelectedLoadType(e.target.value as 'ALL' | MuscleLoadType)
          }
          sx={{
            '& .MuiSelect-select': {
              p: 1,
              width: 100,
            },
          }}
        >
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value={MuscleLoadType.CONCENTRIC}>Concentric</MenuItem>
          <MenuItem value={MuscleLoadType.ECCENTRIC}>Eccentric</MenuItem>
          <MenuItem value={MuscleLoadType.ISOMETRIC}>Isometric</MenuItem>
        </Select>
      </Box>
      <Box
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={0}
        sx={{
          flexDirection: screenSize.isSmallerThanLaptop ? 'column' : 'row',
        }}
      >
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          gap={1}
        >
          <Box
            width="100%"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
          >
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
                max={trainings.length}
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
              <Box display="flex" justifyContent="space-between" width="80%">
                <Typography variant="body2">First training</Typography>
                {selectedAthlete && selectedAthlete.displayName && (
                  <Typography variant="subtitle1">
                    <i>
                      {core.profile.getShortName(selectedAthlete.displayName)}
                    </i>
                  </Typography>
                )}
                <Typography variant="body2">Last training</Typography>
              </Box>
            </Box>
          </Box>
          <Box
            sx={
              screenSize.isSmallerThanLaptop
                ? {
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    flexWrap: 'nowrap',
                    maxHeight: screenSize.isReallySmall ? 350 : undefined,
                  }
                : {}
            }
            position="relative"
          >
            <MuscleMapWithTooltip
              front={true}
              Svg={HeatmapFrontYellow}
              exercisesInComponent={supersets.flatMap((s) => s.exercises)}
              heatmapLevel={heatmapLevel}
              maxHeatmapLevel={maxHeatmapLevel}
              muscleLoads={muscleLoads}
              tip={tipHeatmapFront}
              setTip={setTipHeatmapFront}
              selectedLoadType={selectedLoadType}
              setSelectedMuscle={setSelectedMuscle}
              setSelectedMuscleName={setSelectedMuscleName}
            />
            <MuscleMapWithTooltip
              front={false}
              Svg={HeatmapBackYellow}
              exercisesInComponent={supersets.flatMap((s) => s.exercises)}
              heatmapLevel={heatmapLevel}
              maxHeatmapLevel={maxHeatmapLevel}
              muscleLoads={muscleLoads}
              tip={tipHeatmapBack}
              setTip={setTipHeatmapBack}
              selectedLoadType={selectedLoadType}
              setSelectedMuscle={setSelectedMuscle}
              setSelectedMuscleName={setSelectedMuscleName}
            />

            {/* Legend */}
            <Box
              display="flex"
              flexDirection="column-reverse"
              sx={{
                position: 'absolute',
                bottom: 20,
                right: screenSize.isSmallerThanLaptop ? '50%' : -50,
                transform: screenSize.isSmallerThanLaptop
                  ? 'translateX(+50%)'
                  : 'none',
              }}
              gap={1}
            >
              {HEATMAP_COLORS.map((color, index) => (
                <Box
                  key={index}
                  bgcolor={color}
                  width={screenSize.isMobile ? 40 : 100}
                  height={screenSize.isMobile ? 3 : 5}
                />
              ))}
            </Box>
          </Box>
        </Box>
        <MuscleChart
          heatmapLevel={heatmapLevel}
          maxHeatmapLevel={maxHeatmapLevel}
          range={range}
          selectedMuscle={selectedMuscle}
          selectedMuscleName={selectedMuscleName}
        />
      </Box>
    </Box>
  );
}
