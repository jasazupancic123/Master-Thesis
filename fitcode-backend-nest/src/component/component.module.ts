import { Module } from '@nestjs/common';

import { ComponentController } from './component.controller';
import { ComponentService } from './component.service';
import { ComponentRepository } from './repository/component.repository';

@Module({
  controllers: [ComponentController],
  providers: [ComponentRepository, ComponentService],
  exports: [ComponentRepository, ComponentService],
})
export class ComponentModule {}
