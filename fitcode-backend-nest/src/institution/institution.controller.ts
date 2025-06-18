import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { User } from '../common/type/firebase-auth.type';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { Auth } from '../common/decorator/auth.decorator';
import { InstitutionService } from './service/institution.service';
import { CreateInstitutionDto } from './dto/create-insitution.dto';
import { UserRole } from '../user/enum/user-role.enum';
import { AddAthletesDto } from './dto/add-athletes.dto';
import { AddTrainersDto } from './dto/add-trainers.dto';

@Controller('institution')
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Get()
  @Auth()
  async findAll(@RequestUser() user: User) {
    return this.institutionService.findAll(user);
  }

  @Get(':institutionId')
  @Auth([UserRole.ADMIN])
  async findById(@Param('institutionId') institutionId: string) {
    return this.institutionService.findOneOrFail({ institutionId });
  }

  @Post()
  @Auth([UserRole.ADMIN])
  async create(@RequestUser() user: User, @Body() body: CreateInstitutionDto) {
    return this.institutionService.create(user, body);
  }

  @Post(':institutionId/athletes')
  @Auth([UserRole.TRAINER])
  async addAthletes(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() body: AddAthletesDto,
  ) {
    return this.institutionService.addAthletes(user, { institutionId }, body);
  }

  @Post(':institutionId/athletes/delete')
  @Auth([UserRole.TRAINER])
  async removeAthletes(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() body: AddAthletesDto,
  ) {
    return this.institutionService.removeAthletes(
      user,
      { institutionId },
      body,
    );
  }

  @Post(':institutionId/trainers')
  @Auth([UserRole.MANAGER])
  async addTrainers(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() body: AddTrainersDto,
  ) {
    return this.institutionService.addTrainers(user, { institutionId }, body);
  }

  @Post(':institutionId/trainers/delete')
  @Auth([UserRole.MANAGER])
  async removeTrainers(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() body: AddTrainersDto,
  ) {
    return this.institutionService.removeTrainers(
      user,
      { institutionId },
      body,
    );
  }
}
