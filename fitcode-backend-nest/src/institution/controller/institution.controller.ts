import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserRole } from '@src/auth/enum/user-role.enum';
import { Auth } from '@src/common/decorator/auth.decorator';
import { RequestUser } from '@src/common/decorator/request-user.decorator';
import { FirebaseUser } from '@src/common/type/firebase-auth.type';

import { CreateInstitutionDto } from '../dto/create-institution.dto';
import { UpdateInstitutionDto } from '../dto/update-institution.dto';
import { InstitutionService } from '../service/institution.service';

@ApiTags('Institution')
@Controller('institution')
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Get all institutions for user' })
  async findAll(@RequestUser() user: FirebaseUser) {
    return await this.institutionService.findAll(user);
  }

  @Get(':institutionId')
  @Auth()
  @ApiOperation({ summary: 'Get institution by id' })
  async init(
    @RequestUser() user: FirebaseUser,
    @Param('institutionId') institutionId: string,
  ) {
    return await this.institutionService.init(user, institutionId);
  }

  @Post()
  @Auth([UserRole.ADMIN])
  async create(
    @RequestUser() user: FirebaseUser,
    @Body() body: CreateInstitutionDto,
  ) {
    return await this.institutionService.create(user, body);
  }

  @Patch(':institutionId')
  @Auth([UserRole.MANAGER])
  async update(
    @RequestUser() user: FirebaseUser,
    @Param('institutionId') institutionId: string,
    @Body() body: UpdateInstitutionDto,
  ) {
    return await this.institutionService.update(user, { institutionId }, body);
  }
}
