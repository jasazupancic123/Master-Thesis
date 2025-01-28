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
import { Divider } from '@mui/material';

export default function AthletePageRouter(props: GroupPageProps) {
  const { token } = useAppContext();

  useEffect(() => {
    async function fetchActiveCycle() {
      const { group } = props.selected;
      if (!group) return;

      try {
        const cycle = await GroupController.findActiveCycle(token, group.id);
        props.setSelected((prev) => ({ ...prev, cycle }));
      } catch (e) {
        console.error(e);
        toast.error('Error fetching active cycle');
      }
    }

    fetchActiveCycle().then();
  }, [props.selected.group?.id, token]);

  useEffect(() => {
    async function fetchActiveCycleTrainings() {
      const { group, cycle } = props.selected;
      if (!group || !cycle) return;

      try {
        const trainings = await TrainingController.findTrainings(token, {
          groupId: group.id,
          cycleId: cycle.id,
          from: dayjs().startOf('day').toDate(),
          to: dayjs().endOf('day').toDate(),
        });

        props.setSelected((prev) => ({
          ...prev,
          cycle: { ...cycle, trainings },
        }));
      } catch (e) {
        console.error(e);
        toast.error('Error fetching active cycle');
      }
    }

    fetchActiveCycleTrainings().then();
  }, [props.selected.cycle?.id, token]);

  return (
    <>
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
                const group = props.groups.data?.find(
                  (group) => group.id === value
                );
                props.setSelected((prev) => ({
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
      <Stack p={2} sx={{ borderRadius: 2 }} spacing={3}>
        {props.selected.cycle && (
          <>
            {props.selected.cycle?.trainings?.length === 0 ? (
              <Typography
                variant="body1"
                sx={{ textAlign: 'center', color: 'text.secondary' }}
              >
                Loading trainings...
              </Typography>
            ) : (
              props.selected.cycle.trainings?.map((training, i) => (
                <Box key={i} sx={{ borderRadius: 2, p: 3 }}>
                  {/* Training Time Header */}
                  <Stack direction="row" sx={{ borderRadius: 5 }}>
                    <Box
                      sx={{
                        width: 25,
                        height: 25,
                        backgroundColor: 'background.default',
                        borderBottomLeftRadius: 5,
                        borderTopLeftRadius: 5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 3,
                      }}
                    />

                    <Stack
                      direction="row"
                      spacing={3}
                      sx={{
                        backgroundColor: '#025c59',
                        px: 1,
                        borderTopRightRadius: 5,
                        borderBottomRightRadius: 5,
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {CommonService.instance.date.formatTime(
                          dayjs(training.from)
                        )}{' '}
                        -{' '}
                        {CommonService.instance.date.formatTime(
                          dayjs(training.to)
                        )}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: 'text.secondary' }}
                      >
                        {CommonService.instance.date.format(new Date())}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 0.5, mb: 2 }} />

                  {/* Components */}
                  <Stack spacing={3}>
                    {training.components.map((component) => (
                      <Box key={component.componentId} sx={{ borderRadius: 2 }}>
                        <AthleteTrainingExerciseCard
                          component={component}
                          trainingId={training.id}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ))
            )}
          </>
        )}
      </Stack>
    </>
  );
}
