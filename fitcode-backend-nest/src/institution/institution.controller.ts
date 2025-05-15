import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommonService } from 'src/common/service/common.service';
import { User } from 'src/common/type/firebase-auth.type';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { Auth } from '../common/decorator/auth.decorator';
import { InstitutionService } from './service/institution.service';
import { CreateInstitutionDto } from './dto/create-insitution.dto';

@Controller('institution')
export class InstitutionController {
  constructor(
    private readonly commonService: CommonService,
    private readonly institutionService: InstitutionService,
  ) {}

  @Get()
  @Auth()
  async findAll(@RequestUser() user: User) {
    return this.institutionService.findAll(user);
  }

  @Get(':institutionId')
  @Auth()
  async findById(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
  ) {
    return this.institutionService.findOneOrFail(user, { institutionId });
  }

  @Get('user/:userId')
  @Auth()
  async findByTrainerId(
    @RequestUser() user: User,
    @Param('trainerId') trainerId: string,
  ) {
    return this.institutionService.findByTrainerId(user, { uid: trainerId });
  }

  @Post()
  @Auth()
  async create(
    @RequestUser() user: User,
    @Body() body: CreateInstitutionDto,
  ) {
    return this.institutionService.create(user, body);
  }
}
