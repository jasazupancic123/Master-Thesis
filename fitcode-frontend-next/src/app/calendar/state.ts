import { DateRange } from '@/common/type/date-range.type';
import { handleApiRequest, SetState } from '@/common/type/state.type';
import { TrainingController } from '@/controller/training/training.controller';
import { addMonths, subMonths } from 'date-fns';
import {
  Calendar,
  momentLocalizer,
  ToolbarProps,
  View,
  NavigateAction,
} from 'react-big-calendar';

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
  token: string,
  dateRange: DateRange
) {
  return handleApiRequest(
    () => TrainingController.findAll(token, { ...dateRange }),
    (_trainings) => {},
    undefined,
    'Failed to fetch trainings'
  );
}
