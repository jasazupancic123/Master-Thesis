import type { ExerciseParamField } from '../type/exercise-set.type';
import type { TrainingExercise } from '../type/training-exercise.type';
import { core } from '@/core/core.service';
import { SETS } from '@/core/exercise/constant/exercise-param.constant';
import { Methods } from '@/core/exercise/constant/method.constant';
import type { Method } from '@/core/exercise/type/method.type';

export class TrainingExerciseUtil {
  getMethod(exercise: TrainingExercise): Method | null {
    if (!exercise.methodId) return null;
    return Methods.find((m) => m.field === exercise.methodId) || null;
  }

  getMethodTooltip(exercise: TrainingExercise): string {
    const method = this.getMethod(exercise);
    if (!method) return '';

    const attributes = method.attributes || [];
    if (!attributes.length) return 'No specific abilities';

    const formatted = attributes.map((a) => {
      const param =
        a.field === 'sets'
          ? SETS
          : core.exercise.param.get(a.field as ExerciseParamField);

      if (!param) return a.field;

      const name = param.name[0].toLowerCase() + param.name.slice(1);

      if (a.disabled) return `${name} —`;
      if (a.pattern) {
        // make regex readable (e.g. [1-3]:[0-2] -> 1–3:0–2)
        const readable = a.pattern
          .replace(/\^|\$/g, '')
          .replace(/\[|\]/g, '')
          .replace(/\|/g, '–')
          .replace(/\+/g, '');

        return `${name} ${readable}`;
      }

      if (a.min !== undefined && a.max !== undefined)
        return a.min === a.max
          ? `${name} ${a.min}`
          : `${name} ${a.min}–${a.max}`;

      return a.field;
    });

    return `${method.name}: ${formatted.join(', ')}`;
  }
}
