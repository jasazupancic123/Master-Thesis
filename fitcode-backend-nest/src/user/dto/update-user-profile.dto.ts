import { PartialType } from '@nestjs/mapped-types';
import { UserEntity } from '../entity/user.entity';

export class UpdateUserProfileDto extends PartialType(UserEntity) {}
