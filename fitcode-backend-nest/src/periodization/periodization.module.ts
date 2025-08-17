// src/periodization/periodization.module.ts
import { Module } from '@nestjs/common';

import { PeriodizationService } from './periodization.service';

@Module({
  providers: [PeriodizationService],
  exports: [PeriodizationService],
})
export class PeriodizationModule {}
