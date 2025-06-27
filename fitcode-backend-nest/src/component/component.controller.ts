import { Controller, Get } from '@nestjs/common';
import { ComponentService } from './component.service';
import { ApiTags } from '@nestjs/swagger';

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
