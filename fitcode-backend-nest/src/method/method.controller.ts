import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { Create } from '../common/type/entity.type';
import { User } from '../common/type/firebase-auth.type';
import { Method } from './entity/method.entity';
import { MethodService } from './service/method.service';

@ApiTags('Method')
@Controller('method')
export class MethodController {
  constructor(private readonly methodService: MethodService) {}

  @Get()
  @Auth()
  async findAll() {
    return this.methodService.findAll();
  }

  @Get(':methodId')
  @Auth()
  async findById(@Param('methodId') methodId: string) {
    return this.methodService.findOneOrFail({ methodId });
  }

  @Post()
  @Auth()
  async create(@RequestUser() user: User, @Body() body: Create<Method>) {
    return this.methodService.create(user, body);
  }
}
