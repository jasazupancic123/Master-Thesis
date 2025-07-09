import { Module } from '@nestjs/common';
import { ComponentController } from './component.controller';
import { ComponentRepository } from './repository/component.repository';
import { ComponentService } from './component.service';

@Module({
  controllers: [ComponentController],
  providers: [ComponentRepository, ComponentService],
  exports: [ComponentRepository, ComponentService],
})
export class ComponentModule {}
