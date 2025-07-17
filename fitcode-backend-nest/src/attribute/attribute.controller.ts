import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AttributeService } from './service/attribute.service';

@ApiTags('Attribute')
@Controller('attribute')
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @Get()
  async findAll() {
    return await this.attributeService.findAll();
  }
}
