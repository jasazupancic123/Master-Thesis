import { PartialType } from '@nestjs/mapped-types';

import { CustomClaimsDto } from './custom-claims.dto';

export class UpdateUserClaimsDto extends PartialType(CustomClaimsDto) {}
