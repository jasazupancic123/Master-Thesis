import { ComponentDto } from './component.dto';
import { PickType } from '@nestjs/mapped-types';

export class CreateComponentDto extends PickType(ComponentDto, ['name', 'parentId'] as const) {}