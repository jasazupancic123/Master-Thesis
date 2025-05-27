import { CommonService } from '@/common/service/common.service';
import { useScreenSize } from '@/context/screen-size-provider';
import { SvgIconComponent } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import React, { useEffect, useRef, useState } from 'react';
import { TrainingCycleViewGridItemProps } from './type';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';

const commonService = CommonService.instance;

export function TrainingGridItem(props: TrainingCycleViewGridItemProps) {
  const screenSize = useScreenSize();
  const {
    training,
    componentCalendarView,
    periodizationView,
    trainingComponent,
    isSameDayAsSelectedComponent,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isWrapped, setIsWrapped] = useState(false);
  const [components, setComponents] = useState<TrainingComponent[]>(
    (componentCalendarView || periodizationView) &&
      trainingComponent &&
      trainingComponent.component
      ? (training.components
          .map((c) => {
            if (
              c.component &&
              c.component.id === trainingComponent.component!.id
            )
              return c;
            else return null;
          })
          .filter((c) => c !== null) as TrainingComponent[])
      : training.components
  );

  useEffect(() => {
    if (
      (componentCalendarView || periodizationView) &&
      trainingComponent &&
      trainingComponent.component
    ) {
      const newComponents = training.components
        .map((c) => {
          if (c.component && c.component.id === trainingComponent.component!.id)
            return c;
          else return null;
        })
        .filter((c) => c !== null) as TrainingComponent[];
      setComponents(newComponents);
    } else {
      setComponents(training.components);
    }
  }, []);

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

    setComponents(
      (componentCalendarView || periodizationView) &&
        trainingComponent &&
        trainingComponent.component
        ? (training.components
            .map((c) => {
              if (
                c.component &&
                c.component.id === trainingComponent.component!.id
              )
                return c;
              else return null;
            })
            .filter((c) => c !== null) as TrainingComponent[])
        : training.components
    );
    checkWrapping();
    window.addEventListener('resize', checkWrapping);
    return () => window.removeEventListener('resize', checkWrapping);
  }, [training.components]);

  let fontSize = undefined;
  if (screenSize.isMobile) fontSize = '125%';
  else if (screenSize.isLandscapeMobile) fontSize = 15;
  else if (training?.components.length > 5) {
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
          (training.components.length >= 5 && screenSize.isLaptop)
            ? 1
            : screenSize.isLaptop
              ? 1
              : screenSize.isMobile
                ? 2
                : training.components.length > 5
                  ? 0.5
                  : undefined
        }
        sx={{
          overflowY:
            isWrapped || screenSize.isMobile || screenSize.isLandscapeMobile
              ? 'auto'
              : undefined,
          scrollbarWidth: 'thin', // Standard for Firefox
          '&::-webkit-scrollbar': {
            width: '6px', // Small and modern scrollbar
          },
          '::-webkit-scrollbar-track': {
            color: 'transparent',
          },
          '::-webkit-scrollbar-thumb': {
            background: 'red',
          },
        }}
      >
        {components.map((trainingComponent) => {
          const component = trainingComponent.component;
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
                    color: componentCalendarView
                      ? trainingComponent.color
                      : undefined,
                    fontSize:
                      (componentCalendarView || periodizationView) &&
                      isSameDayAsSelectedComponent
                        ? screenSize.isMobile
                          ? 20
                          : 33
                        : fontSize,
                    margin: !componentCalendarView
                      ? !screenSize.isMobile &&
                        !screenSize.isLandscapeMobile &&
                        !isSameDayAsSelectedComponent
                        ? 1
                        : isSameDayAsSelectedComponent
                          ? 0.5
                          : 0
                      : !screenSize.isMobile &&
                          !screenSize.isLandscapeMobile &&
                          !screenSize.isTablet &&
                          !isSameDayAsSelectedComponent
                        ? 1
                        : !isSameDayAsSelectedComponent && screenSize.isTablet
                          ? 2
                          : isSameDayAsSelectedComponent && screenSize.isTablet
                            ? 1.5
                            : isSameDayAsSelectedComponent &&
                                !screenSize.isMobile
                              ? 0.5
                              : !isSameDayAsSelectedComponent &&
                                  screenSize.isMobile
                                ? 0.5
                                : 0,
                    mx:
                      screenSize.isMobile || screenSize.isLandscapeMobile
                        ? 1
                        : undefined,
                    cursor: 'pointer',
                    border: isSameDayAsSelectedComponent
                      ? '1px solid'
                      : undefined,
                    borderRadius: isSameDayAsSelectedComponent
                      ? '50%'
                      : undefined,
                    p: isSameDayAsSelectedComponent ? 0.5 : undefined,
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
