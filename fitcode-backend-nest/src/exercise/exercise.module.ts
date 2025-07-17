import { forwardRef, Module } from '@nestjs/common';

import { AttributeModule } from '../attribute/attribute.module';
import { ComponentModule } from '../component/component.module';
import { InstitutionModule } from '../institution/institution.module';
import { ExerciseController } from './exercise.controller';
import { ExerciseRepository } from './repository/exercise.repository';
import { ExerciseAttributeValueRepository } from './repository/exercise-attribute-value.repository';
import { ExerciseService } from './service/exercise.service';

@Module({
  imports: [
    AttributeModule,
    InstitutionModule,
    forwardRef(() => ComponentModule),
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
