import { HEATMAP_COLORS } from '@/core/const/color.const';
import {
  HEATMAP_BACK_ID,
  HEATMAP_FRONT_ID,
} from '@/core/exercise/constant/heatmap.const';
import { MuscleLoadType } from '@/core/exercise/enum/muscle-load-type.enum';
import type { HeatmapLoad } from '@/core/exercise/type/heatmap-load.entity';

const getMuscleColor = (load: number) => {
  let color = undefined;

  if (load > 0 && load <= 2) color = HEATMAP_COLORS[0];
  else if (load > 2 && load <= 4) color = HEATMAP_COLORS[1];
  else if (load > 4 && load <= 6) color = HEATMAP_COLORS[2];
  else if (load > 6 && load <= 8) color = HEATMAP_COLORS[3];
  else if (load > 8 && load <= 9) color = HEATMAP_COLORS[4];
  else if (load > 9) color = HEATMAP_COLORS[5];

  return color;
};

export function paintHeatmaps(
  muscleLoads: [string, HeatmapLoad][] | [string, number][],
  selectedLoadType: 'ALL' | MuscleLoadType
) {
  // Limit to actual shapes
  const resetContainers = [HEATMAP_FRONT_ID, HEATMAP_BACK_ID];

  // Reset
  resetContainers.forEach((id) => {
    const container = document.getElementById(id);
    if (container) {
      container.querySelectorAll<HTMLElement>('*').forEach((el) => {
        el.style.setProperty('fill', 'transparent', 'important');
      });
    }
  });

  // Paint
  muscleLoads.forEach(([muscleType, muscleLoad]) => {
    const totalLoad =
      typeof muscleLoad === 'number'
        ? muscleLoad
        : selectedLoadType === MuscleLoadType.CONCENTRIC
          ? muscleLoad.concentric
          : selectedLoadType === MuscleLoadType.ECCENTRIC
            ? muscleLoad.eccentric
            : selectedLoadType === MuscleLoadType.ISOMETRIC
              ? muscleLoad.isometric
              : muscleLoad.eccentric +
                muscleLoad.isometric +
                muscleLoad.concentric;

    const color = getMuscleColor(totalLoad);
    if (!color) return;

    // Find the actual shapes by id
    const elements = document.querySelectorAll<HTMLElement>(
      `[id="${muscleType}"]`
    );
    if (!elements.length) return;

    elements.forEach((el) => {
      // If your id is on a <g>, paint its children shapes
      const isGroup = el.tagName.toLowerCase() === 'g';
      const targets = isGroup ? el.querySelectorAll<HTMLElement>('*') : [el];

      targets.forEach((t) => {
        t.style.setProperty('fill', color, 'important');
      });
    });
  });
}
