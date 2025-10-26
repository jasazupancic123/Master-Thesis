// src/periodization/periodization.module.ts
import { Module } from '@nestjs/common';

import { ExerciseModule } from '@src/exercise/exercise.module';

import { PeriodizationService } from './periodization.service';

@Module({
  imports: [ExerciseModule],
  providers: [PeriodizationService],
  exports: [PeriodizationService],
})
export class PeriodizationModule {}
