import { ApiProperty } from '@nestjs/swagger';

export class UploadBancoDeChileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: Express.Multer.File;

  @ApiProperty()
  debugPdf?: boolean;

  @ApiProperty()
  pathToSave?: string;
}
