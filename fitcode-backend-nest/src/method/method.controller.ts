import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { User } from '../common/type/firebase-auth.type';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { Auth } from '../common/decorator/auth.decorator';
import { MethodService } from './service/method.service';
import { Create } from '../common/type/entity.type';
import { Method } from './entity/method.entity';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Method')
@Controller('method')
export class MethodController {
  constructor(private readonly methodService: MethodService) {}

  @Get()
  @Auth()
  async findAll(@RequestUser() user: User) {
    return this.methodService.findAll();
  }

  @Get(':methodId')
  @Auth()
  async findById(
    @RequestUser() user: User,
    @Param('methodId') methodId: string,
  ) {
    return this.methodService.findOneOrFail({ methodId });
  }

  @Post()
  @Auth()
  async create(@RequestUser() user: User, @Body() body: Create<Method>) {
    return this.methodService.create(user, body);
  }
}
