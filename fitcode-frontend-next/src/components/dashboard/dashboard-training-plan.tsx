'use client';

import { collection, onSnapshot, query, where } from '@firebase/firestore';
import { Circle } from '@mui/icons-material';
import {
  Checkbox,
  FormControlLabel,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { Box } from '@mui/material';
import { endOfDay, startOfDay } from 'date-fns';
import { useEffect, useState } from 'react';

import AthleteOptionsContainer from '../athlete/athlete-options-container';
import { DASHBOARD_MIDDLE_HEADER_HEIGHT } from './constant/dashboard.const';
import DashboardPageContainer from './dashboard-page-container';
import DashboardTrainingsList from './dashboard-trainings-list';
import { DashboardTrainingPlanFilter } from './enum/dashboard-training-plan-filter.enum';
import useTrainingPlan from './hooks/use-training-plan-trainings';
import { MAX_WIDTH } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import type { Institution } from '@/core/institution/type/institution.type';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import type { Training } from '@/core/training/type/training.type';
import { lib } from '@/lib';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import type { FirestoreEntity } from '@/lib/firebase/type/firestore.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

export default function DashboardTrainingPlan() {
  const theme = useTheme();

  const { role } = useAuthenticatedAuth();
  const { groups } = useMain();
  const { trainings, selectedInstitution } = useDashboard();

  const {
    selectedGroups,
    setSelectedGroups,
    completedTrainings,
    upcomingTrainings,
    onlyMySessions,
    setOnlyMySessions,
  } = useTrainingPlan(trainings, groups);

  const [filter, setFilter] = useState<DashboardTrainingPlanFilter>(
    DashboardTrainingPlanFilter.TRAININGS
  );

  useEffect(() => {
    if (!selectedInstitution || role !== UserRole.MANAGER) return;
    const institutionId = selectedInstitution.id;

    const unsub = onSnapshot(
      query(
        collection(
          lib.firebase.firestore.db,
          `institutions/${institutionId}/institution-members`
        )
      ),
      (snapshot) => {
        const data = snapshot.docs.map((doc) =>
          lib.firebase.firestore.serialize(
            doc.data() as FirestoreEntity<Institution>
          )
        );
      },
      (error) => {
        console.error(
          'Error occured while listening to institution members changes:',
          error
        );
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedInstitution || role !== UserRole.MANAGER) return;
    const institutionId = selectedInstitution.id;

    const unsub = onSnapshot(
      query(
        collection(lib.firebase.firestore.db, 'trainings'),
        where('institutionId', '==', institutionId),
        where('from', '>=', startOfDay(new Date())), // 00:00 today
        where('from', '<', endOfDay(new Date())) // 23:59 today
      ),
      (snapshot) => {
        const data: Training[] = snapshot.docs.map((doc) =>
          lib.firebase.firestore.serialize(
            doc.data() as FirestoreEntity<Training>
          )
        );
      },
      (error) => {
        console.error(
          'Error occured while listening to institution trainings changes:',
          error
        );
      }
    );

    return () => unsub();
  }, []);

  if (!selectedInstitution) return null;

  return (
    <DashboardPageContainer>
      {/* Dashboard Middle Header */}
      <Box
        width="100%"
        height={DASHBOARD_MIDDLE_HEADER_HEIGHT}
        display="flex"
        flexDirection="column"
        justifyContent="space-around"
        alignItems="center"
        maxWidth={MAX_WIDTH}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          maxWidth={MAX_WIDTH}
          sx={{
            overflowX: 'auto',
          }}
        >
          {Object.values(DashboardTrainingPlanFilter).map((f) => {
            const isSelected = filter === f;

            return (
              <Box
                key={f}
                display="flex"
                alignItems="center"
                sx={{
                  cursor: 'pointer',
                }}
                onClick={() => setFilter(f)}
                gap={0.5}
              >
                {isSelected && (
                  <Circle
                    sx={{ color: theme.palette.primary.main, fontSize: 12 }}
                  />
                )}
                <Typography
                  fontSize={14}
                  fontWeight={600}
                  sx={{
                    textTransform: 'uppercase',
                    color: isSelected
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                  }}
                >
                  {f.charAt(0)?.toUpperCase() + f.slice(1)?.toLowerCase()}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          maxWidth={MAX_WIDTH}
          sx={{ overflowX: 'auto', ...styledScrollbarSx(theme) }}
        >
          {groups.map((group) => {
            const isSelected = selectedGroups.some((g) => g.id === group.id);

            return (
              <Tooltip key={group.id} title={group.name} arrow>
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedGroups((prev) =>
                        prev.filter((g) => g.id !== group.id)
                      );
                    } else {
                      setSelectedGroups((prev) => [...prev, group]);
                    }
                  }}
                  sx={{
                    px: 2,
                    py: 0.5,
                    backgroundColor: isSelected
                      ? theme.palette.primary.main
                      : theme.palette.background.default,
                    border: isSelected
                      ? `1px solid ${theme.palette.primary.main}`
                      : `1px solid ${theme.palette.text.primary}`,
                    borderRadius: 1,
                    cursor: 'pointer',
                  }}
                >
                  <Typography
                    textAlign="center"
                    fontWeight={600}
                    width={80}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: isSelected
                        ? theme.palette.text.secondary
                        : theme.palette.text.primary,
                      userSelect: 'none',
                    }}
                  >
                    {group.name}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      <AthleteOptionsContainer
        items={['Completed', 'Upcoming']}
        selectedItem={''}
        onClick={(_) => {}}
        title="Sessions"
        disabled
      />

      <Box width="100%" display="flex" justifyContent="center" mt={-3}>
        <FormControlLabel
          label="My sessions"
          control={
            <Checkbox
              checked={onlyMySessions}
              onChange={(e) => setOnlyMySessions(e.target.checked)}
            />
          }
        />
      </Box>

      <Box width="100%" display="flex" justifyContent="space-between">
        <Box width="50%" display="flex" justifyContent="center">
          <Box width="70%">
            <DashboardTrainingsList
              trainings={completedTrainings}
              selectedGroups={selectedGroups}
              filter={filter}
            />
          </Box>
        </Box>

        <Box width="50%" display="flex" justifyContent="center">
          <Box width="70%">
            <DashboardTrainingsList
              trainings={upcomingTrainings}
              selectedGroups={selectedGroups}
              filter={filter}
              upcoming
            />
          </Box>
        </Box>
      </Box>
    </DashboardPageContainer>
  );
}
