'use client';
import { Close } from '@mui/icons-material';
import { Box, IconButton, Slider, Typography, useTheme } from '@mui/material';
import { Fragment, useCallback, useEffect, useRef } from 'react';

import {
  clearHideTimer,
  findFilledGroup,
  formatName,
  hasExplicitFill,
  normId,
} from './state';
import SorenessIcon from '@/assets/icons/Soreness.svg';
import { core } from '@/core/core.service';
import type { MuscleTip } from '@/core/exercise/type/muscle-tip.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import { HeatmapLoad } from '@/core/exercise/type/heatmap-load.entity';
import { MuscleLoadType } from '@/core/exercise/enum/muscle-load-type.enum';
import { Attribute } from '@/core/attribute/type/attribute.type';

export type SvgC = React.ForwardRefExoticComponent<
  React.SVGProps<SVGSVGElement> & React.RefAttributes<SVGSVGElement>
>;

interface Props {
  front: boolean;
  Svg: SvgC;
  exercisesInComponent: TrainingExercise[];
  heatmapLevel: number;
  maxHeatmapLevel: number;
  tip: MuscleTip;
  setTip: SetState<MuscleTip>;
  athleteAnthropometry?: boolean;
  muscleLoads?: [string, HeatmapLoad][] | [string, number][];
  setMuscleLoads?: SetState<[string, number][]>;
  selectedLoadType?: 'ALL' | MuscleLoadType;
  setSelectedMuscle?: SetState<Attribute | null>;
  setSelectedMuscleName?: SetState<string | null>;
}

export default function MuscleMapWithTooltip(props: Props) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { exercises: allExercises } = useMain();
  const { training, component, addTrainingExercises } =
    useTrainerDayView() || {};

  const {
    front,
    Svg,
    exercisesInComponent,
    heatmapLevel,
    maxHeatmapLevel,
    tip,
    athleteAnthropometry,
    setTip,
    muscleLoads,
    setMuscleLoads,
    selectedLoadType,
    setSelectedMuscle,
    setSelectedMuscleName,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hideTimer = useRef<number | null>(null);

  // Make labeled shapes keyboard-focusable for a11y tooltips
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.querySelectorAll<SVGGraphicsElement>('[id]').forEach((el) => {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    });
  }, []);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || tip.focus) return;
    clearHideTimer(hideTimer);

    const raw = e.target as Element;

    // Resolve a stable target:
    // 1) nearest filled <g>, or
    // 2) the hovered element itself if it has explicit fill,
    // 3) otherwise nothing (we'll maybe hide below).
    const group = findFilledGroup(
      raw,
      maxHeatmapLevel,
      athleteAnthropometry && muscleLoads
        ? muscleLoads.map(([id]) => id)
        : undefined
    );
    const target =
      group ??
      (raw instanceof SVGGraphicsElement && hasExplicitFill(raw) ? raw : null);

    if (!target) {
      // Don’t insta-hide; small grace to avoid flicker on tiny gaps
      hideTimer.current = window.setTimeout(() => {
        setTip((t) => (t.show ? { ...t, show: false } : t));
      }, 60);
      return;
    }

    // pointer position relative to container
    const crect = containerRef.current.getBoundingClientRect();
    const px = e.clientX - crect.left;
    const py = e.clientY - crect.top;

    showForEl(target, px, py);
  };

  const handleMouseLeave = () => {
    clearHideTimer(hideTimer);
    if (tip.focus) return;
    setTip((t) => (t.show ? { ...t, show: false } : t));
  };

  // keyboard support: focus/blur show/hide tooltip
  const handleFocus = (e: React.FocusEvent<SVGSVGElement>) => {
    const el = (e.target as Element).closest<SVGGraphicsElement>('[id]');
    if (!el) return;
    // Only show for nodes that actually have/are within a filled region
    const group = findFilledGroup(el, heatmapLevel);
    const target = group ?? (hasExplicitFill(el) ? el : null);
    if (target) showForEl(target); // centers on element
  };

  const handleBlur = () => handleMouseLeave();

  // const computeExercises = useCallback(
  //   (muscleIds: string[]) => {
  //     const componentExercises = exercisesInComponent.filter((e) =>
  //       e.exercise?.muscleValues?.some(
  //         (mv) =>
  //           muscleIds.includes(mv.field) ||
  //           muscleIds.some((mid) => mv.selected?.startsWith(`${mid}:`)) ||
  //           muscleIds.some((mid) => mv.selected?.endsWith(`:${mid}`))
  //       )
  //     );

  //     componentExercises.sort((a, b) => {
  //       const aMuscle = a.exercise?.muscleValues?.find((mv) =>
  //         heatmapLevel === 1
  //           ? muscleIds.includes(mv.field)
  //           : heatmapLevel === 2
  //             ? muscleIds.some((mid) => mv.selected?.startsWith(`${mid}:`))
  //             : muscleIds.some((mid) => mv.selected?.endsWith(`:${mid}`))
  //       );

  //       const bMuscle = b.exercise?.muscleValues?.find((mv) =>
  //         heatmapLevel === 1
  //           ? muscleIds.includes(mv.field)
  //           : heatmapLevel === 2
  //             ? muscleIds.some((mid) => mv.selected?.startsWith(`${mid}:`))
  //             : muscleIds.some((mid) => mv.selected?.endsWith(`:${mid}`))
  //       );

  //       if (!aMuscle || !bMuscle) return 0;

  //       if (
  //         aMuscle.value === bMuscle.value &&
  //         a.exercise?.muscleValues &&
  //         b.exercise?.muscleValues
  //       ) {
  //         return (
  //           a.exercise?.muscleValues.length - b.exercise?.muscleValues.length
  //         );
  //       }

  //       if (aMuscle.value < bMuscle.value) return -1;
  //       return 1;
  //     });

  //     const possibleExercises = allExercises.filter((e) =>
  //       e.muscleValues?.some(
  //         (mv) =>
  //           muscleIds.includes(mv.field) ||
  //           muscleIds.some((mid) => mv.selected?.startsWith(`${mid}:`)) ||
  //           muscleIds.some((mid) => mv.selected?.endsWith(`:${mid}`))
  //       )
  //     );

  //     return { componentExercises, possibleExercises };
  //   },
  //   [exercisesInComponent, heatmapLevel]
  // );

  const showForEl = useCallback(
    (el: SVGGraphicsElement, px?: number, py?: number) => {
      if (!containerRef.current || tip.focus) return;

      const children = Array.from(el.children);

      // id → display name
      const key = normId(el.id); // includes -r/-l if present

      //const muscleId = key.replace('-r', '').replace('-l', '');
      const muscleId = el.id;

      const muscleName = formatName(key);

      const muscleIds = [muscleId];
      children.forEach((child) => {
        const childKey = normId(child.id);
        const childMuscleId = childKey.replace('-r', '').replace('-l', '');
        if (!childMuscleId.length) return;
        if (!muscleIds.includes(childMuscleId)) muscleIds.push(childMuscleId);
      });

      // console.log(muscleLoads, 'muscleId', muscleId);

      const muscleLoad = (muscleLoads as [string, HeatmapLoad][]).find(
        (ml) => ml[0] === muscleId
      )?.[1];

      // console.log('muscleLoad', muscleLoad);

      // pointer coords or center on element (for keyboard focus)
      let x = px ?? 0;
      let y = py ?? 0;
      if (px === null || py === null) {
        const rect = el.getBoundingClientRect();
        const crect = containerRef.current.getBoundingClientRect();
        x = rect.left - crect.left + rect.width / 2;
        y = rect.top - crect.top + rect.height / 2;
      }

      setTip((prev) => {
        // If we are still on the same muscle, only update position to avoid re-mount
        if (prev.show && prev.id === key) {
          if (prev.x === x && prev.y === y) {
            return prev;
          } // no-op
          return {
            ...prev,
            x: athleteAnthropometry ? prev.x : x,
            y: athleteAnthropometry ? prev.y : y,
          };
        }

        const correctMuscle = core.exercise.muscle.getCorrectMuscleByLevel(
          muscleId,
          heatmapLevel,
          maxHeatmapLevel
        );

        console.log('correctMuscle', correctMuscle, 'muscleId', muscleId);

        if (!correctMuscle) return prev;

        // const { componentExercises, possibleExercises } = athleteAnthropometry
        //   ? { componentExercises: undefined, possibleExercises: undefined }
        //   : computeExercises(muscleIds);

        const { componentExercises, possibleExercises } = {
          componentExercises: undefined,
          possibleExercises: undefined,
        };

        // New muscle → compute exercises once
        return {
          show: true,
          x: x === 0 && athleteAnthropometry ? prev.x : x,
          y: y === 0 && athleteAnthropometry ? prev.y : y,
          id: correctMuscle.field as string,
          name: correctMuscle.name,
          muscle: correctMuscle,
          isometric: muscleLoad?.isometric,
          cocentric: muscleLoad?.concentric,
          eccentric: muscleLoad?.eccentric,
          componentExercises,
          possibleExercises,
          focus: false,
        };
      });
    },
    [muscleLoads]
    // [computeExercises]
  );

  return (
    <Box
      ref={containerRef}
      component="span"
      sx={{
        position: 'relative',
        display: screenSize.isSmallerThanLaptop ? 'flex' : 'inline-block',
        flex: '0 0 auto',
        lineHeight: 0,
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        '& [tabindex]:focus:not(:focus-visible)': { outline: 'none' },
        justifyContent: 'center',
        maxWidth: screenSize.isSmallerThanLaptop
          ? window.innerWidth * 0.4
          : undefined,
      }}
    >
      <Svg
        ref={svgRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={(e: React.MouseEvent<SVGSVGElement>) => {
          if (athleteAnthropometry && muscleLoads) {
            const raw = e.target as Element;
            const group = findFilledGroup(
              raw,
              heatmapLevel,
              muscleLoads.map(([id]) => id)
            );
            const target =
              group ??
              (raw instanceof SVGGraphicsElement && hasExplicitFill(raw)
                ? raw
                : null);

            if (!target) return;

            showForEl(target!);
            setTip((t) => ({
              ...t,
              show: true,
              focus: true,
            }));

            return;
          }

          if (!tip.show) return;

          if (setSelectedMuscle && setSelectedMuscleName && tip.muscle) {
            const randomLeafMuscle = core.exercise.muscle.getRandomLeafMuscle(
              tip.muscle.field as string
            );
            setSelectedMuscle(randomLeafMuscle);
            setSelectedMuscleName(tip.muscle.name);
          }

          // UNCOMMENT THIS FOR FOCUSED TIP ON CLICK
          // setTip((t) => ({
          //   ...t,
          //   focus: true,
          //   x: 0,
          //   y: 0,
          // }));
        }}
        role="img"
        style={{
          maxHeight: screenSize.isMobile ? 300 : 500,
          display: 'block',
          cursor: 'pointer',
        }}
      />

      {tip && tip.show && (
        <Box
          id="muscle-tip"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="flex-start"
          sx={{
            width: 'fit-content',
            minWidth: athleteAnthropometry ? 200 : undefined,
            position: 'absolute',
            left: screenSize.isMobile ? (front ? undefined : '0%') : tip.x,
            right: screenSize.isMobile && front ? '0%' : undefined,
            top: tip.y,
            transform: screenSize.isMobile
              ? `translate(${front ? '50%' : '-50%'}, -100%)`
              : 'translate(0, -100%)', // bottom-left at the cursor
            zIndex: 1000000,
            backgroundColor: theme.palette.background.paper,
            p: 1,
            pb: 0,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 3,
            borderRadius: 1,
          }}
          aria-hidden
        >
          {tip.focus && (
            <IconButton
              sx={{ position: 'absolute', top: 0, right: 5 }}
              onClick={(e) => {
                e.preventDefault();
                setTip((t) => ({ ...t, focus: false, show: false }));
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          )}

          <Typography fontWeight={600} noWrap textAlign="center">
            {tip.name}
          </Typography>

          {[
            { value: tip.cocentric, title: 'Cocentric' },
            { value: tip.eccentric, title: 'Eccentric' },
            { value: tip.isometric, title: 'Isometric' },
          ].map(({ value, title }) => (
            <Fragment key={title}>
              {value !== undefined && (
                <Typography fontSize={12} noWrap textAlign="center">
                  {title}: {!isNaN(value) ? value : 0}
                </Typography>
              )}
            </Fragment>
          ))}

          <Box
            display="flex"
            justifyContent="center"
            alignItems="flex-start"
            gap={1}
            sx={{
              maxHeight: 300,
              overflowY: !athleteAnthropometry ? 'auto' : undefined,
            }}
          >
            {!athleteAnthropometry &&
            tip.possibleExercises &&
            tip.componentExercises ? (
              <>
                <Box
                  maxWidth="50%"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  sx={{
                    minWidth: screenSize.isUltraSmall
                      ? 80
                      : screenSize.isMobile
                        ? 100
                        : 150,
                    maxWidth: screenSize.isUltraSmall ? 80 : undefined,
                  }}
                >
                  <Typography fontSize={14} noWrap>
                    In training
                  </Typography>

                  <Box
                    width="100%"
                    display="flex"
                    flexDirection="column"
                    alignItems="flex-start"
                  >
                    {tip.componentExercises.map((ex) => (
                      <Typography key={ex.id} fontSize={14} textAlign="start">
                        • {ex.exercise?.name}
                      </Typography>
                    ))}
                  </Box>
                </Box>

                <Box
                  maxWidth="50%"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  sx={{
                    maxWidth: screenSize.isUltraSmall ? 80 : undefined,
                    minWidth: screenSize.isUltraSmall
                      ? 80
                      : screenSize.isMobile
                        ? 100
                        : 150,
                  }}
                >
                  <Typography fontSize={14} noWrap>
                    Suggested
                  </Typography>

                  <Box
                    width="100%"
                    display="flex"
                    flexDirection="column"
                    alignItems="flex-start"
                  >
                    {tip.possibleExercises.map((ex) => (
                      <Box
                        width="100%"
                        key={ex.id}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            border: `1px solid ${theme.palette.text.primary}`,
                            borderRadius: 1,
                            p: 0.1,
                          },
                        }}
                        onClick={() => {
                          if (
                            !training ||
                            !component ||
                            !tip.possibleExercises ||
                            !tip.componentExercises
                          )
                            return;

                          const trainingExercise =
                            core.training.superset.toTrainingExercise(ex);

                          tip.componentExercises.push(trainingExercise);
                          tip.possibleExercises = tip.possibleExercises.filter(
                            (e) => e.id !== ex.id
                          );

                          addTrainingExercises(
                            [trainingExercise],
                            component.mainSet
                          );
                        }}
                      >
                        <Typography fontSize={14} textAlign="start">
                          • {ex.name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </>
            ) : (
              <Box
                width="100%"
                display="flex"
                flexDirection="column"
                alignItems="center"
                sx={{ px: 1 }}
              >
                {muscleLoads &&
                  setMuscleLoads &&
                  muscleLoads.find(([id]) => id === tip.id) && (
                    <Box
                      width="100%"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      sx={{ p: 4, py: 2, pb: 0, position: 'relative' }}
                    >
                      <Typography
                        fontSize={12}
                        sx={{
                          position: 'absolute',
                          left: 32,
                          top: 5,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        gap={0.5}
                      >
                        <SorenessIcon />
                        Soreness
                      </Typography>

                      <Slider
                        valueLabelDisplay="auto"
                        value={
                          (muscleLoads as [string, number][]).find(
                            ([id]) => id === tip.id
                          )?.[1] ?? 5
                        }
                        onChange={(_, value) => {
                          if (!setMuscleLoads || !tip.id) return;
                          const v = value as number;
                          setMuscleLoads((ml) => {
                            const existing = ml.find(([id]) => id === tip.id);
                            if (existing) {
                              existing[1] = v;
                              return [...ml];
                            }
                            if (!tip.id) return ml;
                            return [...ml, [tip.id, v]];
                          });
                        }}
                        step={1}
                        min={0}
                        max={10}
                        sx={{
                          width: 200,
                          color: theme.palette.primary.main,
                          '& .MuiSlider-track': {
                            backgroundColor: theme.palette.primary.main,
                            border: 'none',
                          },
                          '& .MuiSlider-thumb': {
                            width: 14,
                            height: 14,
                            backgroundColor: theme.palette.primary.main,
                          },
                          '& .MuiSlider-rail': {
                            backgroundColor: '#ffffff',
                          },
                          '& .MuiSlider-valueLabelOpen': {
                            backgroundColor: 'transparent',
                            top: 2,
                            fontSize: 12,
                          },
                          '& .MuiSlider-valueLabelOpen:before': {
                            display: 'none',
                          },
                        }}
                      />
                    </Box>
                  )}
              </Box>
            )}
          </Box>

          {!athleteAnthropometry && (
            <Typography
              noWrap
              textAlign="center"
              fontSize={10}
              color={theme.palette.text.secondary}
            >
              {!tip.focus ? 'Click to focus' : 'Click exercise to add'}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
