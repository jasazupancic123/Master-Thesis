import { UserWellness } from '@/type/user-wellness.type';
import { SetState } from '@/type/react-state.type';
import { Slider } from '@mui/material';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

interface Props {
  onSubmit: (data: Partial<UserWellness>) => void | Promise<void>;
  disabled: boolean;
}

export default function UserWellnessForm(props: Props) {
  const [state, setState] = useState({
    sleep: 5,
    fatigue: 5,
    soreness: 5,
    comment: '',
  });

  return <Stack alignItems="center">
    <Stack sx={{ height: 300 }} spacing={4} direction="row">
      {/* Sleep */}
      <UserWellnessSlider
        label="Sleep"
        value={state.sleep}
        setValue={(value) => setState(prev => ({ ...prev, sleep: value as number }))}
        disabled={props.disabled}
      />

      {/* Fatigue */}
      <UserWellnessSlider
        label="Fatigue"
        value={state.fatigue}
        setValue={(value) => setState(prev => ({ ...prev, fatigue: value as number }))}
        disabled={props.disabled}
      />

      {/* Soreness */}
      <UserWellnessSlider
        label="Soreness"
        value={state.soreness}
        setValue={(value) => setState(prev => ({ ...prev, soreness: value as number }))}
        disabled={props.disabled}
      />
    </Stack>

    {/* Comment */}
    <TextField
      label="Comment"
      variant="outlined"
      value={state.comment}
      onChange={(event) => setState(prev => ({ ...prev, comment: event.target.value }))}
      multiline
      rows={2}
      sx={{ marginTop: 4, width: '50%', backgroundColor: '#303E4A', borderRadius: '10px' }}
      disabled={props.disabled}
    />

    {/* Submit button*/}
    <Button
      variant="contained"
      onClick={() => props.onSubmit(state)}
      sx={{ mt: 4, backgroundColor: '#1EB980', color: '#ffffff' }}
      disabled={props.disabled}
    >
      Submit
    </Button>
  </Stack>;
}

function UserWellnessSlider(props: {
  label: string;
  value: number;
  setValue: SetState<number>;
  disabled: boolean;
}) {
  return <Stack spacing={1} alignItems="center">
    <Slider
      orientation="vertical"
      value={props.value}
      min={1}
      max={10}
      onChange={(_, value) => props.setValue(value as number)}
      valueLabelDisplay="auto"
      sx={{
        width: 12,
        '& .MuiSlider-track': {
          backgroundColor: '#303E4A',
        },
        '& .MuiSlider-thumb': {
          width: 40,
          height: 40,
          backgroundColor: props.disabled ? 'gray' : '#1EB980',
        },
        '& .MuiSlider-rail': {
          backgroundColor: '#ffffff', // Non-selected part of the slider
        },
      }}
      disabled={props.disabled}
    />

    <Typography variant="body1" sx={{
      color: '#1EB980',
      textTransform: 'uppercase',
      fontFamily: 'Roboto Condensed',
      fontWeight: 'bold',
      textAlign: 'center',
      width: 80,
    }}>
      {props.label}
    </Typography>
  </Stack>;
}