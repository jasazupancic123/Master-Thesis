import { Box, Divider } from '@mui/material';

import useTip from './hooks/use-tip';
import UserWellnessSlider from './user-wellness-slider';
import FatigueIcon from '@/assets/icons/Fatigue.svg';
import SleepIcon from '@/assets/icons/Sleep.svg';
import SorenessIcon from '@/assets/icons/Soreness.svg';
import HeatmapBack from '@/assets/svg/heatmap-back.svg';
import HeatmapFront from '@/assets/svg/heatmap-front.svg';
import MuscleMapWithTooltip from '@/components/muscle-map-with-tooltip/muscle-map-with-tooltip';
import { HEATMAP_COLORS } from '@/core/const/color.const';
import type { Wellness } from '@/core/profile/type/wellness.type';
import type { SetState } from '@/lib/common/type/state.type';
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

  const {
    tipHeatmapFront,
    setTipHeatmapFront,
    tipHeatmapBack,
    setTipHeatmapBack,
  } = useTip();

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
