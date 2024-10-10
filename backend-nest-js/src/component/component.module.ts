import { forwardRef, Module } from '@nestjs/common';
import { ComponentService } from './component.service';
import { ComponentController } from './component.controller';
import { ExerciseModule } from '../exercise/exercise.module';
import { ComponentRepository } from './repository/component.repository';

@Module({
  imports: [forwardRef(() => ExerciseModule)],
  controllers: [ComponentController],
  providers: [ComponentRepository, ComponentService],
  exports: [ComponentService],
})
export class ComponentModule {}
