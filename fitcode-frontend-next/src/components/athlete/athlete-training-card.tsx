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

import AthleteTrainingCardHeader from './athlete-training-card-header';
import AthleteTrainingComponents from './athlete-training-components';
import useAthleteTrainingCardComponents from './hooks/use-components';
import useAthleteTrainingCardUtils from './hooks/use-utils';
import { core } from '@/core/core.service';
import type { Training } from '@/core/training/type/training.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';

interface Props {
  training: Training;
}

const TIMEOUT = 400; // ms

export default function AthleteTrainingCard({ training }: Props) {
  const theme = useTheme();
  const { user } = useAuthenticatedAuth();

  const { modal, setModal, showSupersets, setShowSupersets } =
    useAthleteTrainingCardUtils();
  const { selectedComponent, setSelectedComponent } =
    useAthleteTrainingCardComponents(training);

  const components = core.training.getComponents(training);
  const isActive = core.training.isActive(training);

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
          border: isActive ? `1px solid ${theme.palette.primary.main}` : 'none',
          position: isActive ? 'relative' : undefined,
        }}
        gap={1.5}
      >
        {isActive && (
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
            <Typography sx={{ fontSize: 12, fontWeight: 350 }}>
              Duration
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 'bold' }}>
              {core.training.getDurationText(training)}
            </Typography>
          </Box>

          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            textAlign="center"
          >
            <Typography sx={{ fontSize: 12, fontWeight: 350 }}>
              Exercises
            </Typography>

            <Typography sx={{ fontSize: 14, fontWeight: 'bold' }}>
              {
                core.training.getExercises(
                  core.training.getAthleteTraining(user.uid, training)
                ).length
              }
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
            sx={{ mx: 'auto', backgroundColor: theme.palette.background.dark }}
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

      <Divider sx={{ mx: 2 }} />
    </>
  );
}
