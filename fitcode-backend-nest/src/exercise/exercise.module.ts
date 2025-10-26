import { forwardRef, Module } from '@nestjs/common';

import { AttributeModule } from '../attribute/attribute.module';
import { ComponentModule } from '../component/component.module';
import { InstitutionModule } from '../institution/institution.module';
import { ExerciseController } from './exercise.controller';
import { ExerciseRepository } from './repository/exercise.repository';
import { ExerciseService } from './service/exercise.service';
import { ExerciseAttributeService } from './service/exercise-attribute.service';
import { ExerciseParamService } from './service/exercise-param.service';

@Module({
  imports: [
    AttributeModule,
    InstitutionModule,
    forwardRef(() => ComponentModule),
  ],
  controllers: [ExerciseController],
  providers: [
    ExerciseParamService,
    ExerciseRepository,
    ExerciseService,
    ExerciseAttributeService,
  ],
  exports: [ExerciseService, ExerciseAttributeService, ExerciseParamService],
})
export class ExerciseModule {}
