import { Add, CloseRounded, Delete } from '@mui/icons-material';
import {
  Box,
  Divider,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import { addMinutes } from 'date-fns';
import { useState } from 'react';
import toast from 'react-hot-toast';

import ExerciseMenuDropdown from '../exercises-list/exercise-menu';
import type { Attribute } from '@/core/attribute/type/attribute.type';
import { core } from '@/core/core.service';
import { Components } from '@/core/exercise/constant/components.constant';
import { MainSet } from '@/core/training/enum/main-set.enum';
import { TrainingController } from '@/core/training/training.controller';
import type { Superset } from '@/core/training/type/superset.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useMain } from '@/store/main.provider';
import MyModal from '@/ui/modal';
import SelectInput from '@/ui/select-input/select-input';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  onCreateTraining?: (training: Training) => void;
}

const DEFAULT_COMPONENT: Attribute | null =
  Components.find((c) => c.field === 'strength') || null;

const DEFAULT_SUPERSET: Superset = { exercises: [], mainSet: MainSet.BLOCK };

export default function CreateTrainingModal({
  open,
  setOpen,
  onCreateTraining,
}: Props) {
  const { exercises, institutions } = useMain();
  const institutionId = institutions?.[0]?.id;

  const [component, setComponent] = useState(DEFAULT_COMPONENT);
  const [supersets, setSupersets] = useState([DEFAULT_SUPERSET]);

  const [openExerciseMenu, setOpenExerciseMenu] = useState(false);
  const [selectedSupersetIndex, setSelectedSupersetIndex] = useState<
    number | null
  >(null);

  function addSuperset() {
    if (supersets.length >= 4) return;
    setSupersets((prev) => [
      ...prev,
      { exercises: [], mainSet: MainSet.BLOCK },
    ]);
  }

  function deleteSuperset(index: number) {
    if (supersets.length === 1) return; // always keep at least one
    setSupersets((prev) => prev.filter((_, i) => i !== index));
  }

  function addExerciseToSuperset(exerciseId: string) {
    const exercise = exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) return;
    if (selectedSupersetIndex === null) return;
    if (supersets[selectedSupersetIndex].exercises.length >= 4) return; // max 4 exercises per superset

    const trainingExercise: TrainingExercise = {
      id: exerciseId,
      exercise,
      sets: [
        core.training.set.stub(1, exercise),
        core.training.set.stub(2, exercise),
        core.training.set.stub(3, exercise),
      ],
    };

    setSupersets((prev) => {
      const newSupersets = [...prev];
      newSupersets[selectedSupersetIndex].exercises.push(trainingExercise);
      return newSupersets;
    });
  }

  function deleteExercise(supersetIndex: number, exerciseIndex: number) {
    setSupersets((prev) => {
      const updated = [...prev];
      updated[supersetIndex].exercises = updated[
        supersetIndex
      ].exercises.filter((_, i) => i !== exerciseIndex);

      return updated;
    });
  }

  if (!institutionId) {
    toast.error('No institution found');
    return null;
  }

  return (
    <MyModal
      isOpen={open}
      setIsOpen={setOpen}
      title="Create Training"
      width={300}
      onCancel={() => {}}
      onConfirm={async () => {
        if (!component) return;

        try {
          const training = await TrainingController.getInstance().create({
            institutionId,
            from: new Date(),
            membersIds: [],
            components: [
              {
                id: component.field as string,
                from: new Date(),
                to: addMinutes(new Date(), 30),
                supersets,
                subgroups: [],
              },
            ],
          });

          setOpen(false);
          setComponent(DEFAULT_COMPONENT);
          setSupersets([DEFAULT_SUPERSET]);
          toast.success('Training created successfully');

          onCreateTraining?.(training);
        } catch (e) {
          console.error(e);
          toast.error((e as Error).message || 'Failed to create training');
        }
      }}
    >
      <Box position="relative" p={2}>
        <SelectInput<Attribute>
          label="Component"
          value={(component?.field as string) || ''}
          setValue={(val) =>
            setComponent(Components.find((c) => c.field === val) || null)
          }
          icon={null}
          itemKey="field"
          itemName="name"
          items={Components}
          sx={{ mt: 2 }}
        />

        <Divider />

        <Box display="flex" flexDirection="column" mt={1} gap={1}>
          <ExerciseMenuDropdown
            exercises={exercises}
            open={openExerciseMenu}
            setOpen={setOpenExerciseMenu}
            hideExerciseIds={supersets
              .flatMap((s) => s.exercises)
              .map((e) => e.id)}
            onSelectExercise={(exercise) => {
              addExerciseToSuperset(exercise.id);
            }}
            closeOnSelect={false}
          />
        </Box>

        <Box
          position="relative"
          display="flex"
          flexDirection="column"
          gap={2}
          sx={{ mt: 1 }}
        >
          {supersets.map((superset, index) => (
            <Paper
              key={index}
              elevation={3}
              sx={{
                p: 2,
                borderRadius: 2,
                background: '#1a1a1a',
                border: '1px solid #333',
              }}
            >
              <Box
                position="relative"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1.5}
              >
                <Typography fontWeight={700} variant="subtitle1">
                  Superset {index + 1}
                </Typography>

                {supersets.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => deleteSuperset(index)}
                    color="error"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Box>
                {superset.exercises.map((e, exerciseIndex) => {
                  const shortName =
                    e.exercise?.name?.length && e.exercise?.name.length > 20
                      ? e.exercise?.name.slice(0, 17) + '...'
                      : e.exercise?.name;

                  return (
                    <Box
                      key={e.id}
                      display="flex"
                      alignItems="center"
                      gap={1}
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <Typography key={e.id} variant="subtitle2">
                        {shortName} ({e.sets.length} x {e.sets[0]?.reps || '-'})
                      </Typography>

                      <IconButton
                        size="small"
                        onClick={() => deleteExercise(index, exerciseIndex)}
                      >
                        <CloseRounded fontSize="small" />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>

              {superset.exercises.length < 4 && (
                <Box mt={1}>
                  <Tooltip title="Add Exercise">
                    <IconButton
                      onClick={() => {
                        setSelectedSupersetIndex(index);
                        setOpenExerciseMenu(true);
                      }}
                    >
                      <Add />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Paper>
          ))}

          {supersets.length < 4 && (
            <Tooltip title="Add Superset">
              <IconButton
                onClick={addSuperset}
                sx={{ alignSelf: 'center', mt: 1 }}
              >
                <Add />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </MyModal>
  );
}
