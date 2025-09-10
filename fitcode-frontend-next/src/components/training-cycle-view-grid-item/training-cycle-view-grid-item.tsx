import type { SvgIconComponent } from '@mui/icons-material';
import { Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import type { SvgC } from '../muscle-map-with-tooltip/muscle-map-with-tooltip';
import type { TrainingCycleViewGridItemProps } from '../training-cycle-view-week/type';
import { CommonService } from '@/common/service/common.service';
import { getComponentIcon } from '@/common/service/util/icons.util';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';

const commonService = CommonService.instance;

export function TrainingGridItem(props: TrainingCycleViewGridItemProps) {
  const screenSize = useScreenSize();
  const {
    training,
    componentCalendarView,
    periodizationView,
    cycleView,
    trainingComponent,
    isSameDayAsSelectedComponent,
    selected,
    selectedTrainings,
    setSelectedTrainings,
    basePeriodizationTraining,
    selectedTarget,
  } = props;

  const { cycle } = useGroup();

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
  }, [training.components, components.length]);

  return (
    <Box>
      <Box
        ref={containerRef}
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexDirection={screenSize.isMobile ? 'column' : 'row'}
        flexWrap="wrap"
        height="70px"
        gap={1}
        py={1}
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
          const IconComponent: SvgIconComponent | SvgC | null =
            getComponentIcon(component?.name);

          return (
            <Tooltip
              title={
                (cycleView || periodizationView) && trainingComponent.target ? (
                  <>
                    <Box sx={{ textAlign: 'center' }}>{component.name}</Box>
                    <Box sx={{ textAlign: 'center' }}>
                      {trainingComponent.target?.name}
                    </Box>
                  </>
                ) : (
                  component.name
                )
              }
              key={component!.id}
            >
              <div>
                {IconComponent && (
                  <IconComponent
                    onClick={async (e) => {
                      if (
                        periodizationView &&
                        selectedTrainings &&
                        setSelectedTrainings &&
                        basePeriodizationTraining?.id !== training.id
                      ) {
                        if (
                          selectedTrainings.some((t) => t.id === training.id)
                        ) {
                          setSelectedTrainings((prev) =>
                            prev.filter((t) => t.id !== training.id)
                          );
                        } else if (
                          trainingComponent.target &&
                          trainingComponent.target.id !== selectedTarget?.id
                        ) {
                          toast.error(
                            'Cannot periodize trainings with different targets'
                          );
                        } else if (
                          trainingComponent.target &&
                          trainingComponent.target.id === selectedTarget?.id &&
                          cycle &&
                          basePeriodizationTraining &&
                          commonService.date.isBetween(
                            training.to,
                            basePeriodizationTraining.to,
                            cycle?.to
                          )
                        ) {
                          setSelectedTrainings((prev) => [...prev, training]);
                        } else if (
                          cycle &&
                          basePeriodizationTraining &&
                          !commonService.date.isBetween(
                            training.to,
                            basePeriodizationTraining.to,
                            cycle?.to
                          )
                        ) {
                          toast.error(
                            'Cannot periodize trainings before the base training'
                          );
                        }
                        return;
                      }
                      e.stopPropagation();
                      await props.deleteTrainingComponent(
                        training.id,
                        component!.id
                      );
                    }}
                    style={{
                      height: screenSize.isSmallerThanLaptop ? 20 : 25,
                      width: screenSize.isSmallerThanLaptop ? 20 : 25,
                    }}
                    sx={{
                      color: cycleView
                        ? trainingComponent.target?.color
                        : componentCalendarView
                          ? trainingComponent.color
                          : selected && selectedTarget
                            ? selectedTarget.color
                            : undefined,
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
                            : isSameDayAsSelectedComponent &&
                                screenSize.isTablet
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
                      mb:
                        periodizationView || componentCalendarView
                          ? 0
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
                )}

                {(periodizationView || componentCalendarView) &&
                  trainingComponent.target && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'grey.400',
                        fontSize: 10,
                        maxWidth: screenSize.isMobile
                          ? 30
                          : screenSize.isSmallerThanLaptop
                            ? 60
                            : 120,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {trainingComponent.target.name}
                    </Typography>
                  )}
              </div>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
