import { forwardRef, Module } from '@nestjs/common';
import { ExerciseService } from './service/exercise.service';
import { ExerciseController } from './exercise.controller';
import { ComponentModule } from '../component/component.module';
import { ExerciseRepository } from './repository/exercise.repository';
import { UserModule } from '../user/user.module';
import { ExerciseAttributeRepository } from './repository/exercise-attribute.repository';
import { ExerciseAttributeService } from './service/exercise-attribute.service';
import { CacheManagerModule } from 'src/cache-manager/cache-manager.module';

@Module({
  imports: [forwardRef(() => UserModule), forwardRef(() => ComponentModule)],
  controllers: [ExerciseController],
  providers: [
    ExerciseAttributeRepository,
    ExerciseAttributeService,
    ExerciseRepository,
    ExerciseService,
  ],
  exports: [ExerciseAttributeService, ExerciseService],
})
export class ExerciseModule {}
