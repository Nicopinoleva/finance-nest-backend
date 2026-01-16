import { BadRequestException, Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CreditCardStatementService } from './credit-card-statement.service';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreditCardStatementBanks } from 'src/utils/constants/credit-card-statement-banks.enum';
import { UploadBancoDeChileDto } from './dto/credit-card-statement-upload.dto';
import { ParsedStatement } from './credit-card-statement.interface';

@ApiTags('credit-card-statements')
@Controller('credit-card-statements')
export class CreditCardStatementController {
  constructor(private readonly creditCardStatementService: CreditCardStatementService) {}

  @Post('upload/banco-de-chile')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadBancoDeChileDto })
  async uploadBancoDeChileStatement(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadBancoDeChileDto,
  ): Promise<ParsedStatement> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    return await this.creditCardStatementService.parseCreditCardStatement(
      file,
      CreditCardStatementBanks.BancoDeChile,
      body.debugPdf,
      body.pathToSave,
    );
  }

  @Post('upload/lider-bci')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadBancoDeChileDto })
  async uploadLiderBciStatement(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadBancoDeChileDto,
  ): Promise<ParsedStatement> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    return await this.creditCardStatementService.parseCreditCardStatement(
      file,
      CreditCardStatementBanks.LiderBCI,
      body.debugPdf,
      body.pathToSave,
    );
  }
}
