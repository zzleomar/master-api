import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { Admin, Cotizador, Master } from '../auth/utils/decorator';
import { AuthGuard } from '../auth/auth.guard';
import { S3 } from 'aws-sdk';

@Controller('files')
export class FilesController {
  private s3: S3;
  constructor(private readonly filesService: FilesService) {
    this.s3 = new S3({
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: 'us-east-1', // Reemplaza con tu región de S3
    });
  }

  @Cotizador()
  @Master()
  @Admin()
  @UseGuards(AuthGuard)
  @Post('/file')
  async laodFile(@Body() body: { base64: string; filename: string }) {
    const { base64, filename } = body;
    if (this.filesService.isValidBase64(base64)) {
      // Convierte el Base64 en datos binarios
      const buffer = Buffer.from(base64, 'base64');

      // Sube el archivo a S3
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: filename,
        Body: buffer,
      };

      try {
        await this.s3.upload(params).promise();
        const fileUrl = this.s3.getSignedUrl('getObject', {
          Bucket: params.Bucket,
          Key: params.Key,
        });
        return { fileUrl };
      } catch (error) {
        console.error(error);
        return new BadRequestException('Error al cargar el archivo en S3.');
      }
    } else {
      return new BadRequestException('Base64 invalido');
    }
  }
}
