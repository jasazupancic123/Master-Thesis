import { Box } from '@mui/material';
import { useTheme } from '@mui/material';
import { useState } from 'react';

import ComponentPeriodization from '../component-periodization/component-periodization';
import { ComponentModalAction } from '@/common/enum/component-modal-action.constant';
import type { Day } from '@/common/service/util/date.util';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';

interface ComponentActionsModalProps {
  trainingComponent: TrainingComponent; // Replace with actual type
  day: Day; // Replace with actual type
}

export default function ComponentActionsModal(
  props: ComponentActionsModalProps
) {
  const { trainingComponent } = props;
  const theme = useTheme();

  const [action, setAction] = useState<ComponentModalAction>(
    ComponentModalAction.PERIODIZE_COMPONENT
  );

  const renderActionContent = (action: ComponentModalAction) => {
    switch (action) {
      case ComponentModalAction.PERIODIZE_COMPONENT:
        return <ComponentPeriodization selectedComponent={trainingComponent} />;
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
