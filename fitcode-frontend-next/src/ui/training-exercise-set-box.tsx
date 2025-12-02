import { Check } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';

import { theme } from '@/app/style';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { SetState } from '@/lib/common/type/state.type';

interface Props {
  selectedExercise: TrainingExercise;
  setSetIndex: SetState<number | undefined>;
  setIndex: number;
  isSetSelected: boolean;
  isSetDone: boolean;
}

export default function TrainingExerciseSetBox(props: Props) {
  const { selectedExercise, setSetIndex, setIndex, isSetSelected, isSetDone } =
    props;

  return (
    <Box
      key={setIndex}
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="center"
      gap={0.5}
    >
      <Box
        maxWidth="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{
          overflowX: 'auto',
          mx: 'auto',
          border: `1px solid ${theme.palette.primary.main}`,
          borderLeft: setIndex === 0 ? undefined : 'none',
          borderRight:
            setIndex === selectedExercise.sets.length - 1 ? undefined : 'none',
          borderTopLeftRadius: setIndex === 0 ? '4px' : 0,
          borderBottomLeftRadius: setIndex === 0 ? '4px' : 0,
          borderTopRightRadius:
            setIndex === selectedExercise.sets.length - 1 ? '4px' : 0,
          borderBottomRightRadius:
            setIndex === selectedExercise.sets.length - 1 ? '4px' : 0,
          py: 0.3,
          pr: setIndex === selectedExercise.sets.length - 1 ? 0.25 : 0,
          pl: setIndex === 0 ? 0.25 : 0,
        }}
      >
        <Typography
          fontSize={13}
          textAlign="center"
          fontWeight="bold"
          sx={{
            position: 'relative',
            px: 2.5,
            py: 0.25,
            lineHeight: 1,
            cursor: 'pointer',
            color: isSetSelected ? theme.palette.text.secondary : undefined,
            backgroundColor: isSetSelected
              ? theme.palette.primary.main
              : undefined,
            borderTopLeftRadius: setIndex === 0 ? '2px' : 0,
            borderBottomLeftRadius: setIndex === 0 ? '2px' : 0,
            borderTopRightRadius:
              setIndex === selectedExercise.sets.length - 1 ? '2px' : 0,
            borderBottomRightRadius:
              setIndex === selectedExercise.sets.length - 1 ? '2px' : 0,
            textTransform: 'uppercase',
          }}
          onClick={() => {
            setSetIndex(setIndex);
          }}
        >
          Set {setIndex + 1}
        </Typography>
      </Box>

      {isSetDone ? (
        <Check
          sx={{
            width: 16,
            height: 16,
            color: theme.palette.text.primary,
          }}
        />
      ) : (
        <Box
          component="img"
          src="/blinking_dot.gif"
          alt="active set"
          sx={{
            width: 16,
            height: 16,
            display: 'inline-block',
            verticalAlign: 'middle',
            visibility: isSetSelected ? 'visible' : 'hidden',
          }}
        />
      )}
    </Box>
  );
}
