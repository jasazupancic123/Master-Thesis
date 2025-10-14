import {
  ArrowDropDown,
  ArrowDropUp,
  ArrowForwardRounded,
} from '@mui/icons-material';
import { Box, Divider, IconButton } from '@mui/material';
import { useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import React from 'react';

import {
  checkIsActiveTraining,
  getDurationText,
  getNumExercises,
} from './actions/actions-utils';
import AthleteTrainingCardHeader from './components/athlete-training-card-header';
import AthleteTrainingComponents from './components/athlete-training-components';
import useAthleteTrainingCardComponents from './hooks/use-components';
import useAthleteTrainingCardUtils from './hooks/use-utils';
import type { Training } from '@/controller/training/type/training.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';

export type AthleteTrainingCardProps = {
  training: Training;
};

const TIMEOUT = 400; // ms

export default function AthleteTrainingCard(props: AthleteTrainingCardProps) {
  const { user } = useAuthenticatedAuth();

  const theme = useTheme();

  const { training } = props;

  const { modal, setModal, showSupersets, setShowSupersets } =
    useAthleteTrainingCardUtils();

  const { components, selectedComponent, setSelectedComponent } =
    useAthleteTrainingCardComponents(props);

  const isActiveTraining = checkIsActiveTraining(training);

  return (
    <>
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        sx={{
          px: 2,
          py: 2,
          backgroundColor: theme.palette.background.default,
          border: isActiveTraining
            ? `1px solid ${theme.palette.primary.main}`
            : 'none',
          position: isActiveTraining ? 'relative' : undefined,
        }}
        gap={1.5}
      >
        {isActiveTraining && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: theme.palette.primary.main,
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
              px: 2,
              zIndex: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: theme.palette.background.light,
              }}
            >
              Active
            </Typography>
          </Box>
        )}

        {/* Group name, cycle name, date */}
        <AthleteTrainingCardHeader
          components={training.components || []}
          group={training.group}
          cycle={training.cycle}
          from={training.from}
          to={training.to}
        />

        {/* Training data info */}
        <Box
          width="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          gap={2}
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            textAlign="center"
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 350,
              }}
            >
              Duration
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 'bold',
              }}
            >
              {getDurationText(training)}
            </Typography>
          </Box>

          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            textAlign="center"
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 350,
              }}
            >
              Exercises
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 'bold',
              }}
            >
              {getNumExercises(user.uid, components)}
            </Typography>
          </Box>
        </Box>

        {/* Training components */}
        <AthleteTrainingComponents
          training={training}
          components={components}
          selectedComponent={selectedComponent}
          setSelectedComponent={setSelectedComponent}
          showSupersets={showSupersets}
          setShowSupersets={setShowSupersets}
          modal={modal}
          setModal={setModal}
          timeout={TIMEOUT}
        />

        {/* Expanded/Collapsed */}
        <Box width="100%" sx={{ position: 'relative' }}>
          <Box
            width="40px"
            height="20px"
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              mx: 'auto',
              backgroundColor: theme.palette.background.dark,
            }}
          >
            <IconButton
              sx={{ p: 0, m: 0 }}
              onClick={() => {
                if (!selectedComponent && components.length) {
                  setShowSupersets(true);
                  setSelectedComponent(components[0]);
                } else {
                  setShowSupersets(false);
                  setTimeout(() => {
                    setSelectedComponent(null);
                  }, TIMEOUT);
                }
              }}
            >
              {!showSupersets ? <ArrowDropDown /> : <ArrowDropUp />}
            </IconButton>
          </Box>
          {selectedComponent &&
            showSupersets &&
            user &&
            dayjs(training.from).isSame(new Date(), 'day') && (
              <IconButton
                sx={{
                  p: 0.5,
                  m: 0,
                  position: 'absolute',
                  right: 0,
                  bottom: -6,
                  backgroundColor: theme.palette.primary.main,
                  zIndex: 10000,
                }}
                onClick={() => {
                  setModal(true);
                }}
              >
                <ArrowForwardRounded
                  fontSize="small"
                  sx={{ color: theme.palette.text.secondary }}
                />
              </IconButton>
            )}
        </Box>
      </Box>
      <Divider
        sx={{
          mx: 2,
        }}
      />
    </>
  );
}
