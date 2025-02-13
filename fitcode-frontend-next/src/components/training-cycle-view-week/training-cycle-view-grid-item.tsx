import Box from '@mui/material/Box';
import { Divider } from '@mui/material';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { AddCircle, SvgIconComponent } from '@mui/icons-material';
import React from 'react';
import { TrainingCycleViewGridItemProps } from './type';
import { getComponentIcon } from '@/common/service/util/components-icon.util';
import { useScreenSize } from '@/context/screen-size-provider';

export function TrainingGridItem(props: TrainingCycleViewGridItemProps) {
  const screenSize = useScreenSize();
  const { training } = props;

  return (
    <Box py={1}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box sx={{ flex: 1 }}></Box>
      </Box>

      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
      >
        {Object.values(training.components).map(({ component }) => {
          if (!component) return null;
          const IconComponent: SvgIconComponent = getComponentIcon(
            component?.name
          );
          return (
            <div key={component!.id}>
              <IconComponent
                fontSize={
                  Object.values(training.components).length > 5 ||
                  (Object.values(training.components).length >= 5 &&
                    screenSize.isLaptop)
                    ? screenSize.isLaptop
                      ? 'small'
                      : 'small'
                    : 'medium'
                }
                onClick={async (e) => {
                  e.stopPropagation();
                  await props.deleteTrainingComponent(
                    training.id,
                    component!.id
                  );
                }}
                sx={{
                  margin: 1,
                  cursor: 'pointer',
                }}
              ></IconComponent>
            </div>
          );
        })}
      </Box>
    </Box>
  );
}