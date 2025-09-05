import { Box, Divider, Slider } from '@mui/material';
import { useTheme } from '@mui/material';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { SetState } from '@/common/type/state.type';
import type { Wellness } from '@/controller/user/type/wellness.type';
import { useScreenSize } from '@/store/screen-size-provider';
import FatigueIcon from '@/assets/icons/Fatigue.svg';
import SleepIcon from '@/assets/icons/Sleep.svg';
import SorenessIcon from '@/assets/icons/Soreness.svg';

interface Props {
  onSubmit: (_data: Partial<Wellness>) => void | Promise<void>;
  disabled: boolean;
  setDisabled: SetState<boolean>;
  state: Wellness;
  setState: SetState<Wellness>;
}

export default function AthleteWellnessForm(props: Props) {
  const screenSize = useScreenSize();

  const { state, setState } = props;

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

      {/* Comment */}
      <TextField
        label="Comment"
        variant="outlined"
        value={state.comment}
        onChange={(event) =>
          setState((prev) => ({ ...prev, comment: event.target.value }))
        }
        multiline
        rows={1.5}
        sx={{
          width: screenSize.isMobile
            ? '90%'
            : screenSize.isLandscapeMobile
              ? '66%'
              : '30%',
          backgroundColor: 'background.default',
          borderRadius: '10px',
          '& .MuiOutlinedInput-root': {
            height: screenSize.isLandscapeMobile ? '20vh' : 'auto', // Set full field height
            display: 'flex', // Align text properly
            alignItems: 'center', // Ensures vertical centering
            '& textarea': {
              height: screenSize.isLandscapeMobile ? '12vh' : 'auto', // Resize inner text area
              paddingTop: screenSize.isLandscapeMobile ? '5px' : undefined, // Adjust text alignment
              paddingBottom: screenSize.isLandscapeMobile ? '5px' : undefined,
              overflow: 'hidden', // Prevent extra growth
            },
          },
          '& .MuiInputLabel-root': {
            top: screenSize.isLandscapeMobile ? '-5px' : undefined, // Adjust label position
          },
        }}
        inputProps={{
          style: {
            padding: screenSize.isLandscapeMobile ? '5px 10px' : undefined, // Ensure consistent padding
            height: screenSize.isLandscapeMobile ? '12vh' : 'auto',
            display: 'flex',
            alignItems: 'center', // Ensures text aligns correctly
          },
        }}
        disabled={props.disabled}
      />

      {/* Weight in kg */}
      <TextField
        label="Weight (kg)"
        type="number"
        value={state.weight}
        onChange={(event) => {
          if (isNaN(Number(event.target.value))) return;

          setState((prev) => ({
            ...prev,
            weight: Number(event.target.value),
          }));
        }}
        sx={{
          mt: 2,
          backgroundColor: 'background.default',
          borderRadius: '10px',
        }}
        inputProps={{
          min: 0,
          step: 0.5,
          style: {
            padding: '5px 10px',
            display: 'flex',
            alignItems: 'center',
          },
        }}
        disabled={props.disabled}
      />
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
  const theme = useTheme();
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
      <Slider
        orientation="horizontal"
        value={props.value}
        min={1}
        max={10}
        onChange={(_, value) => props.setValue(value as number)}
        valueLabelDisplay="on"
        sx={{
          '& .MuiSlider-track': {
            backgroundColor: theme.palette.primary.main,
            border: 'none',
          },
          '& .MuiSlider-thumb': {
            width: 14,
            height: 14,
            backgroundColor: props.disabled
              ? 'gray'
              : theme.palette.primary.main,
          },
          '& .MuiSlider-rail': {
            backgroundColor: '#ffffff',
          },
          '& .MuiSlider-valueLabelOpen': {
            backgroundColor: 'transparent',
            top: 2,
            fontSize: 12,
          },
          '& .MuiSlider-valueLabelOpen:before': {
            display: 'none',
          },
        }}
        disabled={props.disabled}
      />
    </Box>
  );
}
