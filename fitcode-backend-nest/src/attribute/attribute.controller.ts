import { Controller, Get } from '@nestjs/common';
import { AttributeService } from './service/attribute.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Attribute')
@Controller('attribute')
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @Get()
  async findAll() {
    return await this.attributeService.findAll();
  }
}
