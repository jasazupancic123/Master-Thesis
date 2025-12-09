import { useDraggable } from '@dnd-kit/core';
import { DragIndicator } from '@mui/icons-material';
import type { SvgIconProps } from '@mui/material';
import { alpha, IconButton, SvgIcon, Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import type { ElementType } from 'react';
import React, { useRef } from 'react';
import toast from 'react-hot-toast';

import useTrainingCycleComponents from './hooks/use-components';
import type { TrainingCycleViewGridItemProps } from './types/type';
import { theme } from '@/app/style';
import { core } from '@/core/core.service';
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

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `training-${training.id}`,
      data: { training },
    });

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      sx={{
        position: 'relative',
        opacity: isDragging ? 0.5 : 1,
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
    >
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
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: '6px' },
          '::-webkit-scrollbar-track': { color: 'transparent' },
          '::-webkit-scrollbar-thumb': { background: 'red' },
        }}
      >
        {components.map((trainingComponent) => {
          const component = core.training.component.find(trainingComponent.id);
          if (!component) return null;

          const target = core.training.component.findTarget(
            trainingComponent.targetId
          );

          const IconComponent: ElementType<SvgIconProps> | null =
            lib.common.component.getIcon(component?.name);

          return (
            <Tooltip
              key={component!.field}
              title={
                (cycleView || periodizationView) && target ? (
                  <>
                    <Box sx={{ textAlign: 'center' }}>{component.name}</Box>
                    <Box sx={{ textAlign: 'center' }}>{target?.name}</Box>
                  </>
                ) : (
                  component.name
                )
              }
            >
              <div>
                {IconComponent && (
                  <SvgIcon
                    component={IconComponent}
                    sx={{
                      width: screenSize.isMobile ? 12 : 18,
                      height: screenSize.isMobile ? 12 : 18,
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
                      mb: 0.5,
                      cursor: 'pointer',
                      border: isSameDayAsSelectedComponent
                        ? '1px solid'
                        : undefined,
                      borderRadius: isSameDayAsSelectedComponent
                        ? '50%'
                        : undefined,
                      p: isSameDayAsSelectedComponent ? 0.5 : undefined,
                    }}
                    onClick={async (
                      e: React.MouseEvent<SVGSVGElement, MouseEvent>
                    ) => {
                      if (
                        periodizationView &&
                        selectedTrainings &&
                        setSelectedTrainings &&
                        basePeriodizationTraining?.id !== training.id
                      ) {
                        if (selectedTrainings.some((t) => t.id === training.id))
                          setSelectedTrainings((prev) =>
                            prev.filter((t) => t.id !== training.id)
                          );
                        else if (
                          target &&
                          target.field !== selectedTarget?.field
                        )
                          toast.error(
                            'Cannot periodize trainings with different targets'
                          );
                        else if (
                          target &&
                          target.field === selectedTarget?.field &&
                          cycle &&
                          basePeriodizationTraining &&
                          lib.common.date.isBetween(
                            training.to,
                            basePeriodizationTraining.to,
                            cycle?.to
                          )
                        )
                          setSelectedTrainings((prev) => [...prev, training]);
                        else if (
                          cycle &&
                          basePeriodizationTraining &&
                          !lib.common.date.isBetween(
                            training.to,
                            basePeriodizationTraining.to,
                            cycle?.to
                          )
                        )
                          toast.error(
                            'Cannot periodize trainings before the base training'
                          );

                        return;
                      }

                      e.stopPropagation();

                      await props.deleteTrainingComponent(
                        training.id,
                        component!.field
                      );
                    }}
                    fontSize="small"
                  />
                )}

                {(periodizationView || componentCalendarView) && target && (
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
                    {target.name}
                  </Typography>
                )}
              </div>
            </Tooltip>
          );
        })}
      </Box>

      <IconButton
        size="small"
        {...listeners}
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          cursor: 'grab',
          zIndex: 10,
        }}
        // onPointerDown={(e) => e.stopPropagation()}
      >
        <DragIndicator
          sx={{
            fontSize: 16,
            color: alpha(theme.palette.text.primary, 0.7),
          }}
        />
      </IconButton>
    </Box>
  );
}
