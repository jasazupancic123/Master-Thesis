import { addMonths, subMonths } from 'date-fns';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { NavigateAction, View } from 'react-big-calendar';

import { TrainingController } from '@/core/training/training.controller';
import type { DateRange } from '@/lib/common/type/date-range.type';
import type { SetState } from '@/lib/common/type/state.type';
import { handleApiRequest } from '@/lib/common/type/state.type';

export function handleNavigate(
  newDate: Date,
  _view: View,
  action: NavigateAction,
  setCurrentDate: SetState<Date>
) {
  // handle navigation (next & back)
  if (action === 'NEXT') setCurrentDate((prev) => addMonths(prev, 1));
  else if (action === 'PREV') setCurrentDate((prev) => subMonths(prev, 1));
  else setCurrentDate(new Date()); // reset to today
}

export async function fetchAthleteTrainings(
  dateRange: DateRange,
  state: {
    router: AppRouterInstance;
  }
) {
  const { router } = state;
  const controller = TrainingController.getInstance();

  return handleApiRequest(
    router,
    () => controller.findAll({ ...dateRange }),
    (_trainings) => {},
    undefined,
    'Failed to fetch trainings'
  );
}
