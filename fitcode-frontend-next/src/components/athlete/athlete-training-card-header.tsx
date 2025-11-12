import { Check, Circle, MoreVert } from '@mui/icons-material';
import { Box, IconButton, Typography, useTheme } from '@mui/material';

import ComponentsAvatar from './components-avatar';
import type { Component } from '@/core/exercise/type/component.type';
import type { Cycle } from '@/core/group/type/cycle.type';
import type { Group } from '@/core/group/type/group.type';
import { MainSet } from '@/core/training/enum/main-set.enum';
import { TrainingStatus } from '@/core/training/enum/training-status.enum';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { TrainingStats } from '@/core/training/type/training-stats.type';

interface Props {
  report?: TrainingStats;
  components: TrainingComponent[] | Component[];
  group?: Group;
  cycle?: Cycle;
  from: Date;
  to: Date;
}

export default function AthleteTrainingCardHeader({
  report,
  components,
  group,
  cycle,
  from,
}: Props) {
  const theme = useTheme();

  const isTrainingComponentArray = (
    components: TrainingComponent[] | Component[]
  ): components is TrainingComponent[] => {
    return (components as TrainingComponent[]).every(
      (component) => component.supersets !== undefined
    );
  };

  return (
    <Box
      width="100%"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      gap={1}
    >
      {/* Group name, cycle name, date */}
      <Box display="flex" alignItems="center" gap={1}>
        <ComponentsAvatar
          size={50}
          components={
            isTrainingComponentArray(components)
              ? components
              : (components || []).map((c) => ({
                  id: c.field,
                  completedMembersIds: [],
                  from: new Date(),
                  to: new Date(),
                  mainSet: MainSet.BLOCK,
                  subgroups: [],
                  supersets: [],
                }))
          }
        />

        <Box display="flex" flexDirection="column">
          <Typography sx={{ fontWeight: 'bold', fontSize: 15, height: 20 }}>
            {group?.name}
          </Typography>

          <Typography sx={{ fontSize: 12, height: 16 }}>
            {cycle?.name}
          </Typography>

          <Typography sx={{ fontSize: 12, height: 16 }}>
            {new Date(from).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}{' '}
            at{' '}
            {new Date(from).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: 'numeric',
            })}
          </Typography>
        </Box>
      </Box>

      <Box>
        {report && (
          <>
            {report.status === TrainingStatus.IN_PROGRESS && (
              <Circle
                sx={{ color: theme.palette.primary.main, fontSize: 12 }}
              />
            )}

            {report.status === TrainingStatus.COMPLETED && (
              <Check sx={{ color: theme.palette.success.main, fontSize: 16 }} />
            )}
          </>
        )}

        <IconButton sx={{ p: 0, m: 0 }}>
          <MoreVert />
        </IconButton>
      </Box>
    </Box>
  );
}
