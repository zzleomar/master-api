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
    const params: S3.PutObjectRequest = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filename, // Nombre de archivo en S3
      Body: buffer, // Datos binarios del archivo
      ContentEncoding: 'base64',
      ContentType: 'application/octet-stream',
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
      throw new BadRequestException('Error al cargar el archivo en S3.');
    }
  }

  // @Cotizador()
  // @Master()
  // @Admin()
  // @UseGuards(AuthGuard)
  // @Post('/image')
  // async laodImage(@Body() body: FileCreateDto) {
  //   const { base64, filename } = body;
  //   if (this.filesService.isValidBase64(base64)) {
  //     const uploadToS3 = (base64: string, filename: string) => {
  //       return new Promise((resolve, reject) => {
  //         base64Img.img(base64, '', filename, async (err, path) => {
  //           if (err) {
  //             reject(
  //               new BadRequestException('Error al cargar el archivo en S3.'),
  //             );
  //           } else {
  //             // Sube el archivo a S3
  //             const now = new Date();
  //             const formattedDate = now.toISOString().replace(/[^0-9]/g, '');
  //             console.log(path, 'path');
  //             const extend = path.split('.');
  //             const params = {
  //               Bucket: process.env.AWS_BUCKET_NAME,
  //               Key: `${formattedDate} ${filename}`,
  //               Body: fs.createReadStream(path),
  //               ContentType: `image/${
  //                 extend[extend.length - 1] === 'png' ? 'png' : 'jpeg'
  //               }`,
  //             };

  //             try {
  //               await this.s3.upload(params).promise();
  //               const fileUrl = this.s3.getSignedUrl('getObject', {
  //                 Bucket: params.Bucket,
  //                 Key: params.Key,
  //               });
  //               resolve({ fileUrl });
  //             } catch (error) {
  //               console.error(error);
  //               reject(
  //                 new BadRequestException('Error al cargar el archivo en S3.'),
  //               );
  //             }
  //           }
  //         });
  //       });
  //     };
  //     const result = await uploadToS3(base64, filename);
  //     return result;
  //   } else {
  //     return new BadRequestException('Base64 inválido');
  //   }
  // }
}
