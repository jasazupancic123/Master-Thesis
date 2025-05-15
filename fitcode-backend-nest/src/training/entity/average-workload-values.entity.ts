import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsString, IsNotEmpty, IsNumber, IsInt, ValidateNested } from "class-validator";
import { IntensityVolumeValues } from "./intensity-volume-values.type";

export class AverageWorkloadValues {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  exerciseId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  rootComponentId: string; // strength, speed, ...

  @IsInt()
  @ApiProperty()
  @Expose()
  numMembers: number;

  @ValidateNested()
  @Type(() => IntensityVolumeValues)
  @ApiProperty()
  @Expose()
  avgWorkloadValue: IntensityVolumeValues;
}
