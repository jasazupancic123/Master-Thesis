import { Box, Typography } from '@mui/material';

import { theme } from '@/app/style';

interface Props {
  tempo?: string; // example: "2.5:0:3.5:0", meaning "eccentric:isometric:concentric:idle" in seconds
  tempoR?: string;
}

export default function TempoTimes(props: Props) {
  const { tempo, tempoR } = props;

  const tempos = [tempo, tempoR].filter((t) => t !== undefined) as string[];

  if (!tempos.length) return null;

  const uni = tempos.length === 2;

  const getTempoLabel = (index: number) => {
    if (index === 0) return 'Ecc';
    if (index === 1) return 'Iso';
    if (index === 2) return 'Con';
    if (index === 3) return 'Idle';
    return '';
  };

  return (
    <Box width="100%" display="flex" flexDirection="column" gap={0.5}>
      {tempos.map((t, index) => {
        const parts = t.split(':').map((p) => p.trim());

        return (
          <Box
            key={index}
            width="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={0.25}
          >
            <Box
              width="100%"
              display="flex"
              justifyContent="space-evenly"
              alignItems="center"
              sx={{
                position: 'relative',
                pl: uni ? 1 : 0,
              }}
            >
              {uni && (
                <Typography
                  fontSize={14}
                  fontWeight={600}
                  sx={{
                    position: 'absolute',
                    left: '4%',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  {index === 0 ? 'L' : 'R'}
                </Typography>
              )}
              {parts.map((part, partIndex) => {
                const label = getTempoLabel(partIndex);

                return (
                  <Box
                    key={partIndex}
                    width="25%"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    sx={{
                      backgroundColor:
                        partIndex % 2 === 0
                          ? undefined
                          : theme.palette.background.dark,
                    }}
                  >
                    <Typography fontSize={16} fontWeight={400}>
                      {label}
                    </Typography>
                    <Typography fontSize={16} fontWeight={600}>
                      {part}s
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
