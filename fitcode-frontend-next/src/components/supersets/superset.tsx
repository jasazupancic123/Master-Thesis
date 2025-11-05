'use client';

import { useDroppable } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { Box, Grid2, Stack, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material';

import SupersetExercise from './superset-exercise';
import { core } from '@/core/core.service';
import { MainSet } from '@/core/training/enum/main-set.enum';
import type { Superset as SupersetClass } from '@/core/training/type/superset.type';
import { lib } from '@/lib';
import { useScreenSize } from '@/store/screen-size.provider';
import { useSupersets } from '@/store/supersets.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

const WarmupIcon = lib.common.component.getIcon('warmup');
const CooldownIcon = lib.common.component.getIcon('cooldown');

interface Props {
  superset: SupersetClass;
  supersetIndex: number;
}

export default function Superset({ superset, supersetIndex }: Props) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const { selectedExercise, setOpenAddExerciseModal } = useSupersets();
  const { training, component, selectedSubgroup, changeSupersetMainSet } =
    useTrainerDayView();

  const containerId = `${component?.id}-${supersetIndex}`;
  const items = superset.exercises.map((e) => e.id);
  const { setNodeRef } = useDroppable({ id: containerId });

  if (!component || !training) return null;

  const isVirtualSubgroup = core.training.subgroup.isVirtual(selectedSubgroup);

  return (
    <Grid2
      key={`${component.id}-${supersetIndex}`}
      size={{
        xs: 12,
        sm:
          selectedExercise &&
          superset.exercises.some((e) => e.id === selectedExercise.id)
            ? 12
            : screenSize.isLandscapeMobile
              ? 4
              : 12,
        md:
          selectedExercise &&
          superset.exercises.some((e) => e.id === selectedExercise.id)
            ? screenSize.isLandscapeMobile
              ? 4
              : 6
            : screenSize.isLandscapeMobile
              ? 4
              : screenSize.isSmallerThanLaptop
                ? 6
                : screenSize.isLaptop
                  ? 4
                  : 3,
      }}
      sx={{ px: 0.5 }}
    >
      <Box
        ref={setNodeRef}
        sx={{
          p:
            superset.exercises.length > 0 && superset.exercises.length % 2 === 0
              ? '1.1px'
              : '1px',
          borderRadius: '5px',
          background: superset.warmup
            ? theme.palette.warning.light
            : superset.cooldown
              ? theme.palette.success.light
              : lib.common.component.getBorderGradient(theme),
          position: 'relative',
          zIndex: 100,
        }}
      >
        {superset.warmup && WarmupIcon ? (
          <Box
            sx={{
              height: 18,
              position: 'absolute',
              top: -8,
              left: 4,
              borderRadius: '50%',
              zIndex: 10,
              backgroundColor: theme.palette.background.dark,
            }}
          >
            <WarmupIcon sx={{ width: 18, height: 18 }} />
          </Box>
        ) : null}

        {superset.cooldown && CooldownIcon ? (
          <Box
            sx={{
              height: 18,
              position: 'absolute',
              top: -8,
              left: 4,
              borderRadius: '50%',
              zIndex: 10,
              backgroundColor: theme.palette.background.dark,
            }}
          >
            <CooldownIcon sx={{ width: 18, height: 18 }} />
          </Box>
        ) : null}

        {superset.mainSet === MainSet.BLOCK && (
          <Tooltip
            title={!isVirtualSubgroup ? 'Change to circuit set' : 'Circuit set'}
          >
            <Box
              sx={{
                height: 15,
                position: 'absolute',
                top: -8,
                right: 4,
                borderRadius: '50%',
                zIndex: 10,
                backgroundColor: theme.palette.background.dark,
                cursor: !isVirtualSubgroup ? 'pointer' : undefined,
              }}
              onClick={() => {
                if (isVirtualSubgroup) return;

                changeSupersetMainSet(supersetIndex, MainSet.CIRCUIT);
              }}
            >
              <SwapVertIcon sx={{ width: 15, height: 15 }} />
            </Box>
          </Tooltip>
        )}

        {superset.mainSet === MainSet.CIRCUIT && (
          <Tooltip
            title={!isVirtualSubgroup ? 'Change to block set' : 'Block set'}
          >
            <Box
              sx={{
                height: 15,
                position: 'absolute',
                top: -8,
                right: 4,
                borderRadius: '50%',
                zIndex: 10,
                backgroundColor: theme.palette.background.dark,
                cursor: !isVirtualSubgroup ? 'pointer' : undefined,
              }}
              onClick={() => {
                if (isVirtualSubgroup) return;

                changeSupersetMainSet(supersetIndex, MainSet.BLOCK);
              }}
            >
              <RotateLeftIcon sx={{ width: 15, height: 15 }} />
            </Box>
          </Tooltip>
        )}

        <Stack
          p={screenSize.isLandscapeMobile ? 0.5 : 0}
          pt={0}
          sx={{
            backgroundColor: theme.palette.background.default,
            borderRadius: '5px',
          }}
        >
          <SortableContext
            id={containerId}
            items={items}
            strategy={rectSortingStrategy}
          >
            <Grid2 id="exercises-container" container>
              {(superset.warmup || superset.cooldown) &&
              superset.exercises.length === 0 ? (
                <Box
                  borderRadius={2}
                  py={3}
                  width="99.5%"
                  height="100%"
                  textAlign="center"
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: theme.palette.background.light,
                  }}
                  onClick={() => setOpenAddExerciseModal(true)}
                >
                  <Typography variant="body2" align="center">
                    Add exercise
                  </Typography>
                </Box>
              ) : (
                superset.exercises.map((exercise, exerciseIndex) => (
                  <SupersetExercise
                    key={`${component.id}-${supersetIndex}-${exerciseIndex}`}
                    exercise={exercise}
                    superset={superset}
                    supersetIndex={supersetIndex}
                    exerciseIndex={exerciseIndex}
                  />
                ))
              )}
            </Grid2>
          </SortableContext>
        </Stack>
      </Box>
    </Grid2>
  );
}
