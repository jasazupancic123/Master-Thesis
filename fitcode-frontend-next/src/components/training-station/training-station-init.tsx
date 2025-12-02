import { useCoachTrainingStation } from '@/store/coach-training-station.provider';
import {
  Box,
  Button,
  Checkbox,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { DEFAULT_SUBGROUP } from '../trainer-group-day-view/constant/subgroups.constant';
import { useCoachTraining } from '@/store/coach-training.provider';
import { Subgroup } from '@/core/training/type/subgroup.type';
import Image from 'next/image';
import { lib } from '@/lib';
import { Group } from '@mui/icons-material';
import { useRef, useState } from 'react';
import { EXERCISE_DEFAULT_IMG_URL } from '@/lib/common/const/image.const';
import { theme } from '@/app/style';
import { useScreenSize } from '@/store/screen-size.provider';
import { GRAPH_COLORS } from '@/core/const/color.const';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import { v4 } from 'uuid';
import SelectedExercisesList from '../add-exercise-form/selected-exercises-list';
import toast from 'react-hot-toast';

export default function TrainingStationInit() {
  const screenSize = useScreenSize();

  const { training } = useCoachTraining();
  const {
    component,
    setStation,
    setSelectedExercise,
    setSelectedUser,
    setSelectedSetIndex,
  } = useCoachTrainingStation();

  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [stationName, setStationName] = useState<string>('');
  const [color, setColor] = useState<string>(GRAPH_COLORS[0]);
  const [openColorMenu, setOpenColorMenu] = useState<boolean>(false);

  const anchorElColorMenuRef = useRef<HTMLDivElement | null>(null);

  if (!component) return;

  const allExercises = [
    ...component.supersets.flatMap((s) => s.exercises),
    ...component.subgroups.flatMap((sg) =>
      sg.supersets.flatMap((s) => s.exercises)
    ),
  ];

  console.log('allExercises', allExercises);
  console.log('component', component);

  const uniqueExercises = Array.from(
    new Set(allExercises.map((e) => e.id))
  ).map((id) => allExercises.find((e) => e.id === id)!);

  const availableMembers = (training.members || []).filter(
    (m) => !component?.subgroups.some((sg) => sg.membersIds.includes(m.uid))
  );

  const subgroups: Subgroup[] = [
    { ...DEFAULT_SUBGROUP(availableMembers), supersets: component.supersets },
    ...component.subgroups,
  ];

  const IMAGES_WIDTH = 140;

  return (
    <Box
      width={screenSize.isMobile ? '90%' : screenSize.isTablet ? '70%' : '50%'}
      minWidth={300}
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{ mx: 'auto' }}
      gap={1}
      pb={2}
    >
      <Typography variant="h5">Create Training Station</Typography>

      <Box width="100%" display="flex" justifyContent="center" gap={1}>
        <TextField
          value={stationName}
          onChange={(e) => {
            setStationName(e.target.value);
          }}
          label="Station Name"
          margin="normal"
          size="small"
        />
        <Box display="flex" flexDirection="column" justifyContent="center">
          <Typography fontSize={10} textAlign="center">
            Color
          </Typography>
          <Box
            ref={anchorElColorMenuRef}
            width={30}
            height={30}
            borderRadius={4}
            sx={{
              border: `1px solid ${theme.palette.background.light}`,
              backgroundColor: color,
              cursor: 'pointer',
            }}
            onClick={() => setOpenColorMenu(!openColorMenu)}
          />
        </Box>
      </Box>

      <SelectedExercisesList
        newAddedExercisesIds={selectedExerciseIds}
        setNewAddedExercisesIds={() => {}}
        setSelectedExerciseIds={setSelectedExerciseIds}
        disableMargin
        disableWrap
      />

      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        maxHeight="62dvh"
        gap={1}
        sx={{
          overflowY: 'auto',
          ...styledScrollbarSx(theme),
        }}
      >
        {uniqueExercises.map((exercise) => {
          const exerciseObject = exercise.exercise;

          const subgroupsWithExercise = subgroups
            .filter((s) => !s.parentId)
            .filter((sg) =>
              sg.supersets.some((s) =>
                s.exercises.some((e) => e.id === exercise.id)
              )
            );

          const membersWithExercise = subgroupsWithExercise.reduce(
            (acc, sg) => {
              return acc + sg.membersIds.length;
            },
            0
          );

          const subgroupsNames = subgroupsWithExercise
            .map((sg) => sg.name)
            .join(', ');

          return (
            <Box
              key={exercise.id}
              width="100%"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                borderRadius: 2,
                backgroundColor: theme.palette.background.light,
                border: selectedExerciseIds.includes(exercise.id)
                  ? `1px solid ${theme.palette.primary.main}`
                  : '1px solid transparent',
                p: 1,
                cursor: 'pointer',
              }}
              onClick={() => {
                if (selectedExerciseIds.includes(exercise.id)) {
                  setSelectedExerciseIds(
                    selectedExerciseIds.filter((id) => id !== exercise.id)
                  );
                } else
                  setSelectedExerciseIds([...selectedExerciseIds, exercise.id]);
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Image
                  src={exerciseObject?.imageUrl || EXERCISE_DEFAULT_IMG_URL}
                  alt="Exercise Image"
                  width={IMAGES_WIDTH}
                  height={0}
                  unoptimized={lib.common.env.unoptimizeImages()}
                  layout="intrinsic"
                  style={{
                    filter: 'grayscale(100%)',
                  }}
                />
                <Box display="flex" flexDirection="column" gap={0.5}>
                  <Typography variant="h6">
                    {exerciseObject?.name || 'Unknown Exercise'}
                  </Typography>
                  <Box
                    display="flex"
                    flexWrap="wrap"
                    alignItems="center"
                    gap={1}
                  >
                    <Typography display="flex" alignItems="center" gap={0.5}>
                      <Group sx={{ mb: 0.5 }} /> {membersWithExercise}
                    </Typography>
                    <Typography lineHeight={1}>{subgroupsNames}</Typography>
                  </Box>
                </Box>
              </Box>

              <Checkbox
                checked={selectedExerciseIds.includes(exercise.id)}
                onChange={(e) => {
                  let newSelected = [...selectedExerciseIds];
                  if (e.target.checked) {
                    newSelected.push(exercise.id);
                  } else {
                    newSelected = newSelected.filter(
                      (id) => id !== exercise.id
                    );
                  }
                  setSelectedExerciseIds(newSelected);
                }}
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                }}
              />
            </Box>
          );
        })}
      </Box>

      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={() => {
          if (!stationName || !stationName.trim().length) {
            toast.error('Provide station name');
            return;
          }

          if (!selectedExerciseIds.length) {
            toast.error('Select at least one exercise');
            return;
          }

          const subgroupsWithSelectedExercises = subgroups
            .filter((sg) => !sg.parentId)
            .filter((sg) =>
              sg.supersets.some((s) =>
                s.exercises.some((e) => selectedExerciseIds.includes(e.id))
              )
            );

          const allUserIds = subgroupsWithSelectedExercises
            .map((sg) => sg.membersIds)
            .flat();

          const uniqueUserIds = Array.from(new Set(allUserIds));

          const users = (training.members || []).filter((m) =>
            uniqueUserIds.includes(m.uid)
          );

          const exercises = uniqueExercises.filter((e) =>
            selectedExerciseIds.includes(e.id)
          );

          setStation({
            id: v4(),
            name: stationName,
            color,
            trainingId: training.id,
            componentId: component.id,
            users,
            exercises,
          });

          setSelectedExercise(exercises[0] || null);
          setSelectedUser(users[0] || null);
          setSelectedSetIndex(0);
        }}
      >
        Create Station
      </Button>

      <Menu
        anchorEl={anchorElColorMenuRef.current}
        open={openColorMenu}
        onClose={() => {
          setOpenColorMenu(false);
        }}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        {GRAPH_COLORS.map((c) => (
          <MenuItem
            key={c}
            onClick={() => {
              setColor(c);
              setOpenColorMenu(false);
            }}
          >
            <Box width={20} height={20} bgcolor={c} borderRadius="50%" />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
