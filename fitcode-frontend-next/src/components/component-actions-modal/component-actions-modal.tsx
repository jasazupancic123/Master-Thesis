import { Box } from '@mui/material';
import { useTheme } from '@mui/material';
import { useState } from 'react';

import ComponentPeriodization from '../component-periodization/component-periodization';
import TrainingComponentCalendar from '../training-component-calendar/training-component-calendar';
import { ComponentModalAction } from '@/common/enum/component-modal-action.constant';
import type { Day } from '@/common/service/util/date.util';
import type { SetState } from '@/common/type/state.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';

interface ComponentActionsModalProps {
  trainingComponent: TrainingComponent; // Replace with actual type
  training: Training; // Replace with actual type
  day: Day; // Replace with actual type
  setOpenOverwriteModal: SetState<boolean>;
  setTrainingInPeriodForModal: SetState<Training | null>;
}

export default function ComponentActionsModal(
  props: ComponentActionsModalProps
) {
  const {
    trainingComponent,
    training,
    day,
    setOpenOverwriteModal,
    setTrainingInPeriodForModal,
  } = props;

  const theme = useTheme();

  const [action, setAction] = useState<ComponentModalAction>(
    ComponentModalAction.COPY_COMPONENT
  );

  const renderActionContent = (action: ComponentModalAction) => {
    switch (action) {
      case ComponentModalAction.COPY_COMPONENT:
        return (
          <TrainingComponentCalendar
            trainingComponent={trainingComponent}
            training={training}
            setOpenOverwriteModal={setOpenOverwriteModal}
            setTrainingInPeriodForModal={setTrainingInPeriodForModal}
            copyComponent={true}
            day={day}
          />
        );
      case ComponentModalAction.PERIODIZE_COMPONENT:
        return (
          <ComponentPeriodization
            selectedComponent={trainingComponent}
            training={training}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box width="100%" display="flex" flexDirection="column">
      <Box
        width="100%"
        display="flex"
        flexBasis="50%"
        justifyContent="space-around"
        mb={2}
      >
        {[
          {
            value: ComponentModalAction.COPY_COMPONENT,
            text: 'Copy Component',
          },
          {
            value: ComponentModalAction.PERIODIZE_COMPONENT,
            text: 'Periodization',
          },
        ].map((item) => (
          <Box
            key={item.value}
            width="50%"
            display="flex"
            justifyContent="center"
            onClick={() => setAction(item.value)}
            sx={{
              textDecoration: action === item.value ? 'underline' : 'none',
              textDecorationColor:
                action === item.value ? theme.palette.primary.main : 'inherit',
              fontWeight: action === item.value ? 'bold' : 'normal',
              cursor: 'pointer',
              backgroundColor:
                action === item.value
                  ? theme.palette.primary.main
                  : 'transparent',
              py: 0.5,
            }}
          >
            {item.text}
          </Box>
        ))}
      </Box>

      {renderActionContent(action)}
    </Box>
  );
}
