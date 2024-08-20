import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CycleService } from './cycle.service';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { UpdateCycleDto } from './dto/update-cycle.dto';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { CustomClaims } from '../common/type/custom-claims.type';
import { Auth } from '../common/decorator/auth.decorator';
import { IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class AllCyclesFilter {
  @IsString()
  @Expose()
  groupId: string;
}

@Controller('cycle')
export class CycleController {
  constructor(private readonly cycleService: CycleService) {
  }

  @Post()
  @Auth()
  async create(
    @RequestUser() user: CustomClaims,
    @Body() createCycleDto: CreateCycleDto,
  ) {
    return await this.cycleService.create(user, createCycleDto);
  }

  @Get()
  @Auth()
  async findAll(
    @RequestUser() user: CustomClaims,
    @Query() query: AllCyclesFilter,
  ) {
    return await this.cycleService.findAll(user, query.groupId);
  }

  @Get(':id')
  @Auth()
  async findOne(
    @RequestUser() user: CustomClaims,
    @Param('id') id: string,
  ) {
    return await this.cycleService.findOneByIdOrFail(user, id);
  }

  @Patch(':id')
  @Auth()
  async update(
    @RequestUser() user: CustomClaims,
    @Param('id') id: string,
    @Body() data: UpdateCycleDto,
  ) {
    return await this.cycleService.update(user, id, data);
  }

  @Delete(':id')
  @Auth()
  async remove(
    @RequestUser() user: CustomClaims,
    @Param('id') id: string,
  ) {
    return await this.cycleService.remove(user, id);
  }
}
