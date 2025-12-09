import { PickType } from '@nestjs/swagger';

import { Profile } from '../entity/profile.entity';

export class SaveFaceEmbeddingsDto extends PickType(Profile, [
  'faceEmbedding',
] as const) {}
