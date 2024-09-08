import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ComponentService } from './component.service';
import { UpdateComponentDto } from './dto/update-component.dto';
import { Auth } from '../common/decorator/auth.decorator';
import { UserRole } from '../user/enum/user-role.enum';

@Controller('component')
export class ComponentController {
  constructor(private readonly componentService: ComponentService) {
  }

  @Get()
  async findAll() {
    return await this.componentService.findAllFlat({ populate: ['parents', 'children'] });
  }

  // TODO - create components and move exercises to new components
  // TODO - delete components and move exercises to another component
  // TODO - update component name and slug

  @Patch(':id')
  @Auth([UserRole.ADMIN])
  async update(@Body() body: UpdateComponentDto, @Param('id') id: string) {
    return await this.componentService.update(id, body);
  }
}
