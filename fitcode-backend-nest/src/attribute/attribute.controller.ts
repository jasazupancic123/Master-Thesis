import { Controller, Get } from '@nestjs/common';
import { AttributeService } from './service/attribute.service';

@Controller('attribute')
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @Get()
  async findAll() {
    return await this.attributeService.findAll();
  }
}
