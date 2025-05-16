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
  constructor(private readonly institutionService: InstitutionService) {}

  @Get()
  @Auth()
  async findAll(@RequestUser() user: User) {
    return this.institutionService.findAll(user);
  }

  @Get('/user')
  @Auth()
  async findAllByUser(@RequestUser() user: User) {
    return this.institutionService.findAllByUser(user);
  }

  @Get(':institutionId')
  @Auth()
  async findById(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
  ) {
    return this.institutionService.findOneOrFail(user, { institutionId });
  }

  @Post()
  @Auth()
  async create(@RequestUser() user: User, @Body() body: CreateInstitutionDto) {
    return this.institutionService.create(user, body);
  }

  @Post(':institutionId/athletes')
  @Auth()
  async addAthletes(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() body: { athleteIds: string[] },
  ) {
    return this.institutionService.addAthletes(user, { institutionId }, body);
  }

  @Post(':institutionId/remove/athletes')
  @Auth()
  async removeAthletes(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() body: { athleteIds: string[] },
  ) {
    return this.institutionService.removeAthletes(
      user,
      { institutionId },
      body,
    );
  }
}
