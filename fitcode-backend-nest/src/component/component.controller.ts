import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ComponentService } from './component.service';

@ApiTags('Component')
@Controller('component')
export class ComponentController {
  constructor(private readonly componentService: ComponentService) {}

  @Get()
  async findAll() {
    return await this.componentService.findAllFlat();
  }

  // TODO - create components and move exercises to new components
  // TODO - delete components and move exercises to another component
  // TODO - update component name and slug
}
