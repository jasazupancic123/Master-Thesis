'use client';

import { Button, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { WellnessAnthropometry } from '@/common/enum/wellnes-anthropometry.enum';
import { handleApiRequest } from '@/common/type/state.type';
import AthleteAnthropometryForm from '@/components/athlete-anthropometry-form/athlete-anthropometry-form';
import AthleteOptionsContainer from '@/components/athlete-options-container/athlete-options-container';
import AthleteWellnessForm from '@/components/athlete-wellness-form/athlete-wellness-form';
import { paintHeatmaps } from '@/components/muscle-heatmap-view/state';
import type { Wellness } from '@/controller/user/type/wellness.type';
import { UserController } from '@/controller/user/user.controller';
import { setCachedWellness } from '@/session-cache/wellness.session-cache';
import { useScreenSize } from '@/store/screen-size.provider';
import { useWellness } from '@/store/wellness-provider';

export type SubmitWellnessInput = Parameters<typeof UserController.saveMeta>[0];

export async function submitWellness(
  input: SubmitWellnessInput,
  state: {
    router: AppRouterInstance;
    setCachedWellness: (wellness: Wellness) => void;
  }
) {
  const { router, setCachedWellness } = state;

  handleApiRequest(
    router,
    () => UserController.saveMeta(input),
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
  const screenSize = useScreenSize();

  const [filter, setFilter] = useState<WellnessAnthropometry>(
    WellnessAnthropometry.WELLNESS
  );
  const [muscleLoads, setMuscleLoads] = useState<[string, number][]>([]);

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
    if (filter !== WellnessAnthropometry.ANTHROPOMETRY) return;
    paintHeatmaps(muscleLoads, true);
  }, [muscleLoads, filter]);

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        height: 'calc(100vh - 100px)',
        overflowY: 'auto',
        pb: 6,
        backgroundColor: 'background.default',
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
          />
        ) : (
          <AthleteAnthropometryForm
            muscleLoads={muscleLoads}
            setMuscleLoads={setMuscleLoads}
          />
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
          mt: screenSize.isLandscapeMobile ? 2 : 4,
          backgroundColor: theme.palette.primary.main,
          color: '#ffffff',
        }}
      >
        Submit
      </Button>
    </Box>
  );
}
