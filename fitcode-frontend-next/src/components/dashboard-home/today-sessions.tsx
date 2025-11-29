import { Box } from '@mui/material';
import dayjs from 'dayjs';

import type { TrainingComponent } from '@/core/training/type/training-component.type';
import { useDashboard } from '@/store/dashboard.provider';
import { Training } from '@/core/training/type/training.type';
import { Group } from '@/core/institution/type/group.type';
import TodaySessionsComponent from './today-sessions-component';
import { SetState } from '@/lib/common/type/state.type';

interface Props {
  trainings: Training[];
  activeComponent?: (TrainingComponent & { trainingId?: string }) | null;
  setSelectedTraining?: SetState<Training | null>;
  setSelectedTrainingComponent?: SetState<TrainingComponent | null>;
  setOpenTrainingComponentModal?: SetState<boolean>;
}

export default function TodaySessions(props: Props) {
  const dashboardContext = useDashboard();

  const selectedGroups: Group[] | null = dashboardContext
    ? dashboardContext.selectedGroups
    : null;

  const {
    trainings,
    activeComponent,
    setSelectedTraining,
    setSelectedTrainingComponent,
    setOpenTrainingComponentModal,
  } = props;

  const todayComponents: (TrainingComponent & {
    groupId: string | undefined;
    trainingId: string;
  })[] = (
    selectedGroups === null // for athlete view, show all trainings
      ? trainings
      : trainings.filter((training) =>
          selectedGroups.some((group) => group.id === training.groupId)
        )
  )
    .filter((t) => dayjs(t.from).isSame(dayjs(), 'day'))
    .flatMap((training) =>
      training.components.map((component) => ({
        ...component,
        groupId: training.groupId,
        trainingId: training.id,
      }))
    );

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      gap={2}
      sx={{ p: 1 }}
    >
      {todayComponents.map((component, i) => {
        if (
          activeComponent &&
          activeComponent.id === component.id &&
          activeComponent.trainingId === component.trainingId
        )
          return null;

        return (
          <TodaySessionsComponent
            key={`${component.id}-${i}`}
            component={component}
            trainings={trainings}
            index={i}
            setSelectedTraining={setSelectedTraining}
            setSelectedTrainingComponent={setSelectedTrainingComponent}
            setOpenTrainingComponentModal={setOpenTrainingComponentModal}
          />
        );
      })}
    </Box>
  );
}
