import { Module } from '@nestjs/common';

import { ExerciseAiPrescriptionsController } from './exercise-ai-prescriptions.controller';
import { ExerciseAiPrescriptionsService } from './exercise-ai-prescriptions.service';
import { ExerciseAiPrescriptionsRepository } from './repository/exercise-ai-prescriptions.repository';

@Module({
  controllers: [ExerciseAiPrescriptionsController],
  providers: [
    ExerciseAiPrescriptionsRepository,
    ExerciseAiPrescriptionsService,
  ],
  exports: [ExerciseAiPrescriptionsService],
})
export class ExerciseAiPrescriptionsModule {}
