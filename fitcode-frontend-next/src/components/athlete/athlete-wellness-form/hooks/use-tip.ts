import { useState } from 'react';

import type { MuscleTip } from '@/controller/exercise/type/muscle-tip.type';

export default function useTip() {
  const [tipHeatmapFront, setTipHeatmapFront] = useState<MuscleTip>({
    show: false,
    x: 0,
    y: 0,
    focus: false,
  });

  const [tipHeatmapBack, setTipHeatmapBack] = useState<MuscleTip>({
    show: false,
    x: 0,
    y: 0,
    focus: false,
  });

  return {
    tipHeatmapFront,
    setTipHeatmapFront,
    tipHeatmapBack,
    setTipHeatmapBack,
  };
}
