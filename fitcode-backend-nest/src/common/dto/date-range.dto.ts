import { Type } from 'class-transformer';

export class DateRangeDto {
  @Type(() => Date)
  from: Date;

  @Type(() => Date)
  to: Date;
}
