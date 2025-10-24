import type { SvgIconProps } from '@mui/material';
import { Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import type { ElementType } from 'react';
import React, { useRef } from 'react';
import toast from 'react-hot-toast';

import useTrainingCycleComponents from './hooks/use-components';
import type { TrainingCycleViewGridItemProps } from './types/type';
import { lib } from '@/lib';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';

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

  const { isWrapped, components } = useTrainingCycleComponents({
    training,
    trainingComponent,
    componentCalendarView,
    periodizationView,
    containerRef,
  });

  return (
    <Box>
      <Box
        ref={containerRef}
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexDirection={screenSize.isMobile ? 'column' : 'row'}
        flexWrap="wrap"
        height="70px !important"
        gap={1}
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
          const IconComponent: ElementType<SvgIconProps> | null =
            lib.common.component.getIcon(component?.name);

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
                          lib.common.date.isBetween(
                            training.to,
                            basePeriodizationTraining.to,
                            cycle?.to
                          )
                        ) {
                          setSelectedTrainings((prev) => [...prev, training]);
                        } else if (
                          cycle &&
                          basePeriodizationTraining &&
                          !lib.common.date.isBetween(
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
