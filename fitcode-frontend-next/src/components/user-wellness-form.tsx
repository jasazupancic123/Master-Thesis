import { SetState } from '@/common/type/state.type';
import { useScreenSize } from '@/context/screen-size-provider';
import { UserMeta } from '@/controller/user/type/user-meta.type';
import { Chip, Slider } from '@mui/material';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { useState } from 'react';

interface Props {
  initialData: UserMeta | null;
  onSubmit: (data: Partial<UserMeta>) => void | Promise<void>;
  disabled: boolean;
  setDisabled: SetState<boolean>;
}

export default function UserWellnessForm(props: Props) {
  const screenSize = useScreenSize();
  const [state, setState] = useState<UserMeta>(() => {
    if (props.initialData) return props.initialData;

    return {
      sleep: 5,
      fatigue: 5,
      soreness: 5,
      comment: '',
      weight: 0,
    } as UserMeta;
  });

  const today = dayjs().format('dddd, MMMM D, YYYY');

  return (
    <Stack
      alignItems="center"
      pb={screenSize.isLandscapeMobile ? 10 : 12}
      sx={{
        maxHeight: screenSize.isMobile ? '90vh' : undefined,
        px: screenSize.isMobile ? 2 : 4,
        overflowY: 'auto', // Prevents content from being cut off on smaller screens
      }}
    >
      {/* Today's date */}
      <Chip
        label={today}
        sx={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1EB980', // Match theme
          backgroundColor: '#303E4A', // Subtle dark background
          borderRadius: '8px',
          padding: 2,
          marginBottom: screenSize.isLandscapeMobile ? 2 : 4,
          letterSpacing: '0.5px',
        }}
      />

      <Stack
        sx={{
          height: screenSize.isMobile
            ? 'calc(90vh - 200px)'
            : screenSize.isLandscapeMobile
              ? 200
              : 300, // Adjusts dynamically for mobile
          width: '100%',
          maxWidth: screenSize.isMobile ? '90%' : '60%',
          overflowY: 'auto', // Ensures scrollability if needed
          padding: screenSize.isLandscapeMobile ? 1 : 0,
          px: screenSize.isMobile ? 5 : undefined,
        }}
        spacing={4}
        direction="row"
        justifyContent="center"
      >
        {/* Sleep */}
        <UserWellnessSlider
          label="Sleep"
          value={state.sleep as number}
          setValue={(value) =>
            setState((prev: UserMeta) => ({ ...prev, sleep: value as number }))
          }
          disabled={props.disabled}
        />

        {/* Fatigue */}
        <UserWellnessSlider
          label="Fatigue"
          value={state.fatigue as number}
          setValue={(value) =>
            setState((prev) => ({ ...prev, fatigue: value as number }))
          }
          disabled={props.disabled}
        />

        {/* Soreness */}
        <UserWellnessSlider
          label="Soreness"
          value={state.soreness as number}
          setValue={(value) =>
            setState((prev) => ({ ...prev, soreness: value as number }))
          }
          disabled={props.disabled}
        />
      </Stack>

      {/* Comment */}
      <TextField
        label="Comment"
        variant="outlined"
        value={state.comment}
        onChange={(event) =>
          setState((prev) => ({ ...prev, comment: event.target.value }))
        }
        multiline
        rows={screenSize.isLandscapeMobile ? 1 : 2} // Reduce rows in landscape
        sx={{
          mt: screenSize.isLandscapeMobile ? 1 : 4,
          width: screenSize.isMobile
            ? '90%'
            : screenSize.isLandscapeMobile
              ? '66%'
              : '30%',
          backgroundColor: '#303E4A',
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

      {/* Submit button */}

      <Button
        variant="contained"
        onClick={() => {
          props.onSubmit(state);
          props.setDisabled(true);
        }}
        sx={{
          mt: screenSize.isLandscapeMobile ? 2 : 4,
          backgroundColor: '#1EB980',
          color: '#ffffff',
        }}
        disabled={props.disabled}
      >
        {!props.disabled ? 'Submit' : 'Already submited wellness for today'}
      </Button>
    </Stack>
  );
}

function UserWellnessSlider(props: {
  label: string;
  value: number;
  setValue: SetState<number>;
  disabled: boolean;
}) {
  return (
    <Stack spacing={1} alignItems="center">
      <Slider
        orientation="vertical"
        value={props.value}
        min={1}
        max={10}
        onChange={(_, value) => props.setValue(value as number)}
        valueLabelDisplay="auto"
        sx={{
          width: 10,
          '& .MuiSlider-track': {
            backgroundColor: '#303E4A',
          },
          '& .MuiSlider-thumb': {
            width: 26,
            height: 26,
            backgroundColor: props.disabled ? 'gray' : '#1EB980',
          },
          '& .MuiSlider-rail': {
            backgroundColor: '#ffffff',
          },
        }}
        disabled={props.disabled}
      />

      <Typography
        variant="body1"
        sx={{
          color: '#1EB980',
          textTransform: 'uppercase',
          fontFamily: 'Roboto Condensed',
          fontWeight: 'bold',
          textAlign: 'center',
          width: 80,
        }}
      >
        {props.label}
      </Typography>
    </Stack>
  );
}
