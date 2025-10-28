import { core } from '@/core/core.service';
import { HeatmapLoad } from '@/core/exercise/type/heatmap-load.entity';
import { useEffect, useState } from 'react';
import { paintHeatmaps } from '../actions/actions-color-heatmap';
import { MuscleTip } from '@/core/exercise/type/muscle-tip.type';
import { MuscleLoadType } from '@/core/exercise/enum/muscle-load-type.enum';
import { TrainingExercise } from '@/core/training/type/training-exercise.type';

export default function useMuscleHeatmap(exercises: TrainingExercise[]) {
  const [heatmapLevel, setHeatmapLevel] = useState<number>(0);
  const [maxHeatmapLevel, setMaxHeatmapLevel] = useState<number>(0);

  const [muscleLoads, setMuscleLoads] = useState<[string, HeatmapLoad][]>([]);

  const [selectedLoadType, setSelectedLoadType] = useState<
    MuscleLoadType | 'ALL'
  >('ALL');

  const [tipHeatmapFront, setTipHeatmapFront] = useState<MuscleTip>({
    show: false,
    x: 0,
    y: 0,
    componentExercises: [],
    possibleExercises: [],
    focus: false,
  });

  const [tipHeatmapBack, setTipHeatmapBack] = useState<MuscleTip>({
    show: false,
    x: 0,
    y: 0,
    componentExercises: [],
    possibleExercises: [],
    focus: false,
  });

  useEffect(() => {
    if (tipHeatmapBack.show && tipHeatmapFront.show) {
      setTipHeatmapFront((prev) => ({ ...prev, show: false, focus: false }));
      setTipHeatmapBack((prev) => ({ ...prev, show: false, focus: false }));
    }
  }, [tipHeatmapFront, tipHeatmapBack]);

  useEffect(() => {
    const newHeatmapLevel = core.exercise.muscle.getHeatmapLevel(muscleLoads);
    setMaxHeatmapLevel(newHeatmapLevel);

    paintHeatmaps(muscleLoads, selectedLoadType);
  }, [muscleLoads, selectedLoadType]);

  useEffect(() => {
    // Generate muscle loads
    if (heatmapLevel > maxHeatmapLevel) return; // levels 1-3

    const loads = core.exercise.muscle.generateLoads(
      exercises,
      heatmapLevel,
      maxHeatmapLevel
    );

    setMuscleLoads(loads);
  }, [exercises, heatmapLevel, maxHeatmapLevel]);

  return {
    heatmapLevel,
    setHeatmapLevel,
    maxHeatmapLevel,
    setMaxHeatmapLevel,
    muscleLoads,
    setMuscleLoads,
    tipHeatmapFront,
    setTipHeatmapFront,
    tipHeatmapBack,
    setTipHeatmapBack,
    selectedLoadType,
    setSelectedLoadType,
  };
}
