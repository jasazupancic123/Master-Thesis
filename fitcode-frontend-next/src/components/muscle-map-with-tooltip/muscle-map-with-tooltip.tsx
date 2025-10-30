'use client';
import { Close } from '@mui/icons-material';
import { Box, IconButton, Slider, Typography, useTheme } from '@mui/material';
import { useCallback, useEffect, useRef } from 'react';

import {
  clearHideTimer,
  computeCurrentAndPossibleExercises,
  findFilledGroup,
  hasExplicitFill,
  normId,
} from './actions/actions-muscle-heatmap';
import SorenessIcon from '@/assets/icons/Soreness.svg';
import type { Attribute } from '@/core/attribute/type/attribute.type';
import { core } from '@/core/core.service';
import type { MuscleLoadType } from '@/core/exercise/enum/muscle-load-type.enum';
import type { HeatmapLoad } from '@/core/exercise/type/heatmap-load.entity';
import type { MuscleTip } from '@/core/exercise/type/muscle-tip.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { useMain } from '@/store/main.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

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

  const trainerDayViewProvider = useTrainerDayView();

  const { training, component, supersets, addTrainingExercises } =
    trainerDayViewProvider || {};

  const { exercises: allExercises } = useMain();

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
    if (!containerRef.current || tip.focus || athleteAnthropometry) return;
    clearHideTimer(hideTimer);

    const raw = e.target as Element;

    // Resolve a stable target:
    // 1) nearest filled <g>, or
    // 2) the hovered element itself if it has explicit fill,
    // 3) otherwise nothing (we'll maybe hide below).
    const group = findFilledGroup(
      raw,
      maxHeatmapLevel,
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

    showTip(target, px, py);
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
    const group = findFilledGroup(el, heatmapLevel, maxHeatmapLevel);
    const target = group ?? (hasExplicitFill(el) ? el : null);
    if (target) showTip(target); // centers on element
  };

  const handleBlur = () => handleMouseLeave();

  const showTip = useCallback(
    (el: SVGGraphicsElement, px?: number, py?: number) => {
      if (!containerRef.current) return;

      const children = Array.from(el.children);

      // id → display name
      const key = normId(el.id); // includes -r/-l if present

      //const muscleId = key.replace('-r', '').replace('-l', '');
      const muscleId = el.id;

      const muscleIds = [muscleId];
      children.forEach((child) => {
        const childKey = normId(child.id);
        const childMuscleId = childKey.replace('-r', '').replace('-l', '');
        if (!childMuscleId.length) return;
        if (!muscleIds.includes(childMuscleId)) muscleIds.push(childMuscleId);
      });

      const muscleLoad = (muscleLoads as [string, HeatmapLoad][]).find(
        (ml) => ml[0] === muscleId
      )?.[1];

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

        if (!correctMuscle) return prev;

        const { componentExercises, possibleExercises } =
          computeCurrentAndPossibleExercises(
            correctMuscle,
            exercisesInComponent,
            allExercises
          );

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
    [component, supersets, muscleLoads, tip]
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
        onClick={() => {
          if (!tip.show) return;

          if (setSelectedMuscle && setSelectedMuscleName && tip.muscle) {
            const randomLeafMuscle = core.exercise.muscle.getRandomLeafMuscle(
              tip.muscle.field as string
            );
            setSelectedMuscle(randomLeafMuscle);
            setSelectedMuscleName(tip.muscle.name);
          }

          // UNCOMMENT THIS FOR FOCUSED TIP ON CLICK
          setTip((t) => ({
            ...t,
            focus: true,
            x: 0,
            y: 0,
          }));
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

          <Typography fontSize={12} noWrap textAlign="center">
            {[tip.cocentric, tip.eccentric, tip.isometric].every(
              (v) => v !== undefined
            ) &&
              `Coc: ${!isNaN(tip.cocentric ?? 0) ? tip.cocentric : 0} | Ecc: ${
                !isNaN(tip.eccentric ?? 0) ? tip.eccentric : 0
              } | Iso: ${!isNaN(tip.isometric ?? 0) ? tip.isometric : 0}`}
          </Typography>

          <Box
            display="flex"
            justifyContent="center"
            alignItems="flex-start"
            gap={1}
            minWidth={250}
          >
            {!athleteAnthropometry &&
              tip.componentExercises &&
              tip.componentExercises.length > 0 && (
                <Box
                  width="100%"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  gap={0.5}
                >
                  <Typography
                    fontSize={12}
                    fontWeight={600}
                    textAlign="center"
                    mt={1}
                  >
                    Exercises:
                  </Typography>
                  {tip.componentExercises.map((exercise) => (
                    <Typography
                      key={exercise.id}
                      fontSize={10}
                      fontWeight={600}
                      textAlign="center"
                    >
                      &bull; {exercise.exercise?.name}
                    </Typography>
                  ))}
                </Box>
              )}
            {!athleteAnthropometry &&
              tip.possibleExercises &&
              tip.possibleExercises.length > 0 && (
                <Box
                  width="100%"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  gap={0.5}
                >
                  <Typography
                    fontSize={12}
                    fontWeight={600}
                    textAlign="center"
                    mt={1}
                  >
                    Possible exercises:
                  </Typography>
                  {tip.possibleExercises.map((exercise) => (
                    <Typography
                      key={exercise.id}
                      fontSize={10}
                      fontWeight={600}
                      textAlign="center"
                      sx={{
                        cursor: 'pointer',
                        border: `1px solid transparent`,
                        px: 0.5,
                        '&:hover': {
                          border: `1px solid ${theme.palette.text.primary}`,
                          borderRadius: 1,
                        },
                      }}
                      onClick={() => {
                        if (
                          !training ||
                          !component ||
                          !tip.componentExercises ||
                          !tip.possibleExercises
                        )
                          return;

                        const trainingExercise =
                          core.training.superset.toTrainingExercise(exercise);

                        tip.componentExercises.push(trainingExercise);
                        tip.possibleExercises = tip.possibleExercises.filter(
                          (e) => e.id !== exercise.id
                        );

                        setTip((prev) => ({
                          ...prev,
                          componentExercises: tip.componentExercises,
                          possibleExercises: tip.possibleExercises,
                        }));

                        addTrainingExercises(
                          [trainingExercise],
                          component.mainSet
                        );
                      }}
                    >
                      &bull; {exercise.name}
                    </Typography>
                  ))}
                </Box>
              )}
          </Box>

          {athleteAnthropometry && (
            <Box
              width="100%"
              display="flex"
              flexDirection="column"
              alignItems="center"
              sx={{ px: 1 }}
            >
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
                    )?.[1] ?? 0
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
            </Box>
          )}

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
