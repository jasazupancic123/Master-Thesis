import { applyDecorators, UseInterceptors } from '@nestjs/common';

import { TimingInterceptor } from '../interceptor/timing.interceptor';

export function MeasureTime() {
  return applyDecorators(UseInterceptors(TimingInterceptor));
}
