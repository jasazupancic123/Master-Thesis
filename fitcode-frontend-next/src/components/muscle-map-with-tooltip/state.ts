import type { RefObject } from 'react';

import {
  HEATMAP_BACK_ID,
  HEATMAP_FRONT_ID,
} from '@/common/constant/heatmap.constant';

// normalize ids like `upper_pectoralis_major-l_3` → `upper_pectoralis_major-l`
export const normId = (id: string) => id.replace(/_\d+$/, '');

export const formatName = (id: string) =>
  id.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const hasExplicitFill = (el: Element) => {
  const fill = el.getAttribute('fill');

  if (!fill) return false;
  return fill !== 'none';
};

export const findFilledGroup = (
  start: Element,
  heatmapLevel: number,
  muscleIds?: string[]
): SVGGraphicsElement | null => {
  let i = 4; // because first element is path, which we skip, so it becomes 3 when going to <g>'s
  let el: Element | null = start;
  while (el) {
    if (
      el instanceof SVGGraphicsElement &&
      el.tagName.toLowerCase() === 'g' &&
      (i === heatmapLevel ||
        [HEATMAP_FRONT_ID, HEATMAP_BACK_ID].includes(
          el.parentElement?.id || ''
        )) &&
      (muscleIds
        ? muscleIds.includes(normId(el.id).replace('-r', '').replace('-l', ''))
        : true)
    ) {
      return el;
    }

    el = el.parentElement;
    i--;
  }
  return null;
};

export const clearHideTimer = (hideTimer: RefObject<number | null>) => {
  if (hideTimer.current) {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }
};
