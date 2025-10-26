import { addMinutes } from 'date-fns';

import { MainSet } from '../enum/main-set.enum';
import type { TrainingComponent } from '../type/training-component.type';

export class TrainingComponentUtil {
  stub(id: string, data?: Partial<TrainingComponent>): TrainingComponent {
    return {
      id,
      from: data?.from || new Date(),
      to: data?.to || addMinutes(new Date(), 30),
      supersets: data?.supersets || [],
      subgroups: data?.subgroups || [],
      methodId: data?.methodId,
      mainSet: data?.mainSet || MainSet.BLOCK,
      target: data?.target || undefined,
      periodizationType: data?.periodizationType,
      copiedFrom: data?.copiedFrom,
      location: data?.location,
    };
  }
}
