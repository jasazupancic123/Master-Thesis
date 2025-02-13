import Box from '@mui/material/Box';
import { Tooltip } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';
import React from 'react';
import { TrainingCycleViewGridItemProps } from './type';
import { useScreenSize } from '@/context/screen-size-provider';
import { CommonService } from '@/common/service/common.service';

const commonService = CommonService.instance;

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
          const IconComponent: SvgIconComponent =
            commonService.navigation.getComponentIcon(component?.name);

          return (
            <Tooltip title={component.name} key={component!.id}>
              <div>
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
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
