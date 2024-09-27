'use client';

import withAuth from '@/common/components/with-auth';
import { UserRole } from '@/user/enum/user-role.enum';
import { useFetch } from '@/hook/use-fetch';
import { GroupController } from '@/group/group.controller';
import { Cycle } from '@/group/entity/cycle.entity';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import SelectInput from '@/app/groups/components/select-input';
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/app-provider';
import { Training } from '@/training/entity/training.entity';
import Stack from '@mui/material/Stack';
import dayjs from 'dayjs';
import Typography from '@mui/material/Typography';
import AthleteTrainingExerciseCard from '@/training/components/athlete-training-exercise-card';
import { Box } from '@mui/material';
import { CommonService } from '@/common/service/common.service';

function Page() {
  const { token, components } = useAppContext();
  const [selected, setSelected] = useState<{
    cycle: Cycle | null,
    trainings: Training[],
  }>({ cycle: null, trainings: [] });

  const cycles = useFetch<Cycle[]>(
    GroupController.URL.cycles('groupIdIsNotRelevantHere'),
  );

  /**
   * Fetch trainings for selected cycle by current user
   */
  useEffect(() => {
    async function fetchTrainings() {
      if (!selected.cycle?.group?.id) return;

      try {
        const groupId = selected.cycle.group.id;
        const cycleId = selected.cycle.id;

        const trainings = await GroupController.findTrainings(token, groupId, cycleId, {
          from: dayjs().startOf('day').toDate(),
          to: dayjs().endOf('day').toDate(),
        });

        const populated = trainings.map(training => CommonService.instance.firebase.firestore.populateTraining(training, components.flat));
        setSelected(prev => ({ ...prev, trainings: populated }));
      } catch (e) {
        console.error('Error fetching trainings:', e);
      }
    }

    fetchTrainings().then();
  }, [selected.cycle?.id, token]);

  if (cycles.loading) return <div>Loading...</div>;
  if (cycles.error) return <div>Error: {cycles.error.message}</div>;

  return (
    <Stack spacing={5}>
      <SelectInput<Cycle>
        label="Cycle"
        icon={<RotateRightIcon />}
        value={selected.cycle?.id || ''}
        setValue={(value) => {
          const cycle =
            (cycles.data || []).find(cycle => cycle.id === value) || null;

          setSelected(prev => ({ ...prev, cycle }));
        }}
        items={cycles.data || []}
        itemKey="id"
        itemName="name"
      />

      {/* Training set groups with set exercises */}
      {selected.cycle?.group && <>
        {selected.trainings.map((training, i) => (
          <Box key={i}>
            <Typography variant="h6">
              {dayjs(training.from).format('DD/MM/YYYY')} - {dayjs(training.to).format('DD/MM/YYYY')}
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
    </Stack>
  );
}

export default withAuth(Page, [UserRole.ATHLETE]);