import { useScreenSize } from '@/store/screen-size-provider';
import { useTraining } from '@/store/training-provider';
import {
  Superset,
  TrainingComponent,
} from '@/controller/training/type/training-plan.type';
import { Avatar, Box, Divider, IconButton } from '@mui/material';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';
import { Training } from '@/controller/training/type/training.type';
import AthleteTrainingComponents from '../athlete-training-components/athlete-training-components';
import { useMain } from '@/store/main-provider';
import { useTheme } from '@mui/material';
import {
  ArrowDropDown,
  ArrowDropUp,
  ArrowForwardRounded,
  MoreVert,
} from '@mui/icons-material';

type AthleteTrainingCardProps = {
  training: Training;
};

const TIMEOUT = 400; // ms

export default function AthleteTrainingCard(props: AthleteTrainingCardProps) {
  const { profile } = useMain();

  const theme = useTheme();
  const screenSize = useScreenSize();

  const [modal, setModal] = useState(false);

  const { training } = props;

  const { trainingInProgress } = useTraining();

  const [supersets, setSupersets] = useState<Superset[]>();
  const [selectedComponent, setSelectedComponent] =
    useState<TrainingComponent | null>(null);
  const [components, setComponents] = useState<TrainingComponent[]>([
    training.warmup,
    ...training.components,
    training.cooldown,
  ]);
  const [showSupersets, setShowSupersets] = useState(false);

  useEffect(() => {
    if (!trainingInProgress || !trainingInProgress.selectedComponent) return;
    let usersSupersets = undefined;
    for (const subgroup of trainingInProgress.selectedComponent.subgroups) {
      if (subgroup.membersIds.includes(profile.uid)) {
        usersSupersets = subgroup.supersets;
        break;
      }
    }
    if (!usersSupersets) {
      usersSupersets = trainingInProgress.selectedComponent.supersets; //default group
    }
    setSupersets(usersSupersets);
  }, [trainingInProgress?.selectedComponent]);

  useEffect(() => {}, [supersets]);

  const getDurationText = () => {
    const from = new Date(training.from);
    const to = new Date(training.to);

    const durationMs = to.getTime() - from.getTime();
    const totalMinutes = Math.floor(durationMs / 1000 / 60);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const durationText = `${hours > 0 ? `${hours}H ` : ''}${minutes}min`;
    return durationText;
  };

  const getNumExercises = () => {
    return components.reduce(
      (acc, component) =>
        acc +
        component.supersets
          .map((s) => s.exercises.length)
          .reduce((a, b) => a + b, 0),
      0
    );
  };

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
        }}
        gap={1.5}
      >
        <Box
          width="100%"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={1}
        >
          {/* Group name, cycle name, date */}
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar
              src={training.institution?.imageUrl || ''}
              sx={{
                width: 50,
                height: 50,
              }}
            />
            <Box display="flex" flexDirection="column">
              <Typography
                sx={{
                  fontWeight: 'bold',
                  fontSize: 15,
                  height: 20,
                }}
              >
                {training.group?.name}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  height: 16,
                }}
              >
                {training.cycle?.name}
              </Typography>
              <Typography sx={{ fontSize: 12, height: 16 }}>
                {new Date(training.from).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                at{' '}
                {new Date(training.from).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: 'numeric',
                })}
              </Typography>
            </Box>
          </Box>
          <IconButton sx={{ p: 0, m: 0 }}>
            <MoreVert />
          </IconButton>{' '}
        </Box>

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
              {getDurationText()}
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
              {getNumExercises()}
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
          {selectedComponent && showSupersets && (
            <IconButton
              sx={{
                p: 0.5,
                m: 0,
                position: 'absolute',
                right: 0,
                bottom: -6,
                backgroundColor: theme.palette.primary.main,
              }}
              onClick={() => {
                setModal(true);
              }}
            >
              <ArrowForwardRounded fontSize="small" />
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
