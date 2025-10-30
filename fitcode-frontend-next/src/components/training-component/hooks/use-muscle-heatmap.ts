import { useEffect, useState } from 'react';

import { paintHeatmaps } from '../actions/actions-color-heatmap';
import { core } from '@/core/core.service';
import type { MuscleLoadType } from '@/core/exercise/enum/muscle-load-type.enum';
import type { HeatmapLoad } from '@/core/exercise/type/heatmap-load.entity';
import type { MuscleTip } from '@/core/exercise/type/muscle-tip.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useGroup } from '@/store/group.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

export default function useMuscleHeatmap() {
  const { trainings } = useGroup();
  const { training, component, supersets, selectedAthlete } =
    useTrainerDayView();

  const [exercises, setExercises] = useState<TrainingExercise[]>([]);
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

  const trainingIndex = trainings.findIndex((t) => t.id === training?.id);
  const [range, setRange] = useState<number[]>([
    trainingIndex + 1,
    trainingIndex + 1,
  ]);

  useEffect(() => {
    setExercises(supersets.flatMap((s) => s.exercises));
  }, [component, supersets]);

  useEffect(() => {
    if (tipHeatmapBack.show && tipHeatmapFront.show) {
      setTipHeatmapFront((prev) => ({ ...prev, show: false, focus: false }));
      setTipHeatmapBack((prev) => ({ ...prev, show: false, focus: false }));
    }
  }, [tipHeatmapFront, tipHeatmapBack]);

  useEffect(() => {
    const newHeatmapLevel =
      core.exercise.muscle.getMaxHeatmapLevel(muscleLoads);
    setMaxHeatmapLevel(newHeatmapLevel);

    paintHeatmaps(muscleLoads, selectedLoadType);
  }, [muscleLoads, selectedLoadType, selectedAthlete, range, exercises]);

  /* Generate muscle loads */
  useEffect(() => {
    if (!training || !component) return;

    // Multiple trainings

    let filteredTrainings = trainings
      .filter((t, index) => {
        return index + 1 >= range[0] && index + 1 <= range[1];
      })
      .map((t) => (t.id === training.id ? training : t));

    if (selectedAthlete) {
      filteredTrainings = filteredTrainings.map((t) =>
        core.training.getAthleteTraining(selectedAthlete.uid, t)
      );
    }

    const trainingsLoads: [string, HeatmapLoad][][] = filteredTrainings.map(
      (t) => {
        const exercises = core.training.getExercises(t, {
          componentId: component.id,
        });

        return core.exercise.muscle.generateLoads(
          exercises,
          heatmapLevel,
          maxHeatmapLevel
        );
      }
    );

    // Combine all training loads
    let loads = trainingsLoads.reduce(
      (acc, curr) => {
        curr.forEach(([muscleId, load]) => {
          const existingLoad = acc.find(([id]) => id === muscleId);

          if (
            isNaN(load.eccentric) ||
            isNaN(load.isometric) ||
            isNaN(load.concentric)
          )
            return;

          if (existingLoad) {
            existingLoad[1].eccentric += load.eccentric;
            existingLoad[1].isometric += load.isometric;
            existingLoad[1].concentric += load.concentric;
          } else {
            acc.push([muscleId, { ...load }]);
          }
        });
        return acc;
      },
      [] as [string, HeatmapLoad][]
    );

    // Average across trainings
    loads = loads.map(([muscleId, load]) => {
      const count = Math.max(
        1,
        trainingsLoads.reduce((cnt, trainingLoad) => {
          const muscleLoad = trainingLoad.find(([id]) => id === muscleId);

          return (
            cnt +
            (muscleLoad &&
            muscleLoad[1].concentric +
              muscleLoad[1].eccentric +
              muscleLoad[1].isometric >
              0
              ? 1
              : 0)
          );
        }, 0)
      );

      return [
        muscleId,
        {
          eccentric: Math.round(load.eccentric / count),
          isometric: Math.round(load.isometric / count),
          concentric: Math.round(load.concentric / count),
        },
      ];
    });

    setMuscleLoads(loads);
  }, [
    exercises,
    heatmapLevel,
    maxHeatmapLevel,
    range,
    selectedAthlete,
    component,
    supersets,
  ]);

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
    range,
    setRange,
  };
}
