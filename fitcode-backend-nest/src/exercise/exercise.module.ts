import { forwardRef, Module } from '@nestjs/common';
import { ExerciseService } from './service/exercise.service';
import { ExerciseController } from './exercise.controller';
import { ComponentModule } from '../component/component.module';
import { ExerciseRepository } from './repository/exercise.repository';
import { ExerciseAttributeValueRepository } from './repository/exercise-attribute-value.repository';
import { AttributeModule } from '../attribute/attribute.module';
import { TrainingModule } from '../training/training.module';
import { InstitutionModule } from '../institution/institution.module';

@Module({
  imports: [
    AttributeModule,
    InstitutionModule,
    forwardRef(() => ComponentModule),
    forwardRef(() => TrainingModule),
  ],
  controllers: [ExerciseController],
  providers: [
    ExerciseAttributeValueRepository,
    ExerciseRepository,
    ExerciseService,
  ],
  exports: [ExerciseService, ExerciseAttributeValueRepository],
})
export class ExerciseModule {}
