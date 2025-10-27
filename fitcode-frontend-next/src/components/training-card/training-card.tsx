import { Box, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useEffect } from 'react';

import TrainingComponentLayout from '../training-component/training-component-layout';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

export default function TrainingCard() {
  const { cycle } = useGroup();

  const {
    training,
    setTraining,
    selectedSubgroup,
    setSelectedSubgroup,
    component,
    setComponent,
    selectedAthlete,
  } = useTrainerDayView();

  const theme = useTheme();

  const screenSize = useScreenSize();

  useEffect(() => {
    if (!component || !selectedSubgroup || !selectedSubgroup) return;
    // check if subgroup is still inside the component.subgroups, cuz the selected one might get deleted
    if (
      selectedSubgroup &&
      component.subgroups.findIndex(
        (subgroup) => subgroup.id === selectedSubgroup.id
      ) === -1
    ) {
      setSelectedSubgroup(null);
    }
  }, [component]);

  if (!training) return null;

  return (
    <Box width="100%">
      <Box display="flex" width="100%">
        <Box display="flex" width="100%" position="relative">
          {cycle && component ? (
            <Box
              sx={{
                height: 22,
                maxHeight: 22,
                minWidth: 170,
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center',
                backgroundColor: theme.palette.primary.main,
                borderBottomLeftRadius: 100,
                borderBottomRightRadius: 100,
                px:
                  !selectedAthlete && selectedSubgroup
                    ? 0
                    : screenSize.isMobile
                      ? 2
                      : 4,
              }}
            >
              {selectedAthlete ? (
                <Typography
                  textAlign="center"
                  fontSize={12}
                  fontWeight="bold"
                  sx={{
                    pb: 0.5,
                    color: theme.palette.text.secondary,
                    textTransform: 'uppercase',
                  }}
                >
                  {selectedAthlete.displayName}
                </Typography>
              ) : selectedSubgroup ? (
                <TextField
                  value={selectedSubgroup.name}
                  variant="standard"
                  size="small"
                  fullWidth
                  sx={{
                    textAlign: 'center',
                    width: '100%',
                    p: 0,
                    m: 0,
                    '& .MuiInput-underline:before': {
                      color: 'transparent !important',
                      border: 'none !important',
                    },
                    '& .MuiInput-underline:after': {
                      border: 'none',
                    },
                    '& .MuiInput-underline:hover:before': {
                      border: 'none',
                    },
                    ':hover': {
                      border: 'none',
                    },
                  }}
                  inputProps={{
                    style: {
                      color: theme.palette.text.secondary,
                      fontSize: 12,
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      border: 'none',
                      textAlign: 'center',
                      paddingTop: 0,
                      paddingBottom: 0,
                    },
                  }}
                  onChange={(e) => {
                    setSelectedSubgroup((prev) => {
                      if (!prev) return null;
                      const updatedSubgroup = {
                        ...prev,
                        name: e.target.value,
                      };
                      const updatedComponent = {
                        ...component,
                        subgroups: component.subgroups.map((sg) =>
                          sg.id === prev.id ? updatedSubgroup : sg
                        ),
                      };
                      setComponent(updatedComponent);
                      setTraining((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          components: prev.components.map((c) =>
                            c.id === component.id ? updatedComponent : c
                          ),
                        };
                      });

                      return updatedSubgroup;
                    });
                  }}
                />
              ) : (
                <Typography
                  textAlign="center"
                  fontSize={12}
                  fontWeight="bold"
                  sx={{
                    pb: 0.5,
                    color: theme.palette.text.secondary,
                    textTransform: 'uppercase',
                  }}
                >
                  Main group
                </Typography>
              )}
            </Box>
          ) : selectedAthlete ? (
            <Box
              sx={{
                height: 22,
                maxHeight: 22,
                minWidth: 150,
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center',
                backgroundColor: theme.palette.primary.main,
                borderBottomLeftRadius: 100,
                borderBottomRightRadius: 100,
                px: screenSize.isMobile ? 2 : 4,
              }}
            >
              <Typography
                textAlign="center"
                fontSize={12}
                fontWeight="bold"
                sx={{
                  pb: 0.5,
                  color: theme.palette.text.secondary,
                  textTransform: 'uppercase',
                }}
              >
                {selectedAthlete.displayName}
              </Typography>
            </Box>
          ) : null}
        </Box>
      </Box>

      <Box
        sx={{
          border: '1px solidrgb(36, 38, 46)',
          borderRadius: 2,
          borderTopLeftRadius: 0,
          backgroundColor: theme.palette.background.default,
          px: 1,
        }}
      >
        {training && (
          <Box display="flex" flexDirection="column" gap={1} mt={1}>
            <TrainingComponentLayout
              key={0}
              trainingComponent={training.warmup}
            />

            {training.components.map((trainingComponent, i) => (
              <TrainingComponentLayout
                key={i + 1}
                trainingComponent={trainingComponent}
              />
            ))}

            <TrainingComponentLayout
              key={training.components.length + 1}
              trainingComponent={training.cooldown}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
