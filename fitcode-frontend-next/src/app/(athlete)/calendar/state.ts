import { addMonths, subMonths } from 'date-fns';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { NavigateAction, View } from 'react-big-calendar';

import type { DateRange } from '@/common/type/date-range.type';
import type { SetState } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
import { TrainingController } from '@/controller/training/training.controller';

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
