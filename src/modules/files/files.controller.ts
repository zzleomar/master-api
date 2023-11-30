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
// import * as fs from 'fs';
// import * as base64Img from 'base64-img';

import { FileCreateDto } from './files-create.dto';

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
  @Post('/')
  async laodFile(@Body() body: FileCreateDto) {
    const { base64, filename } = body;

    if (!this.filesService.isValidBase64(base64)) {
      throw new BadRequestException('Base64 inválido');
    }
    const buffer = Buffer.from(base64.replace(/^[^,]+,/, ''), 'base64');
    const extend = filename.split('.');
    let contentType = 'application/octet-stream';
    if (['png', 'jpg'].includes(extend[extend.length - 1])) {
      contentType = `image/${
        extend[extend.length - 1] === 'png' ? 'png' : 'jpeg'
      }`;
    }
    const now = new Date();
    const formattedDate = now.toISOString().replace(/[^0-9]/g, '');
    const params: S3.PutObjectRequest = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${formattedDate} ${filename}`, // Nombre de archivo en S3
      Body: buffer, // Datos binarios del archivo
      ContentEncoding: 'base64',
      ContentType: contentType,
      ACL: 'public-read',
    };

    try {
      await this.s3.upload(params).promise();
      const fileUrl = this.s3.getSignedUrl('getObject', {
        Bucket: params.Bucket,
        Key: params.Key,
      });
      const response = fileUrl.split('?');
      return { fileUrl: response[0] };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Error al cargar el archivo en S3.');
    }
  }
}
