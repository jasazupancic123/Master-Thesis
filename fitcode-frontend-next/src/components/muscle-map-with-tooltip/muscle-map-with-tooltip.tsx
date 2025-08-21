'use client';
import { Box, Typography, useTheme } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';

type SvgC = React.ForwardRefExoticComponent<
  React.SVGProps<SVGSVGElement> & React.RefAttributes<SVGSVGElement>
>;

// normalize ids like `upper_pectoralis_major-l_3` → `upper_pectoralis_major-l`
const normId = (id: string) => id.replace(/_\d+$/, '');

const formatName = (id: string) =>
  id.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

interface MuscleMapWithTooltipProps {
  id: string;
  Svg: SvgC;
  exercises: TrainingExercise[];
  heatmapLevel: number;
}

export default function MuscleMapWithTooltip({
  id,
  Svg,
  exercises,
  heatmapLevel,
}: MuscleMapWithTooltipProps) {
  const theme = useTheme();

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hideTimer = useRef<number | null>(null);

  const [tip, setTip] = useState<{
    show: boolean;
    x: number;
    y: number;
    id?: string;
    name?: string;
    exercises: TrainingExercise[];
  }>({ show: false, x: 0, y: 0, exercises: [] });

  // Make labeled shapes keyboard-focusable for a11y tooltips
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.querySelectorAll<SVGGraphicsElement>('[id]').forEach((el) => {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    });
  }, []);

  // style attribute contains an explicit fill (and not fill:none)
  const hasExplicitFill = (el: Element) => {
    const style = el.getAttribute('style') || '';
    if (!/fill\s*:/.test(style)) return false;
    return !/fill\s*:\s*none/i.test(style);
  };

  // find nearest ancestor <g> with explicit fill
  const findFilledGroup = (
    start: Element,
    svg: SVGSVGElement
  ): SVGGraphicsElement | null => {
    let el: Element | null = start;
    while (el && el !== svg) {
      if (
        el instanceof SVGGraphicsElement &&
        el.tagName.toLowerCase() === 'g' &&
        hasExplicitFill(el)
      ) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  };

  const computeExercises = useCallback(
    (muscleId: string) => {
      const filteredExercises = exercises.filter((e) =>
        e.exercise?.muscleValues?.some((mv) =>
          heatmapLevel === 1
            ? mv.field === muscleId
            : heatmapLevel === 2
              ? mv.selected.startsWith(`${muscleId}:`)
              : mv.selected.endsWith(`:${muscleId}`)
        )
      );

      filteredExercises.sort((a, b) => {
        const aMuscle = a.exercise?.muscleValues?.find((mv) =>
          heatmapLevel === 1
            ? mv.field === muscleId
            : heatmapLevel === 2
              ? mv.selected.startsWith(`${muscleId}:`)
              : mv.selected.endsWith(`:${muscleId}`)
        );

        const bMuscle = b.exercise?.muscleValues?.find((mv) =>
          heatmapLevel === 1
            ? mv.field === muscleId
            : heatmapLevel === 2
              ? mv.selected.startsWith(`${muscleId}:`)
              : mv.selected.endsWith(`:${muscleId}`)
        );

        if (!aMuscle || !bMuscle) return 0;

        if (
          aMuscle.value === bMuscle.value &&
          a.exercise?.muscleValues &&
          b.exercise?.muscleValues
        ) {
          return (
            a.exercise?.muscleValues.length - b.exercise?.muscleValues.length
          );
        }

        if (aMuscle.value < bMuscle.value) return -1;

        return 1;
      });

      return filteredExercises;
    },
    [exercises, heatmapLevel]
  );

  const showForEl = useCallback(
    (el: SVGGraphicsElement, px?: number, py?: number) => {
      if (!containerRef.current) return;

      // id → display name
      const key = normId(el.id); // includes -r/-l if present
      const muscleId = key.replace('-r', '').replace('-l', '');
      const muscleName = formatName(muscleId);

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
          if (prev.x === x && prev.y === y) return prev; // no-op
          return { ...prev, x, y };
        }
        // New muscle → compute exercises once
        return {
          show: true,
          x,
          y,
          id: key,
          name: muscleName,
          exercises: computeExercises(muscleId),
        };
      });
    },
    [computeExercises]
  );

  const clearHideTimer = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !containerRef.current) return;
    clearHideTimer();

    const svg = svgRef.current;
    const raw = e.target as Element;

    // Resolve a stable target:
    // 1) nearest filled <g>, or
    // 2) the hovered element itself if it has explicit fill,
    // 3) otherwise nothing (we'll maybe hide below).
    const group = findFilledGroup(raw, svg);
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
    clearHideTimer();
    setTip((t) => (t.show ? { ...t, show: false } : t));
  };

  // keyboard support: focus/blur show/hide tooltip
  const handleFocus = (e: React.FocusEvent<SVGSVGElement>) => {
    const el = (e.target as Element).closest<SVGGraphicsElement>('[id]');
    if (!el) return;
    // Only show for nodes that actually have/are within a filled region
    const svg = svgRef.current!;
    const group = findFilledGroup(el, svg);
    const target = group ?? (hasExplicitFill(el) ? el : null);
    if (target) showForEl(target); // centers on element
  };
  const handleBlur = () => handleMouseLeave();

  return (
    <Box
      ref={containerRef}
      component="span"
      sx={{
        position: 'relative',
        display: 'inline-block',
        flex: '0 0 auto',
        lineHeight: 0,
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        '& [tabindex]:focus:not(:focus-visible)': { outline: 'none' },
      }}
    >
      <Svg
        id={id}
        ref={svgRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        role="img"
        style={{ maxHeight: 500, display: 'block' }}
      />

      {tip.show && (
        <Box
          sx={{
            position: 'absolute',
            left: tip.x,
            top: tip.y,
            transform: 'translate(0, -100%)', // bottom-left at the cursor
            zIndex: 1000,
            pointerEvents: 'none', // <-- prevents flicker by not stealing the mouse
          }}
          aria-hidden
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            sx={{
              backgroundColor: theme.palette.background.paper,
              p: 1,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 3,
              borderRadius: 1,
              maxWidth: 260,
            }}
          >
            <Typography fontWeight={600} noWrap>
              {tip.name}
            </Typography>
            {tip.exercises.map((ex) => (
              <Typography key={ex.id} fontSize={14} noWrap>
                {ex.exercise?.name}
              </Typography>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
