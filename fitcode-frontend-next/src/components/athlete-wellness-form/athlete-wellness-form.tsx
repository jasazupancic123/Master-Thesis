import { Box, Divider } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';

import AthleteWellnessSlider from '../athlete-wellness-slider/athlete-wellness-slider';
import MuscleMapWithTooltip from '../muscle-map-with-tooltip/muscle-map-with-tooltip';
import FatigueIcon from '@/assets/icons/Fatigue.svg';
import SleepIcon from '@/assets/icons/Sleep.svg';
import SorenessIcon from '@/assets/icons/Soreness.svg';
import HeatmapBack from '@/assets/svg/heatmap-back.svg';
import HeatmapFront from '@/assets/svg/heatmap-front.svg';
import { HEATMAP_COLORS } from '@/common/constant/color.constant';
import type { SetState } from '@/common/type/state.type';
import { MuscleService } from '@/controller/exercise/muscle.service';
import type { MuscleTip } from '@/controller/exercise/type/muscle-tip.type';
import type { Wellness } from '@/controller/user/type/wellness.type';
import { useScreenSize } from '@/store/screen-size.provider';

interface Props {
  onSubmit: (_data: Partial<Wellness>) => void | Promise<void>;
  disabled: boolean;
  setDisabled: SetState<boolean>;
  state: Wellness;
  setState: SetState<Wellness>;
  muscleLoads: [string, number][];
  setMuscleLoads: SetState<[string, number][]>;
}

export default function AthleteWellnessForm(props: Props) {
  const screenSize = useScreenSize();

  const { state, setState, muscleLoads, setMuscleLoads } = props;

  const [tipHeatmapFront, setTipHeatmapFront] = useState<MuscleTip>({
    show: false,
    x: 0,
    y: 0,
    focus: false,
  });

  const [tipHeatmapBack, setTipHeatmapBack] = useState<MuscleTip>({
    show: false,
    x: 0,
    y: 0,
    focus: false,
  });

  useEffect(() => {
    if (muscleLoads.length) return; // Already set

    const loads = MuscleService.generateEmptyMuscleLoadsForAllMuscles(1);
    setMuscleLoads(loads);
  }, []);

  return (
    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
      {/* Sleep */}
      <UserWellnessSlider
        label="Sleep"
        value={state.sleep as number}
        setValue={(value) =>
          setState((prev: Wellness) => ({ ...prev, sleep: value as number }))
        }
        disabled={props.disabled}
        icon={<SleepIcon height={16} />}
      />

      <Divider />

      {/* Fatigue */}
      <UserWellnessSlider
        label="Fatigue"
        value={state.fatigue as number}
        setValue={(value) =>
          setState((prev) => ({ ...prev, fatigue: value as number }))
        }
        disabled={props.disabled}
        icon={<FatigueIcon height={16} />}
      />

      <Divider />

      {/* Soreness */}
      <UserWellnessSlider
        label="Soreness"
        value={state.soreness as number}
        setValue={(value) =>
          setState((prev) => ({ ...prev, soreness: value as number }))
        }
        disabled={props.disabled}
        icon={<SorenessIcon height={16} />}
      />

      <Box
        sx={
          screenSize.isSmallerThanLaptop
            ? {
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                flexWrap: 'nowrap',
              }
            : {}
        }
        position="relative"
      >
        <MuscleMapWithTooltip
          front={true}
          Svg={HeatmapFront}
          exercisesInComponent={[]}
          heatmapLevel={1}
          tip={tipHeatmapFront}
          setTip={setTipHeatmapFront}
          athleteAnthropometry
          muscleLoads={muscleLoads}
          setMuscleLoads={setMuscleLoads}
        />
        <MuscleMapWithTooltip
          front={false}
          Svg={HeatmapBack}
          exercisesInComponent={[]}
          heatmapLevel={1}
          tip={tipHeatmapBack}
          setTip={setTipHeatmapBack}
          athleteAnthropometry
          muscleLoads={muscleLoads}
          setMuscleLoads={setMuscleLoads}
        />

        {/* Legend */}
        <Box
          display="flex"
          flexDirection="column-reverse"
          sx={{
            position: 'absolute',
            bottom: 20,
            right: screenSize.isSmallerThanLaptop ? '50%' : -50,
            transform: screenSize.isSmallerThanLaptop
              ? 'translateX(+50%)'
              : 'none',
          }}
          gap={1}
        >
          {HEATMAP_COLORS.map((color, index) => (
            <Box
              key={index}
              bgcolor={color}
              width={screenSize.isMobile ? 40 : 100}
              height={screenSize.isMobile ? 3 : 5}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function UserWellnessSlider(props: {
  label: string;
  value: number;
  setValue: SetState<number>;
  disabled: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Box
      width="100%"
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{
        p: 4,
        position: 'relative',
      }}
    >
      <Typography
        fontSize={12}
        sx={{
          position: 'absolute',
          left: 32,
          top: 10,
          display: 'flex',
          alignItems: 'center',
        }}
        gap={0.5}
      >
        {props.icon}
        {props.label}
      </Typography>
      <AthleteWellnessSlider
        value={props.value}
        setValue={props.setValue}
        disabled={props.disabled}
      />
    </Box>
  );
}
