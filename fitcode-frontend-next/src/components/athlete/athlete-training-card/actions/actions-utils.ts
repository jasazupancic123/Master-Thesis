import { TrainingService } from '@/controller/training/training.service';
import { TrainingComponent } from '@/controller/training/type/training-component.type';
import { Training } from '@/controller/training/type/training.type';
import dayjs from 'dayjs';

export const getDurationText = (training: Training) => {
  const from = new Date(training.from);
  const to = new Date(training.to);

  const durationMs = to.getTime() - from.getTime();
  const totalMinutes = Math.floor(durationMs / 1000 / 60);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const durationText = `${hours > 0 ? `${hours}h ` : ''}${minutes}min`;
  return durationText;
};

export const getNumExercises = (
  userId: string,
  components: TrainingComponent[]
) => {
  return components.reduce(
    (acc, component) =>
      acc +
      TrainingService.getSupersetsByAthlete(userId, component)
        .map((s) => s.exercises.length)
        .reduce((a, b) => a + b, 0),
    0
  );
};

export const checkIsActiveTraining = (training: Training) => {
  const now = dayjs();
  const from = dayjs(training.from);

  const isNowAM = now.hour() < 12;
  const isTrainingAM = from.hour() < 12;

  return isNowAM === isTrainingAM && now.isSame(from, 'day');
};
