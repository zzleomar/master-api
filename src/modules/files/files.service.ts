import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {
  isValidBase64(base64: string): boolean {
    // El formato esperado comienza con "data:image" y contiene ";base64,"
    const validFormat = /^data:image\/[a-zA-Z]*;base64,/.test(base64);
    return validFormat;
  }
}
