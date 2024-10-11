'use client';

import { GroupPageProps } from '@/group/type/props.type';
import Box from '@mui/material/Box';
import SelectInput from '@/common/components/select-input';
import { Group } from '@/group/entity/group.entity';
import GroupIcon from '@mui/icons-material/Group';
import React, { useEffect } from 'react';
import { useAppContext } from '@/context/app-provider';
import { GroupController } from '@/group/group.controller';
import { TrainingController } from '@/training/training.controller';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import AthleteTrainingExerciseCard from '@/training/components/athlete-training-exercise-card';
import { CommonService } from '@/common/service/common.service';

export default function AthletePageRouter(props: GroupPageProps) {
  const { token } = useAppContext();

  useEffect(() => {
    async function fetchActiveCycle() {
      const { group } = props.selected;
      if (!group) return;

      try {
        const cycle = await GroupController.findActiveCycle(token, group.id);
        const trainings = await TrainingController.findTrainings(token, {
          groupId: group.id,
          cycleId: cycle.id,
          from: dayjs().startOf('day').toDate(),
          to: dayjs().endOf('day').toDate(),
        });

        props.setSelected(prev => ({
          ...prev,
          cycle: {
            ...cycle,
            trainings: trainings.sort((a, b) => dayjs(a.from).diff(dayjs(b.from))),
          },
        }));
      } catch (e) {
        console.error(e);
        toast.error('Error fetching active cycle & trainings');
      }
    }

    fetchActiveCycle().then();
  }, [props.selected.group?.id, token]);

  return <>
    <Box>
      {/* Dropdowns to select group and cycle */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Box>
          {/* Select group */}
          <SelectInput<Group>
            label="Group"
            icon={<GroupIcon />}
            value={props.selected.group?.id || ''}
            setValue={(value) => {
              const group = props.groups.data?.find((group) => group.id === value);
              props.setSelected(prev => ({
                ...prev,
                group: group || null,
                cycle: null,
                subgroup: null,
              }));
            }}
            items={props.groups.data || []}
            itemKey="id"
            itemName="name"
          />
        </Box>
      </Box>
    </Box>

    {/* Trainings */}
    <Box p={2}>
      {props.selected.cycle && <>
        {props.selected.cycle.trainings.map((training, i) => (
          <Box key={i}>
            <Typography variant="h6">
              ({CommonService.instance.date.formatTime(dayjs(training.from))} - {CommonService.instance.date.formatTime(dayjs(training.to))})
            </Typography>

            <Stack spacing={2}>
              {training.components.map((component) => (
                <Box key={component.componentId}>
                  <AthleteTrainingExerciseCard component={component} />
                </Box>
              ))}
            </Stack>
          </Box>
        ))}
      </>}
    </Box>
  </>;
}