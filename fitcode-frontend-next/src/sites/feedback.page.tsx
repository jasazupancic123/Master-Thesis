'use client';

import { Button, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import AthleteOptionsContainer from '@/components/athlete/athlete-options-container';
import AthleteWellnessForm from '@/components/athlete/athlete-wellness-form';
import AthleteAnthropometryForm from '@/components/athlete-anthropometry-form/athlete-anthropometry-form';
import { paintHeatmaps } from '@/components/training-component/actions/actions-color-heatmap';
import { app } from '@/core/app.service';
import { WellnessAnthropometry } from '@/core/profile/enum/wellness-anthropometry.enum';
import { ProfileController } from '@/core/profile/profile.controller';
import type {
  CreateWellness,
  Wellness,
} from '@/core/profile/type/wellness.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { setCachedWellness } from '@/session-cache/wellness.session-cache';
import { useWellness } from '@/store/wellness-provider';

export async function submitWellness(
  input: CreateWellness,
  state: {
    router: AppRouterInstance;
    setCachedWellness: (wellness: Wellness) => void;
  }
) {
  const { router, setCachedWellness } = state;

  handleApiRequest(
    router,
    () => ProfileController.getInstance().upsertWellness(input),
    (_wellness) => {
      setCachedWellness(_wellness);
      toast.success('Successfully submitted wellness');
    },
    undefined,
    'Could not submit wellness'
  );
}

export default function FeedbackPage() {
  const theme = useTheme();
  const router = useRouter();

  const [filter, setFilter] = useState<WellnessAnthropometry>(
    WellnessAnthropometry.WELLNESS
  );
  const [muscleLoads, setMuscleLoads] = useState<[string, number][]>([]);

  useEffect(() => {
    if (muscleLoads.length) return; // Already set
    const loads = app.exercise.muscle.generateEmptyLoads(1);
    setMuscleLoads(loads);
  }, []);

  const { wellness } = useWellness();

  const [state, setState] = useState<Wellness>(() => {
    if (wellness) return wellness;

    return {
      sleep: 5,
      fatigue: 5,
      soreness: 5,
      comment: '',
      weight: 0,
    } as Wellness;
  });

  useEffect(() => {
    paintHeatmaps(muscleLoads, true);
  }, [muscleLoads, filter]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        overflowY: 'auto',
        backgroundColor: 'transparent',
        pb: filter === WellnessAnthropometry.WELLNESS ? 15 : 0,
      }}
    >
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{
          overflowY: 'auto',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <AthleteOptionsContainer
          items={[
            WellnessAnthropometry.WELLNESS,
            WellnessAnthropometry.ANTHROPOMETRY,
          ]}
          selectedItem={filter}
          onClick={(type) => {
            setFilter(type as WellnessAnthropometry);
          }}
          title="Feedback"
        />

        {filter === WellnessAnthropometry.WELLNESS ? (
          <AthleteWellnessForm
            onSubmit={(data) =>
              submitWellness(
                { date: new Date(), ...data },
                { router, setCachedWellness }
              )
            }
            disabled={false}
            setDisabled={() => {}}
            state={state}
            setState={setState}
            muscleLoads={muscleLoads}
            setMuscleLoads={setMuscleLoads}
          />
        ) : (
          <AthleteAnthropometryForm state={state} setState={setState} />
        )}
      </Box>

      {/* Submit button */}
      <Button
        variant="contained"
        onClick={() => {
          submitWellness(
            { ...state, date: new Date() },
            { router, setCachedWellness }
          );
        }}
        sx={{
          position: 'fixed',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        Submit
      </Button>
    </Box>
  );
}
