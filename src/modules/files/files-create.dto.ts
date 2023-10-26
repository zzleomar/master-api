import { IsBase64, IsString } from 'class-validator';

export class FileCreateDto {
  @IsString()
  base64: string;

  @IsString()
  filename: string;
}
