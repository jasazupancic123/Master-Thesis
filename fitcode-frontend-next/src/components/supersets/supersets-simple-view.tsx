import { Box, Chip, Grid, Typography } from '@mui/material';

import type { Superset } from '@/core/training/type/superset.type';
import { useMain } from '@/store/main.provider';

type Props = {
  supersets: Superset[];
};

export default function SupersetsSimpleView({ supersets }: Props) {
  const { exercises } = useMain();

  return (
    <Grid container>
      {supersets.map((s, i) => (
        <Grid key={i} spacing={1}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              p: 1,
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 2,
              position: 'relative',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                position: 'absolute',
                top: -10,
                left: 5,
              }}
            >
              {s.warmup && <Chip label="Warmup" color="info" size="small" />}
              {s.cooldown && (
                <Chip label="Cooldown" color="secondary" size="small" />
              )}

              {!s.warmup && !s.cooldown && (
                <Chip
                  label={`Superset ${i + 1}`}
                  size="small"
                  color={'primary'}
                />
              )}
            </Box>

            <Box display="flex" flexDirection="column">
              {s.exercises.map((ex) => {
                const exercise = exercises.find((e) => e.id === ex.id);
                if (!exercise) return null;

                return (
                  <Box
                    key={exercise.id}
                    sx={{
                      borderRadius: 1,
                      p: 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                      mt: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 500, fontSize: 12 }}
                    >
                      {exercise.name.slice(0, 15)}{' '}
                      {exercise.name.length > 15 ? '...' : ''}
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                      }}
                    >
                      {ex.sets.map((set, idx) => (
                        <Chip
                          key={idx}
                          label={`${set.reps || 0} x ${set.loadKg || 0} kg`}
                          size="small"
                          sx={{ borderRadius: 2, px: 1 }}
                        />
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
