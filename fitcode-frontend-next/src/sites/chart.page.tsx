'use client';

import { Box, Slider, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';

import type { Component } from '@/core/component/type/component.type';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import SelectInput from '@/ui/select-input/select-input';

const data = [
  { name: 'A', intensity: 50, volume: 80 },
  { name: 'B', intensity: 70, volume: 60 },
  { name: 'C', intensity: 40, volume: 90 },
  { name: 'D', intensity: 90, volume: 40 },
  { name: 'E', intensity: 60, volume: 70 },
  { name: 'F', intensity: 80, volume: 50 },
  { name: 'G', intensity: 55, volume: 85 },
  { name: 'H', intensity: 75, volume: 65 },
  { name: 'I', intensity: 45, volume: 95 },
  { name: 'J', intensity: 85, volume: 45 },
];

export default function ChartPage() {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { components, exercises } = useMain();

  const [range, setRange] = useState<number[]>([1, 10]); // Example range

  const [parentComponents, setParentComponents] = useState(
    components?.filter((component) => component.parentId === null)
  );

  const [parentComponent, setParentComponent] = useState<Component | null>(
    null
  );
  const [isOnParent, setIsOnParent] = useState<boolean>(true);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [exercise, setExercise] = useState<Exercise | null>(null);

  const handleChange = (_event: Event, newValue: number | number[]) => {
    setRange(newValue as number[]);
  };

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: screenSize.isMobile ? 1 : 0,
        pb: screenSize.isLandscapeMobile ? 12 : 0,
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Box
        width="100%"
        display="flex"
        alignItems="center"
        flexDirection="column"
      >
        <Typography variant="h6" sx={{ pt: 2 }}>
          Intensity and volume chart
        </Typography>
      </Box>
      {isOnParent ? (
        <SelectInput<Component>
          label={parentComponent ? parentComponent.name : 'Select component'}
          icon={null}
          value={parentComponent ? parentComponent.id : ''}
          items={parentComponents}
          placeholder="Select component"
          displayEmpty={!parentComponent ? true : false}
          disableInputLabel={!parentComponent ? true : false}
          useRenderValue={true}
          itemKey="id"
          sx={{ mt: 2 }}
          itemName="name"
          setValue={(value) => {
            const component = components.find((c) => c.id === value);
            if (!component) return;
            setParentComponent(component);
            //check if this component has got any children
            const childComponents = components.filter(
              (c) => c.parentId === component.id
            );
            //check if any of the childComponents has got any children
            const hasChildren = components.some(
              (cc) => cc.parentId === component.id
            );
            if (hasChildren) {
              setParentComponents(childComponents);
              setIsOnParent(true);
            } else {
              setFilteredExercises(
                exercises.filter((exercise) =>
                  exercise.componentIds.includes(component.id)
                )
              );
              setIsOnParent(false);
            }
          }}
        />
      ) : (
        filteredExercises &&
        parentComponent && (
          <SelectInput<Exercise>
            label={parentComponent.name}
            icon={null}
            value={exercise ? exercise.id : ''}
            items={filteredExercises}
            placeholder="Remove Component"
            displayEmpty={false}
            disableInputLabel={false}
            itemKey="id"
            sx={{ mt: 2 }}
            useRenderValue={true}
            itemName="name"
            enableRemove={true}
            setValue={(value) => {
              if (value === 'Remove Component') {
                setExercise(null);
                setFilteredExercises([]);
                setParentComponent(null);
                setParentComponents(
                  components.filter((component) => component.parentId === null)
                );
                setIsOnParent(true);
                return;
              }
              const exercise = exercises.find((e) => e.id === value);
              if (!exercise) return;
              setExercise(exercise);
            }}
          />
        )
      )}

      {/* Graph */}
      {exercise && (
        <>
          <Box width="100%" height={250} sx={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.slice(range[0] - 1, range[1])}>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#222',
                    borderRadius: '10px',
                    color: '#fff',
                  }}
                />
                <defs>
                  <filter id="glow-red">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glow-yellow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <Line
                  type="monotone"
                  dataKey="intensity"
                  stroke="#FF5555"
                  strokeWidth={3}
                  filter="url(#glow-red)"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#FFD700"
                  strokeWidth={3}
                  filter="url(#glow-yellow)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Custom Legend - Positioned Inside the Graph Box */}
            <Box
              display="flex"
              justifyContent="center"
              sx={{
                position: 'absolute',
                bottom: 10, // Adjust position inside the graph
                left: '50%',
                transform: 'translateX(-50%)',
                borderRadius: '8px',
                padding: '4px 8px',
              }}
            >
              <Box display="flex" alignItems="center" mr={2}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: '#FF5555',
                    borderRadius: '50%',
                    mr: 1,
                  }}
                />
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  Intensity
                </Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: '#FFD700',
                    borderRadius: '50%',
                    mr: 1,
                  }}
                />
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  Volume
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box
            width="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
          >
            <Slider
              value={range}
              onChange={handleChange}
              valueLabelDisplay="off"
              min={1}
              max={10}
              step={1}
              sx={{
                width: '80%',
                color: 'background.default',
                '& .MuiSlider-thumb': {
                  backgroundColor: '#1abc9c', // Green dots
                  width: 20,
                  height: 20,
                },
                '& .MuiSlider-track': {
                  height: 5,
                  backgroundColor: 'background.default',
                },
                '& .MuiSlider-rail': {
                  backgroundColor: 'white',
                  height: 5,
                  opacity: 1,
                },
              }}
            />
            <Box display="flex" justifyContent="space-between" width="80%">
              <Typography variant="body2">1st training</Typography>
              <Typography variant="body2">last</Typography>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
