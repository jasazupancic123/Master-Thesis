import { MoreVert } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';

import ComponentsAvatar from '../components-avatar/components-avatar';
import type { Component } from '@/controller/component/type/component.type';
import type { Cycle } from '@/controller/group/type/cycle.type';
import type { Group } from '@/controller/group/type/group.type';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';

interface AthleteTrainingCardHeaderProps {
  components: TrainingComponent[] | Component[];
  group?: Group;
  cycle?: Cycle;
  from: Date;
  to: Date;
}

export default function AthleteTrainingCardHeader(
  props: AthleteTrainingCardHeaderProps
) {
  const { components, group, cycle, from } = props;

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
                  id: c.id,
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
          <Typography
            sx={{
              fontWeight: 'bold',
              fontSize: 15,
              height: 20,
            }}
          >
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
      <IconButton sx={{ p: 0, m: 0 }}>
        <MoreVert />
      </IconButton>{' '}
    </Box>
  );
}
