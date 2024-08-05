import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { firestore } from 'firebase-admin';

export class BaseEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: firestore.Timestamp = firestore.Timestamp.now();

  @ApiProperty()
  updatedAt = firestore.Timestamp.now();
}