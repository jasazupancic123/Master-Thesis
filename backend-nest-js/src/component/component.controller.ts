import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ComponentService } from './component.service';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { DecodedIdToken } from 'firebase-admin/auth';
import { UpdateComponentDto } from './dto/update-component.dto';
import { Auth } from '../common/decorator/auth.decorator';
import { UserRole } from '../user/enum/user-role.enum';

@Controller('component')
export class ComponentController {
  constructor(private readonly componentService: ComponentService) {}

  @Get()
  async findAll() {
    return await this.componentService.findAll();
  }

  @Patch(':id')
  @Auth([UserRole.ADMIN])
  async update(
    @RequestUser() user: DecodedIdToken,
    @Body() body: UpdateComponentDto,
    @Param('id') componentId: string
  ) {
    const id = await this.componentService.update(user.uid, componentId, body);
    return { id }
  }
}
