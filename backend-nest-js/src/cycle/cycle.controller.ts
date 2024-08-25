import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CycleService } from './cycle.service';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { UpdateCycleDto } from './dto/update-cycle.dto';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/custom-claims.type';
import { Auth } from '../common/decorator/auth.decorator';
import { FirebaseService } from '../firebase/firebase.service';
import { CycleFilterDto } from './dto/cycle-filter.dto';

@Controller('cycle')
export class CycleController {
  constructor(private readonly firebaseService: FirebaseService, private readonly cycleService: CycleService) {
  }

  @Post()
  @Auth()
  async create(@RequestUser() user: User, @Body() data: CreateCycleDto) {
    return await this.cycleService.create(user, data);
  }

  @Get()
  @Auth()
  async findAll(@RequestUser() user: User, @Query() query: CycleFilterDto) {
    return await this.cycleService.findAll(user, query);
  }

  @Get(':id')
  @Auth()
  async findOne(@RequestUser() user: User, @Param('id') id: string) {
    return await this.cycleService.findOneByIdOrFail(user, id);
  }

  @Patch(':id')
  @Auth()
  async update(@RequestUser() user: User, @Body() data: UpdateCycleDto, @Param('id') id: string) {
    return await this.cycleService.update(user, id, data);
  }
}
