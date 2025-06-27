import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { User } from '../common/type/firebase-auth.type';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { Auth } from '../common/decorator/auth.decorator';
import { InstitutionService } from './service/institution.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UserRole } from '../user/enum/user-role.enum';
import { AddAthletesDto } from './dto/add-athletes.dto';
import { AddTrainersDto } from './dto/add-trainers.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Institution')
@Controller('institution')
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Get()
  @Auth()
  async findAll(@RequestUser() user: User) {
    return this.institutionService.findAll(user);
  }

  @Get(':institutionId')
  @Auth([UserRole.ADMIN, UserRole.TRAINER])
  async findById(@Param('institutionId') institutionId: string) {
    return this.institutionService.getDocByIdOrFail({ institutionId });
  }

  @Post()
  @Auth([UserRole.ADMIN])
  async create(@RequestUser() user: User, @Body() body: CreateInstitutionDto) {
    return this.institutionService.create(user, body);
  }

  @Post(':institutionId/athletes')
  @Auth([UserRole.MANAGER])
  async addAthletes(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() body: AddAthletesDto,
  ) {
    return this.institutionService.updateMembers(
      user,
      { institutionId },
      { add: true, memberIds: body.athleteIds, trainers: false },
    );
  }

  @Post(':institutionId/athletes/delete')
  @Auth([UserRole.MANAGER])
  async removeAthletes(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() body: AddAthletesDto,
  ) {
    return this.institutionService.updateMembers(
      user,
      { institutionId },
      { add: false, memberIds: body.athleteIds, trainers: false },
    );
  }

  @Post(':institutionId/trainers')
  @Auth([UserRole.MANAGER])
  async addTrainers(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() body: AddTrainersDto,
  ) {
    return this.institutionService.updateMembers(
      user,
      { institutionId },
      { add: true, memberIds: body.trainerIds, trainers: false },
    );
  }

  @Post(':institutionId/trainers/delete')
  @Auth([UserRole.MANAGER])
  async removeTrainers(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() body: AddTrainersDto,
  ) {
    return this.institutionService.updateMembers(
      user,
      { institutionId },
      { add: false, memberIds: body.trainerIds, trainers: false },
    );
  }
}
