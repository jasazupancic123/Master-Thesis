import { useEffect, useRef, useState } from 'react';
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

  const containerRef = useRef<HTMLDivElement>(null);
  const [isWrapped, setIsWrapped] = useState(false);

  useEffect(() => {
    const checkWrapping = () => {
      if (!containerRef.current) return;

      const children = Array.from(containerRef.current.children);
      if (children.length < 2) {
        setIsWrapped(false);
        return;
      }

      // Check if any element is positioned below the first one
      const firstRowTop = (children[0] as HTMLElement).offsetTop;
      const isMultiRow = children.some(
        (child) => (child as HTMLElement).offsetTop > firstRowTop
      );

      setIsWrapped(isMultiRow);
    };

    // Initial check & event listener for resizes
    checkWrapping();
    window.addEventListener('resize', checkWrapping);

    return () => window.removeEventListener('resize', checkWrapping);
  }, [training.components]); // Rerun when components change

  let fontSize = undefined;
  if (screenSize.isMobile) fontSize = '125%';
  else if (screenSize.isLandscapeMobile) fontSize = 15;
  else if (Object.values(training.components).length > 5) {
    fontSize = 22.5;
  }

  return (
    <Box py={screenSize.isLaptop ? 0 : 1}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box sx={{ flex: 1 }}></Box>
      </Box>

      <Box
        ref={containerRef}
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexDirection={screenSize.isMobile ? 'column' : 'row'}
        flexWrap="wrap"
        maxHeight={40}
        mt={
          screenSize.isLandscapeMobile ||
          (Object.values(training.components).length >= 5 &&
            screenSize.isLaptop)
            ? 1
            : screenSize.isLaptop
              ? 1
              : screenSize.isMobile
                ? 2
                : Object.values(training.components).length > 5
                  ? 0.5
                  : undefined
        }
        sx={{
          overflowY:
            isWrapped || screenSize.isMobile || screenSize.isLandscapeMobile
              ? 'auto'
              : undefined,
        }}
      >
        {Object.values(training.components).map(({ component }) => {
          if (!component) return null;
          const IconComponent: SvgIconComponent =
            commonService.navigation.getComponentIcon(component?.name);

          return (
            <Tooltip title={component.name} key={component!.id}>
              <div>
                <IconComponent
                  onClick={async (e) => {
                    e.stopPropagation();
                    await props.deleteTrainingComponent(
                      training.id,
                      component!.id
                    );
                  }}
                  sx={{
                    fontSize: fontSize,
                    margin:
                      !screenSize.isMobile && !screenSize.isLandscapeMobile
                        ? 1
                        : 0,
                    mx:
                      screenSize.isMobile || screenSize.isLandscapeMobile
                        ? 1
                        : undefined,
                    cursor: 'pointer',
                  }}
                />
              </div>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
