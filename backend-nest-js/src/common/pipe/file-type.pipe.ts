import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class FileTypePipe implements PipeTransform {
  private readonly allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4'];

  transform(value: Express.Multer.File): Express.Multer.File {
    const extension = value.originalname.split('.').pop();
    if (!this.allowedExtensions.includes(extension))
      throw new BadRequestException('Invalid file type');

    return value;
  }
}