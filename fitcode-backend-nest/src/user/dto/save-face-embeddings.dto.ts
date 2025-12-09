import { IntersectionType, PickType } from '@nestjs/swagger';

import { UserIdDto } from '@src/common/dto/user-id.dto';

import { Profile } from '../entity/profile.entity';

export class SaveFaceEmbeddingsDto extends IntersectionType(
  PickType(Profile, ['faceEmbedding'] as const),
  UserIdDto,
) {}
