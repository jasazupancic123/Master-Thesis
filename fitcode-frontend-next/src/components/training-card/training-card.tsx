import { Box, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useEffect } from 'react';

import type { TrainingCardProps } from '../trainer-day-view/props';
import TrainingComponentLayout from '../training-component-layout/training-component-layout';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

export default function TrainingCard(props: TrainingCardProps) {
  const { cycle } = useGroup();

  const {
    training,
    setTraining,
    selectedPeriod,
    selectedSubgroup,
    setSelectedSubgroup,
    component,
    setComponent,
    selectedAthlete,
  } = useTrainerDayViewContext();

  const theme = useTheme();

  const { day } = props;

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
          <Typography
            variant="caption"
            sx={{
              mx: 1,
              fontSize: 10,
              color: theme.palette.background.lightText,
              position: 'absolute',
              top: -1,
              left: 0,
            }}
          >
            {selectedPeriod?.value === 'AM' ? 'Morning' : 'Afternoon'}
          </Typography>

          {cycle && component ? (
            <Box
              sx={{
                height: 22,
                maxHeight: 22,
                minWidth: 150,
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center',
                backgroundColor: theme.palette.background.dark,
                borderBottomLeftRadius: 100,
                borderBottomRightRadius: 100,
                px: screenSize.isMobile ? 2 : 4,
              }}
            >
              {selectedAthlete ? (
                <Typography
                  textAlign="center"
                  variant="body2"
                  fontSize={12}
                  sx={{ pb: 0.5, color: theme.palette.background.lightText }}
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
                    color: theme.palette.text.primary,
                    fontSize: 12,
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
                      border: 'none',
                      textAlign: 'center',
                      fontSize: 12,
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
                  variant="body2"
                  fontSize={12}
                  sx={{ pb: 0.5, color: theme.palette.background.lightText }}
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
                backgroundColor: theme.palette.background.dark,
                borderBottomLeftRadius: 100,
                borderBottomRightRadius: 100,
                px: screenSize.isMobile ? 2 : 4,
              }}
            >
              <Typography
                textAlign="center"
                variant="body2"
                fontSize={12}
                sx={{ pb: 0.5, color: theme.palette.background.lightText }}
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
          <>
            <TrainingComponentLayout
              key={0}
              trainingComponent={training.warmup}
              day={day}
            />
            {training.components.map((trainingComponent, i) => (
              <TrainingComponentLayout
                key={i + 1}
                trainingComponent={trainingComponent}
                day={day}
              />
            ))}
            <TrainingComponentLayout
              key={training.components.length + 1}
              trainingComponent={training.cooldown}
              day={day}
            />
          </>
        )}
      </Box>
    </Box>
  );
}
