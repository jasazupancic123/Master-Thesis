import { MoreVert } from '@mui/icons-material';
import { Box, Divider, IconButton } from '@mui/material';
import { useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import React from 'react';

import ComponentsAvatar from '../components-avatar/components-avatar';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import type { TrainingReport } from '@/controller/training/type/training-report.type';

type TrainingReportCardProps = {
  report: TrainingReport;
};

export default function TrainingReportCard(props: TrainingReportCardProps) {
  const theme = useTheme();
  const { report } = props;

  const checkIsActiveTraining = () => {
    const now = dayjs();
    const from = dayjs(report.from);

    const isNowAM = now.hour() < 12;
    const isTrainingAM = from.hour() < 12;

    return isNowAM === isTrainingAM && now.isSame(from, 'day');
  };

  const isActiveTraining = checkIsActiveTraining();

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

        <Box
          width="100%"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={1}
        >
          {/* Group name, cycle name, date */}
          <Box display="flex" alignItems="center" gap={1}>
            <ComponentsAvatar
              size={50}
              components={(report.mappedPlannedComponents || []).map((c) => ({
                id: c.id,
                completedMembersIds: [],
                from: new Date(),
                to: new Date(),
                mainSet: MainSet.BLOCK,
                subgroups: [],
                supersets: [],
              }))}
            />

            <Box display="flex" flexDirection="column">
              <Typography
                sx={{
                  fontWeight: 'bold',
                  fontSize: 15,
                  height: 20,
                }}
              >
                {report.group?.name}
              </Typography>

              <Typography sx={{ fontSize: 12, height: 16 }}>
                {report.cycle?.name}
              </Typography>
              <Typography sx={{ fontSize: 12, height: 16 }}>
                {new Date(report.from).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                at{' '}
                {new Date(report.from).toLocaleTimeString('en-US', {
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
              {report.duration}´
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
              {report.exercises} / {report.totalExercises}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mx: 2 }} />
    </>
  );
}
