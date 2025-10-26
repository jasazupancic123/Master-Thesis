import { Box, TextField } from '@mui/material';

import type { Wellness } from '@/core/profile/type/wellness.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useScreenSize } from '@/store/screen-size.provider';

interface Props {
  state: Wellness;
  setState: SetState<Wellness>;
}

export default function AthleteAnthropometryForm({ state, setState }: Props) {
  const screenSize = useScreenSize();

  return (
    <Box
      width="100%"
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
    >
      <Box
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={5}
        sx={{
          flexDirection: screenSize.isSmallerThanLaptop ? 'column' : 'row',
        }}
      >
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
        />
      </Box>
    </Box>
  );
}
