import { forwardRef, HttpException, HttpStatus, Inject, Injectable, Scope } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import {
  CreditCardStatementCoordinates,
  CutRegion,
  ParsedStatement,
  RegionBounds,
  Transaction,
  TransactionCategory,
  TransactionCoordinatesWithPadding,
  TransactionsCoordinates,
} from './credit-card-statement.interface';
import { ExpensesService } from '@modules/expenses/expenses/expenses.service';
import { CreditCardStatementReferencesEnum } from 'src/utils/constants/credit-card-statement-references.enum';
import { parse } from 'date-fns';
import { CreditCardStatement } from '@entities/credit-card-statement/credit-card-statement.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentMethodsService } from '@modules/payment-methods/payment-methods/payment-methods.service';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import {
  CreditCardStatementBanks,
  extractTextFromCoordinates,
  findTextCoordinates,
  matchMultipleTextWithPattern,
  matchTextWithPattern,
  normalizeDateString,
  parseAmount,
  PaymentMethodTypesEnum,
} from '@utils';
import { BankParseConfiguration, PaymentMethod } from '@entities';

interface TotalMatch {
  amount: string;
  parsedAmount: number;
  index: number;
  category?: string;
}

@Injectable({ scope: Scope.REQUEST })
export class CreditCardStatementService {
  private creditCardStatementPDF: PDFDocument;
  private bankToParse: CreditCardStatementBanks;
  private readonly creditCardStatementCoordinates: CreditCardStatementCoordinates = {
    transactionsTable: {
      coordinates: [],
      text: '',
    },
    transactionsEnd: {
      coordinates: [],
      text: '',
    },
    mainCreditCardText: {
      coordinates: [],
      text: '',
    },
    dueDateCoordinates: {
      coordinates: [],
      text: '',
    },
    dueAmountCoordinates: {
      coordinates: [],
      text: '',
    },
    minimumPaymentCoordinates: {
      coordinates: [],
      text: '',
    },
    unbilledStatementsTableStartCoordinates: {
      coordinates: [],
      text: '',
    },
  };
  constructor(
    @InjectRepository(CreditCardStatement)
    private readonly creditCardStatementRepository: Repository<CreditCardStatement>,
    private readonly paymentMethodService: PaymentMethodsService,
    @Inject(forwardRef(() => ExpensesService))
    private readonly expensesService: ExpensesService,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  async parseCreditCardStatement(
    file: Express.Multer.File,
    bankToParse: CreditCardStatementBanks,
    renderDebugPdf?: boolean,
    filePath?: string,
  ): Promise<ParsedStatement> {
    try {
      this.creditCardStatementPDF = await PDFDocument.load(file.buffer);
    } catch (error) {
      if (error.message.includes('encrypted') || error.message.includes('password')) {
        throw new HttpException('Pdf con contraseña no es soportado', HttpStatus.UNPROCESSABLE_ENTITY);
      }
    }
    this.bankToParse = bankToParse;
    await this.textCoordinateFindConfig(file);

    // Optionally render debug PDF
    if (renderDebugPdf) {
      await this.generateTransactionRegionsPdf(file, filePath);
    }

    return await this.extractAndParseTransactions(file);
  }

  async textCoordinateFindConfig(file: Express.Multer.File) {
    const config = await this.txHost.tx.findOneOrFail(BankParseConfiguration, {
      where: {
        bank: { name: this.bankToParse },
        paymentMethodType: { name: PaymentMethodTypesEnum.CreditCard },
      },
    });

    if (!config.configuration) {
      throw new HttpException(
        `No se encontró configuración de parseo para ${this.bankToParse}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const configKeys = Object.keys(config.configuration) as Array<keyof CreditCardStatementCoordinates>;

    for (const key of configKeys) {
      const coordinateConfig = config.configuration[key];

      if (coordinateConfig && typeof coordinateConfig === 'object') {
        const text = coordinateConfig.text ?? '';
        const stopOnFirstMatch = coordinateConfig.stopOnFirstMatch ?? true;

        this.creditCardStatementCoordinates[key] = {
          ...coordinateConfig,
          text,
          coordinates: await findTextCoordinates(file, text, this.creditCardStatementPDF, stopOnFirstMatch),
        } as TransactionCoordinatesWithPadding;
      }
    }
  }

  async extractAndParseTransactions(file: Express.Multer.File): Promise<ParsedStatement> {
    const pdfDoc = this.creditCardStatementPDF;
    const pages = pdfDoc.getPages();

    // TODO: Maybe its possible to extract all text in one sweep instead of multiple calls
    const mainCreditCardText = await extractTextFromCoordinates(
      file.buffer,
      this.creditCardStatementCoordinates.mainCreditCardText.coordinates[0].page,
      this.creditCardStatementPDF,
      Math.trunc(this.creditCardStatementCoordinates.mainCreditCardText.coordinates[0].y),
      Math.trunc(
        this.creditCardStatementCoordinates.mainCreditCardText.coordinates[0].y +
          this.creditCardStatementCoordinates.mainCreditCardText.coordinates[0].height -
          3,
      ),
    );

    let billingPeriodStartEndText = [];

    if (this.creditCardStatementCoordinates.billingPeriodStartEnd) {
      const billingPeriod = await extractTextFromCoordinates(
        file.buffer,
        this.creditCardStatementCoordinates.billingPeriodStartEnd.coordinates[0].page,
        this.creditCardStatementPDF,
        Math.trunc(this.creditCardStatementCoordinates.billingPeriodStartEnd.coordinates[0].y),
        Math.trunc(
          this.creditCardStatementCoordinates.billingPeriodStartEnd.coordinates[0].y +
            this.creditCardStatementCoordinates.billingPeriodStartEnd.coordinates[0].height,
        ),
        Math.trunc(
          this.creditCardStatementCoordinates.billingPeriodStartEnd.coordinates[0].x +
            this.creditCardStatementCoordinates.billingPeriodStartEnd.coordinates[0].width +
            (this.creditCardStatementCoordinates.billingPeriodStartEnd.startXPadding ?? 0),
        ),
        Math.trunc(
          this.creditCardStatementCoordinates.billingPeriodStartEnd.coordinates[0].x +
            this.creditCardStatementCoordinates.billingPeriodStartEnd.coordinates[0].width +
            (this.creditCardStatementCoordinates.billingPeriodStartEnd.endXPadding ?? 0),
        ),
      );
      billingPeriodStartEndText.push(billingPeriod);
    } else if (
      this.creditCardStatementCoordinates.billingPeriodStart &&
      this.creditCardStatementCoordinates.billingPeriodEnd
    ) {
      const billingPeriodStartText = await extractTextFromCoordinates(
        file.buffer,
        this.creditCardStatementCoordinates.billingPeriodStart.coordinates[0].page,
        this.creditCardStatementPDF,
        Math.trunc(
          this.creditCardStatementCoordinates.billingPeriodStart.coordinates[0].y +
            (this.creditCardStatementCoordinates.billingPeriodStart.startYPadding ?? 0),
        ),
        Math.trunc(
          this.creditCardStatementCoordinates.billingPeriodStart.coordinates[0].y +
            this.creditCardStatementCoordinates.billingPeriodStart.coordinates[0].height +
            (this.creditCardStatementCoordinates.billingPeriodStart.endYPadding ?? 0),
        ),
        Math.trunc(
          this.creditCardStatementCoordinates.billingPeriodStart.coordinates[0].x +
            this.creditCardStatementCoordinates.billingPeriodStart.coordinates[0].width +
            (this.creditCardStatementCoordinates.billingPeriodStart.startXPadding ?? 0),
        ),
        Math.trunc(
          this.creditCardStatementCoordinates.billingPeriodStart.coordinates[0].x +
            this.creditCardStatementCoordinates.billingPeriodStart.coordinates[0].width +
            (this.creditCardStatementCoordinates.billingPeriodStart.endXPadding ?? 0),
        ),
      );
      const billingPeriodEndText = await extractTextFromCoordinates(
        file.buffer,
        this.creditCardStatementCoordinates.billingPeriodEnd.coordinates[0].page,
        this.creditCardStatementPDF,
        Math.trunc(
          this.creditCardStatementCoordinates.billingPeriodEnd.coordinates[0].y +
            (this.creditCardStatementCoordinates.billingPeriodEnd.startYPadding ?? 0),
        ),
        Math.trunc(
          this.creditCardStatementCoordinates.billingPeriodEnd.coordinates[0].y +
            this.creditCardStatementCoordinates.billingPeriodEnd.coordinates[0].height +
            (this.creditCardStatementCoordinates.billingPeriodEnd.endYPadding ?? 0),
        ),
        Math.trunc(
          this.creditCardStatementCoordinates.billingPeriodEnd.coordinates[0].x +
            this.creditCardStatementCoordinates.billingPeriodEnd.coordinates[0].width +
            (this.creditCardStatementCoordinates.billingPeriodEnd.startXPadding ?? 0),
        ),
        Math.trunc(
          this.creditCardStatementCoordinates.billingPeriodEnd.coordinates[0].x +
            this.creditCardStatementCoordinates.billingPeriodEnd.coordinates[0].width +
            (this.creditCardStatementCoordinates.billingPeriodEnd.endXPadding ?? 0),
        ),
      );
      billingPeriodStartEndText.push(billingPeriodStartText, billingPeriodEndText);
    }

    const dueDateTexts: string[] = [];

    for (const coord of this.creditCardStatementCoordinates.dueDateCoordinates.coordinates) {
      dueDateTexts.push(
        await extractTextFromCoordinates(
          file.buffer,
          coord.page,
          this.creditCardStatementPDF,
          Math.trunc(coord.y + (this.creditCardStatementCoordinates.dueDateCoordinates.startYPadding ?? 0)),
          Math.trunc(
            coord.y + coord.height + (this.creditCardStatementCoordinates.dueDateCoordinates.endYPadding ?? 0),
          ),
          Math.trunc(coord.x + (this.creditCardStatementCoordinates.dueDateCoordinates.startXPadding ?? 0)),
          Math.trunc(coord.x + coord.width + (this.creditCardStatementCoordinates.dueDateCoordinates.endXPadding ?? 0)),
        ),
      );
    }

    const dueAmountText = await extractTextFromCoordinates(
      file.buffer,
      this.creditCardStatementCoordinates.dueAmountCoordinates.coordinates[0].page,
      this.creditCardStatementPDF,
      Math.trunc(this.creditCardStatementCoordinates.dueAmountCoordinates.coordinates[0].y),
      Math.trunc(
        this.creditCardStatementCoordinates.dueAmountCoordinates.coordinates[0].y +
          this.creditCardStatementCoordinates.dueAmountCoordinates.coordinates[0].height +
          (this.creditCardStatementCoordinates.dueAmountCoordinates.endYPadding ?? 0),
      ),
      Math.trunc(
        this.creditCardStatementCoordinates.dueAmountCoordinates.coordinates[0].x +
          (this.creditCardStatementCoordinates.dueAmountCoordinates.startXPadding ?? 0),
      ),
      Math.trunc(
        this.creditCardStatementCoordinates.dueAmountCoordinates.coordinates[0].x +
          this.creditCardStatementCoordinates.dueAmountCoordinates.coordinates[0].width +
          (this.creditCardStatementCoordinates.dueAmountCoordinates.endXPadding ?? 0),
      ),
    );

    const minimumPaymentCoordinatesText = await extractTextFromCoordinates(
      file.buffer,
      this.creditCardStatementCoordinates.minimumPaymentCoordinates.coordinates[0].page,
      this.creditCardStatementPDF,
      Math.trunc(this.creditCardStatementCoordinates.minimumPaymentCoordinates.coordinates[0].y),
      Math.trunc(
        this.creditCardStatementCoordinates.minimumPaymentCoordinates.coordinates[0].y +
          this.creditCardStatementCoordinates.minimumPaymentCoordinates.coordinates[0].height +
          (this.creditCardStatementCoordinates.minimumPaymentCoordinates.endYPadding ?? 0),
      ),
    );

    let previousStatementDebt: number | string = '';

    if (this.creditCardStatementCoordinates.previousStatementDebtCoordinates) {
      const previousStatementDebtCoordinatesText = await extractTextFromCoordinates(
        file.buffer,
        this.creditCardStatementCoordinates.previousStatementDebtCoordinates.coordinates[0].page,
        this.creditCardStatementPDF,
        Math.trunc(this.creditCardStatementCoordinates.previousStatementDebtCoordinates.coordinates[0].y),
        Math.trunc(
          this.creditCardStatementCoordinates.previousStatementDebtCoordinates.coordinates[0].y +
            this.creditCardStatementCoordinates.previousStatementDebtCoordinates.coordinates[0].height +
            (this.creditCardStatementCoordinates.previousStatementDebtCoordinates.endYPadding ?? 0),
        ),
        Math.trunc(
          this.creditCardStatementCoordinates.previousStatementDebtCoordinates.coordinates[0].x +
            this.creditCardStatementCoordinates.previousStatementDebtCoordinates.coordinates[0].width +
            (this.creditCardStatementCoordinates.previousStatementDebtCoordinates.startXPadding ?? 0),
        ),
        Math.trunc(
          this.creditCardStatementCoordinates.previousStatementDebtCoordinates.coordinates[0].x +
            this.creditCardStatementCoordinates.previousStatementDebtCoordinates.coordinates[0].width +
            (this.creditCardStatementCoordinates.previousStatementDebtCoordinates.endXPadding ?? 0),
        ),
      );
      previousStatementDebt = previousStatementDebtCoordinatesText;
    } else if (
      this.creditCardStatementCoordinates.previousStatementBilledAmountCoordinates &&
      this.creditCardStatementCoordinates.previousStatementPaidAmountCoordinates
    ) {
      const previousStatementBilledAmountText = await extractTextFromCoordinates(
        file.buffer,
        this.creditCardStatementCoordinates.previousStatementBilledAmountCoordinates.coordinates[0].page,
        this.creditCardStatementPDF,
        Math.trunc(
          this.creditCardStatementCoordinates.previousStatementBilledAmountCoordinates.coordinates[0].y +
            (this.creditCardStatementCoordinates.previousStatementBilledAmountCoordinates.startYPadding ?? 0),
        ),
        Math.trunc(
          this.creditCardStatementCoordinates.previousStatementBilledAmountCoordinates.coordinates[0].y +
            this.creditCardStatementCoordinates.previousStatementBilledAmountCoordinates.coordinates[0].height +
            (this.creditCardStatementCoordinates.previousStatementBilledAmountCoordinates.endYPadding ?? 0),
        ),
        Math.trunc(
          this.creditCardStatementCoordinates.previousStatementBilledAmountCoordinates.coordinates[0].x +
            (this.creditCardStatementCoordinates.previousStatementBilledAmountCoordinates.startXPadding ?? 0),
        ),
        Math.trunc(
          this.creditCardStatementCoordinates.previousStatementBilledAmountCoordinates.coordinates[0].x +
            this.creditCardStatementCoordinates.previousStatementBilledAmountCoordinates.coordinates[0].width +
            (this.creditCardStatementCoordinates.previousStatementBilledAmountCoordinates.endXPadding ?? 0),
        ),
      );
      const previousStatementBilledAmount = parseAmount(
        new RegExp(/\$\s*(-?[\d.,]+)/).exec(previousStatementBilledAmountText)?.[0] ?? '',
      );

      const previousStatementPaidAmountText = await extractTextFromCoordinates(
        file.buffer,
        this.creditCardStatementCoordinates.previousStatementPaidAmountCoordinates.coordinates[0].page,
        this.creditCardStatementPDF,
        Math.trunc(
          this.creditCardStatementCoordinates.previousStatementPaidAmountCoordinates.coordinates[0].y +
            (this.creditCardStatementCoordinates.previousStatementPaidAmountCoordinates.startYPadding ?? 0),
        ),
        Math.trunc(
          this.creditCardStatementCoordinates.previousStatementPaidAmountCoordinates.coordinates[0].y +
            this.creditCardStatementCoordinates.previousStatementPaidAmountCoordinates.coordinates[0].height +
            (this.creditCardStatementCoordinates.previousStatementPaidAmountCoordinates.endYPadding ?? 0),
        ),
        Math.trunc(
          this.creditCardStatementCoordinates.previousStatementPaidAmountCoordinates.coordinates[0].x +
            (this.creditCardStatementCoordinates.previousStatementPaidAmountCoordinates.startXPadding ?? 0),
        ),
        Math.trunc(
          this.creditCardStatementCoordinates.previousStatementPaidAmountCoordinates.coordinates[0].x +
            this.creditCardStatementCoordinates.previousStatementPaidAmountCoordinates.coordinates[0].width +
            (this.creditCardStatementCoordinates.previousStatementPaidAmountCoordinates.endXPadding ?? 0),
        ),
      );

      const previousStatementPaidAmount = parseAmount(
        new RegExp(/\$\s*(-?[\d.,]+)/).exec(previousStatementPaidAmountText)?.[0] ?? '',
      );

      // Its added because paid amount is negative
      previousStatementDebt = previousStatementBilledAmount + previousStatementPaidAmount;
    }
    const allTransactionsText: string[] = [];

    // Extract text from all transaction regions
    for (const item of this.creditCardStatementCoordinates.transactionsTable.coordinates) {
      const targetPage = pages[item.page];
      const { height: pageHeight } = targetPage.getSize();

      const bounds = this.calculateRegionBounds(
        item.page,
        this.creditCardStatementCoordinates.transactionsEnd.coordinates[0].page,
        pageHeight,
        this.creditCardStatementCoordinates.transactionsEnd.coordinates[0],
      );

      const regionText = await extractTextFromCoordinates(
        file.buffer,
        item.page,
        this.creditCardStatementPDF,
        item.y + bounds.top,
        pageHeight - bounds.bottom,
      );

      allTransactionsText.push(regionText);
    }

    if (this.bankToParse === CreditCardStatementBanks.BancoDeChile) {
      return this.parseTransactionTextBancoDeChile(
        [mainCreditCardText],
        billingPeriodStartEndText,
        dueDateTexts,
        [dueAmountText],
        [minimumPaymentCoordinatesText],
        [previousStatementDebt as string],
        allTransactionsText.join('\n'),
      );
    } else if (this.bankToParse === CreditCardStatementBanks.LiderBCI) {
      return this.parseTransactionTextLiderBci(
        [mainCreditCardText],
        billingPeriodStartEndText,
        dueDateTexts,
        [dueAmountText],
        [minimumPaymentCoordinatesText],
        previousStatementDebt as number,
        allTransactionsText.join('\n'),
      );
    } else {
      throw new HttpException('Banco no soportado para parseo de estado de cuenta', HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  // TODO: Atomize to smaller functions
  @Transactional()
  async parseTransactionTextBancoDeChile(
    mainCreditCard: string[],
    billingPeriodStartEnd: string[],
    dueDateText: string[],
    dueAmountText: string[],
    minimumPaymentCoordinatesText: string[],
    previousStatementDebtCoordinatesText: string[],
    allTransactionsText: string,
  ): Promise<ParsedStatement> {
    const transactionsMap: Map<string, TransactionCategory> = new Map();
    let totalPayments = 0;
    let totalTransactions = 0;
    let totalPAT = 0;
    let totalInstallments = 0;
    let totalCharges = 0;
    let totalUnbilledInstallments = 0;

    let mainCreditCardNumberMatch: RegExpExecArray | null = null;
    let billingPeriodMatchStartEnd: RegExpMatchArray | null = null;
    let dueDateMatch: RegExpExecArray | null = null;
    let dueAmountMatch: RegExpExecArray | null = null;
    let minimumPaymentMatch: RegExpExecArray | null = null;
    let previousStatementDebtMatch: RegExpExecArray | null = null;

    for (const text of mainCreditCard) {
      const match = new RegExp(/\d{4}(?=\D*$)/).exec(text);
      if (match) {
        mainCreditCardNumberMatch = match;
        break;
      }
    }

    if (!mainCreditCardNumberMatch) {
      throw new HttpException(
        'No se pudo extraer el número de tarjeta de crédito principal',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    for (const text of billingPeriodStartEnd) {
      const match = text.match(/\d{2}[-/]\d{2}[-/]\d{4}/g);
      if (match) {
        billingPeriodMatchStartEnd = match;
        break;
      }
    }

    if (!billingPeriodMatchStartEnd) {
      throw new HttpException('No se pudo extraer el período facturado', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    for (const text of dueDateText) {
      const match = new RegExp(/\d{2}\/\d{2}\/\d{4}/).exec(text);
      if (match) {
        dueDateMatch = match;
        break;
      }
    }

    if (!dueDateMatch) {
      throw new HttpException('No se pudo extraer la fecha de vencimiento', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    for (const text of dueAmountText) {
      const match = new RegExp(/\$\s*(-?[\d.,]+)/).exec(text);
      if (match) {
        dueAmountMatch = match;
        break;
      }
    }
    if (!dueAmountMatch) {
      throw new HttpException('No se pudo extraer el monto a pagar', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    for (const text of minimumPaymentCoordinatesText) {
      const match = new RegExp(/\$\s*(-?[\d.,]+)/).exec(text);
      if (match) {
        minimumPaymentMatch = match;
        break;
      }
    }
    if (!minimumPaymentMatch) {
      throw new HttpException('No se pudo extraer el pago mínimo', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    for (const text of previousStatementDebtCoordinatesText) {
      const match = new RegExp(/\s*(-?[\d.,]+)/).exec(text);
      if (match) {
        previousStatementDebtMatch = match;
        break;
      }
    }
    if (!previousStatementDebtMatch) {
      throw new HttpException(
        'No se pudo extraer el monto de la deuda del estado de cuenta anterior',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const creditCards = await this.txHost.tx.find(PaymentMethod, {
      select: {
        id: true,
        name: true,
      },
      where: {
        createdById: 'c3983079-8ad2-4057-aa26-5418e1003563',
      },
    });

    const creditCardsMap = new Map<string, PaymentMethod>();
    for (const card of creditCards) {
      if (!creditCardsMap.has(card.name)) {
        creditCardsMap.set(card.name, card);
      }
    }

    const mainCreditCardId = creditCardsMap.get(mainCreditCardNumberMatch[0])?.id;

    if (!mainCreditCardId) {
      throw new HttpException(
        `Tarjeta de crédito terminada en "${mainCreditCardNumberMatch[0]}" no encontrada.`,
        HttpStatus.NOT_FOUND,
      );
    }
    const billingPeriodStart = parse(normalizeDateString(billingPeriodMatchStartEnd[0]), 'dd-MM-yyyy', new Date());
    const billingPeriodEnd = parse(normalizeDateString(billingPeriodMatchStartEnd[1]), 'dd-MM-yyyy', new Date());

    const checkRepeatedStatement = await this.creditCardStatementRepository.exists({
      where: {
        creditCardId: mainCreditCardId,
        billingPeriodStart: billingPeriodStart,
        billingPeriodEnd: billingPeriodEnd,
      },
    });

    if (checkRepeatedStatement) {
      throw new HttpException('Estado de cuenta ya existe', HttpStatus.NOT_ACCEPTABLE);
    }

    const totalPaymentsMatch = new RegExp(/TOTAL PAGOS A LA CUENTA[^$]*\$\s*(-?[\d.,]+)/).exec(allTransactionsText);

    const totalPATMatch = new RegExp(/TOTAL PAT A LA CUENTA[^$]*\$\s*(-?[\d.,]+)/).exec(allTransactionsText);

    let totalInstallmentsMatch: RegExpExecArray | null = null;
    const totalInstallmentsRegexes = [
      /TOTAL COMPRAS EN CUOTAS A LA CUENTA[^$]*\$\s*(-?[\d.,]+)/,
      /TOTAL TRANSACCIONES EN CUOTAS [^$]*\$\s*(-?[\d.,]+)/,
    ];
    for (const regex of totalInstallmentsRegexes) {
      const match = regex.exec(allTransactionsText);
      if (match) {
        totalInstallmentsMatch = match;
        break;
      }
    }

    // In banco de chile, in the new format, the totals are at the end of the tables. To identify the charges table, we first find the start of the table
    const totalChargesTableStartMatch = new RegExp(/3.CARGOS, COMISIONES, IMPUESTOS Y ABONOS/).exec(
      allTransactionsText,
    );
    if (!totalChargesTableStartMatch) {
      throw new HttpException(
        'No se pudo obtener el inicio de la tabla de cargos y comisiones',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // There are two checks for retrocompatibility with previous banco de chile statements formats.
    // 2nd is for older one
    let totalChargesMatch: RegExpExecArray | null = null;
    const totalChargesRegexes = [
      /TOTAL CARGOS, COMISIONES, IMPUESTOS Y ABONOS[^$]*\$\s*(-?[\d.,]+)/,
      /CARGOS, COMISIONES[^$]*\$\s*(-?[\d.,]+)/,
    ];

    for (const regex of totalChargesRegexes) {
      const match = regex.exec(allTransactionsText);
      if (match) {
        totalChargesMatch = match;
        break;
      }
    }

    if (!totalChargesMatch) {
      throw new HttpException('No se pudo extraer el total de cargos y comisiones', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    let totalUnbilledInstallmentsMatch = new RegExp(/4.INFORMACION COMPRAS EN CUOTAS[^$]*\$\s*(-?[\d.,]+)/).exec(
      allTransactionsText,
    );

    if (
      !totalUnbilledInstallmentsMatch &&
      this.creditCardStatementCoordinates.unbilledStatementsTableStartCoordinates.coordinates.length > 0
    ) {
      totalUnbilledInstallmentsMatch = new RegExp(/4.INFORMACIÓN COMPRAS EN CUOTAS[^$]*\$\s*(-?[\d.,]+)/).exec(
        allTransactionsText,
      );
    }

    // To identify multiple cards
    const cardTotalPattern = /TOTAL TARJETA ([X\s-]+?\d{4})[^$]*\$\s*(-?[\d.,]+)/g;
    const cardMatches = allTransactionsText.matchAll(cardTotalPattern);
    const creditCardsMatches = Array.from(cardMatches).reduce<
      {
        number: string;
        parsedTotal: number;
        index: number;
      }[]
    >((accumulator, match) => {
      if (creditCardsMap.has(match[1].slice(-4))) {
        accumulator.push({
          number: match[1],
          parsedTotal: parseAmount(match[2]),
          index: match.index,
        });
      } else {
        throw new HttpException(
          `Tarjeta de crédito terminada en "${match[1]}" no encontrada.`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      return accumulator;
    }, []);

    // Sort credit cards by their position in text
    creditCardsMatches.sort((a, b) => a.index - b.index);

    const parsedTotalOperations =
      (totalPaymentsMatch ? parseAmount(totalPaymentsMatch[1]) : 0) +
      (totalPATMatch ? parseAmount(totalPATMatch[1]) : 0) +
      creditCardsMatches.reduce((sum, card) => sum + card.parsedTotal, 0) +
      parseAmount(totalInstallmentsMatch?.[1] ?? '0');

    const parsedTotalCharges = parseAmount(totalChargesMatch[1]);
    const parsedTotalUnbilledInstallments = totalUnbilledInstallmentsMatch
      ? parseAmount(totalUnbilledInstallmentsMatch[1])
      : 0;

    const location = String.raw`([A-Z]+(?:\s+[A-Z]+)*)?`; // Uppercase words with spaces, optional
    const date = String.raw`\d{2}/\d{2}/\d{2}`; // DD/MM/YY
    const installments = String.raw`\d{2}/\d{2}`; // MM/MM
    const referenceCode = String.raw`\d{12}`; // 12 digits
    const description = String.raw`[^$]+?`; // Any text until $
    const amount = String.raw`-?[\d.,]+`; // Number with optional minus
    const whitespace = String.raw`\s+`;
    const optionalWhitespace = String.raw`\s*`;

    // Build the transaction pattern
    const transactionPattern = new RegExp(
      `${location}${whitespace}` + // Location
        `(${date})${whitespace}` + // Date
        `(${referenceCode})${whitespace}` + // Reference code
        `(${description})${whitespace}` + // Description
        `\\$${optionalWhitespace}(${amount})${whitespace}` + // Operation amount
        `\\$${optionalWhitespace}(${amount})${whitespace}` + // Total amount
        `(${installments})${whitespace}` + // Installment date
        `\\$${optionalWhitespace}(${amount})`, // Monthly amount
      'g',
    );

    const transactionMatches = allTransactionsText.matchAll(transactionPattern);

    for (const match of transactionMatches) {
      const [, location, date, code, description, operationAmount, totalAmount, installments, monthlyAmount] = match;

      const transactionIndex = match.index;
      const parsedMonthlyAmount = parseAmount(monthlyAmount);
      const parsedOperationAmount = parseAmount(operationAmount);
      const parsedTotalAmount = parseAmount(totalAmount);

      const [parsedCurrentInstallment, parsedTotalInstallments] = installments
        .split('/')
        .map((installment) => Number.parseInt(installment));

      const transaction: Transaction = {
        location: location || 'N/A',
        date: date,
        referenceCode: code,
        description: description.trim(),
        operationAmount: parsedOperationAmount,
        totalAmount: parsedTotalAmount,
        currentInstallment: parsedCurrentInstallment,
        totalInstallments: parsedTotalInstallments,
        monthlyAmount: parsedMonthlyAmount,
        reference: '',
        creditCard: '',
      };

      // The totals always appear at the end of the statement, so we can use their position to categorize transactions
      if (totalPaymentsMatch && totalPaymentsMatch.index > transactionIndex) {
        totalPayments += parsedMonthlyAmount;
        this.addTransactionToCategory(
          transactionsMap,
          { ...transaction, reference: CreditCardStatementReferencesEnum.PAYMENT },
          totalPayments,
          parsedMonthlyAmount,
        );
      } else if (totalPATMatch && totalPATMatch.index > transactionIndex) {
        totalPAT += parsedMonthlyAmount;
        this.addTransactionToCategory(
          transactionsMap,
          { ...transaction, reference: CreditCardStatementReferencesEnum.PAT },
          totalPAT,
          parsedMonthlyAmount,
        );
      } else if (
        creditCardsMatches.some((card) => {
          if (card.index > transactionIndex) {
            this.addTransactionToCategory(
              transactionsMap,
              { ...transaction, creditCard: card.number, reference: CreditCardStatementReferencesEnum.TRANSACTION },
              card.parsedTotal,
              parsedMonthlyAmount,
            );
            return true;
          }
        })
      ) {
        totalTransactions += parsedMonthlyAmount;
      } else if (totalInstallmentsMatch && totalInstallmentsMatch.index > transactionIndex) {
        totalInstallments += parsedMonthlyAmount;
        this.addTransactionToCategory(
          transactionsMap,
          { ...transaction, reference: CreditCardStatementReferencesEnum.INSTALLMENT },
          totalInstallments,
          parsedMonthlyAmount,
        );
      }
      // In banco de chile, unbilled staments table does not always appear
      else if (totalUnbilledInstallmentsMatch) {
        if (totalUnbilledInstallmentsMatch.index > transactionIndex) {
          totalCharges += parsedMonthlyAmount;
          this.addTransactionToCategory(
            transactionsMap,
            { ...transaction, reference: CreditCardStatementReferencesEnum.CHARGE },
            totalCharges,
            parsedMonthlyAmount,
          );
        } else if (totalUnbilledInstallmentsMatch.index < transactionIndex) {
          // For some reason, unbilled statements total uses operation amount instead of monthly amount
          totalUnbilledInstallments += parsedOperationAmount;
          this.addTransactionToCategory(
            transactionsMap,
            { ...transaction, reference: CreditCardStatementReferencesEnum.UNBILLED_INSTALLMENT },
            totalUnbilledInstallments,
            parsedMonthlyAmount,
          );
        }
      } else if (totalChargesTableStartMatch && totalChargesTableStartMatch.index < transactionIndex) {
        // Charges do not have end total, so we assume they appear after all cards
        totalCharges += parsedMonthlyAmount;
        this.addTransactionToCategory(
          transactionsMap,
          { ...transaction, reference: CreditCardStatementReferencesEnum.CHARGE },
          totalCharges,
          parsedMonthlyAmount,
        );
      }
    }

    const totalCalculatedOperations = totalPayments + totalTransactions + totalPAT + totalInstallments;

    if (parsedTotalOperations !== totalCalculatedOperations) {
      throw new HttpException(
        `Operaciones parseadas no coinciden con el total parseado: ${parsedTotalOperations} !== ${totalCalculatedOperations}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    } else if (parsedTotalCharges !== totalCharges) {
      throw new HttpException(
        `Los cargos parseados no coinciden con el total parseado: ${parsedTotalCharges} !== ${totalCharges}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    } else if (parsedTotalUnbilledInstallments !== totalUnbilledInstallments) {
      throw new HttpException(
        `Los cargos no facturados parseados no coinciden con el total parseado: ${parsedTotalUnbilledInstallments} !== ${totalUnbilledInstallments}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const parsedStatement = await this.txHost.tx.save(CreditCardStatement, {
      creditCardId: mainCreditCardId,
      billingPeriodStart: billingPeriodStart,
      billingPeriodEnd: billingPeriodEnd,
      dueDate: parse(dueDateMatch[0], 'dd/MM/yyyy', new Date()),
      dueAmount: parseAmount(dueAmountMatch[1]),
      minimumPayment: parseAmount(minimumPaymentMatch[1]),
      previousStatementDebt: parseAmount(previousStatementDebtMatch[1]),
      totalOperations: totalCalculatedOperations,
      totalPayments,
      totalPAT,
      totalTransactions,
      totalInstallments,
      totalCharges,
      totalUnbilledInstallments: totalUnbilledInstallments > 0 ? totalUnbilledInstallments : null,
      createdById: 'c3983079-8ad2-4057-aa26-5418e1003563',
    });

    await this.expensesService.saveParsedExpensesFromCreditCardStatement({
      ...parsedStatement,
      creditCardStatementId: parsedStatement.id,
      mainCreditCard: mainCreditCardNumberMatch[0],
      transactions: Object.fromEntries(transactionsMap),
    });

    return {
      ...parsedStatement,
      creditCardStatementId: parsedStatement.id,
      mainCreditCard: mainCreditCardNumberMatch[0],
      transactions: Object.fromEntries(transactionsMap),
    };
  }

  @Transactional()
  async parseTransactionTextLiderBci(
    mainCreditCard: string[],
    billingPeriodStartEnd: string[],
    dueDateText: string[],
    dueAmountText: string[],
    minimumPaymentCoordinatesText: string[],
    previousStatementDebt: number,
    allTransactionsText: string,
  ): Promise<ParsedStatement> {
    const transactionsMap: Map<string, TransactionCategory> = new Map();

    const mainCreditCardNumberMatch = matchTextWithPattern(mainCreditCard, new RegExp(/\d{4}(?=\D*$)/));
    if (!mainCreditCardNumberMatch) {
      throw new HttpException(
        'No se pudo extraer el número de tarjeta de crédito principal',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const billingPeriodMatchStartEnd: string[] = matchMultipleTextWithPattern(
      billingPeriodStartEnd,
      new RegExp(/\d{2}[-/]\d{2}[-/]\d{4}/g),
    );
    if (billingPeriodMatchStartEnd.length === 0) {
      throw new HttpException('No se pudo extraer el período facturado', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const dueDateMatch: RegExpExecArray | null = matchTextWithPattern(dueDateText, new RegExp(/\d{2}\/\d{2}\/\d{4}/));
    if (!dueDateMatch) {
      throw new HttpException('No se pudo extraer la fecha de vencimiento', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const dueAmountMatch: RegExpExecArray | null = matchTextWithPattern(dueAmountText, new RegExp(/\$\s*(-?[\d.,]+)/));
    if (!dueAmountMatch) {
      throw new HttpException('No se pudo extraer el monto a pagar', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const minimumPaymentMatch: RegExpExecArray | null = matchTextWithPattern(
      minimumPaymentCoordinatesText,
      new RegExp(/\$\s*(-?[\d.,]+)/),
    );
    if (!minimumPaymentMatch) {
      throw new HttpException('No se pudo extraer el pago mínimo', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const creditCardsMap = await this.paymentMethodService.getActivePaymentMethodsMap(
      'c3983079-8ad2-4057-aa26-5418e1003563',
    );

    const mainCreditCardId = creditCardsMap.get(mainCreditCardNumberMatch[0])?.id;

    if (!mainCreditCardId) {
      throw new HttpException(
        `Tarjeta de crédito terminada en "${mainCreditCardNumberMatch[0]}" no encontrada.`,
        HttpStatus.NOT_FOUND,
      );
    }
    const billingPeriodStart = parse(normalizeDateString(billingPeriodMatchStartEnd[0]), 'dd-MM-yyyy', new Date());
    const billingPeriodEnd = parse(normalizeDateString(billingPeriodMatchStartEnd[1]), 'dd-MM-yyyy', new Date());

    const checkRepeatedStatement = await this.checkIfStatementExists(
      mainCreditCardId,
      billingPeriodStart,
      billingPeriodEnd,
    );

    if (checkRepeatedStatement) {
      throw new HttpException('Estado de cuenta ya existe', HttpStatus.NOT_ACCEPTABLE);
    }

    const {
      categorizedTotals,
      liderMatch,
      otrosComerciosMatch,
      productosServiciosMatch,
      cargosComisionesMatch,
      pagoMatch,
    } = this.categorizeLiderBciTotals(allTransactionsText);

    const { liderParsedTotals, otrosComerciosParsedTotals, cargosParsedTotals, pagoParsedTotals } = categorizedTotals;

    const location = String.raw`([A-Z]+(?:\s+[A-Z]+)*)?`; // Uppercase words with spaces, optional
    const date = String.raw`\d{2}/\d{2}/\d{4}`; // DD/MM/YYYY (not YY!)
    const installments = String.raw`\d{2}/\d{2}`; // MM/MM
    const description = String.raw`[^$]+?`; // Any text until $
    const amount = String.raw`[-]?\d{1,3}(?:\.\d{3})*`; // Number with periods as thousands separator
    const whitespace = String.raw`\s+`;
    const optionalWhitespace = String.raw`\s*`;

    // Transaction pattern for items with (T) or (A) markers
    const transactionPattern = new RegExp(
      String.raw`${location}${whitespace}` +
        String.raw`(${date})${whitespace}` +
        String.raw`(${description})${whitespace}` +
        String.raw`\$${optionalWhitespace}(${amount})` +
        String.raw`(?:${whitespace}\$${optionalWhitespace}(${amount})${whitespace}(${installments})${whitespace}\$${optionalWhitespace}(${amount}))?`, // Optional installment info
      'g',
    );

    const transactionMatches = allTransactionsText.matchAll(transactionPattern);

    const {
      totalLiderMain,
      totalLiderAdditional,
      totalOtrosComerciosMain,
      totalOtrosComerciosAdditional,
      totalCargosComisiones,
      totalPago,
      totalInstallments,
    } = this.categorizeLiderBciTransactions(
      transactionMatches,
      {
        liderMatch,
        otrosComerciosMatch,
        productosServiciosMatch,
        cargosComisionesMatch,
        pagoMatch,
      },
      categorizedTotals,
      transactionsMap,
    );

    liderParsedTotals.forEach((total, index) => {
      const isMainCard = index === 0;
      const expectedTotal = isMainCard ? totalLiderMain : totalLiderAdditional;
      const cardType = isMainCard ? 'Principal' : 'Adicional';

      if (total.parsedAmount !== expectedTotal) {
        throw new HttpException(
          `Total de LIDER (${cardType}) no coincide: ${total.parsedAmount} !== ${expectedTotal}`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    });
    otrosComerciosParsedTotals.forEach((total, index) => {
      const isMainCard = index === 0;
      const expectedTotal = isMainCard ? totalOtrosComerciosMain : totalOtrosComerciosAdditional;
      const cardType = isMainCard ? 'Principal' : 'Adicional';

      if (total.parsedAmount !== expectedTotal) {
        throw new HttpException(
          `Total de OTROS COMERCIOS (${cardType}) no coincide: ${total.parsedAmount} !== ${expectedTotal}`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    });

    if (cargosParsedTotals[0] && cargosParsedTotals[0].parsedAmount !== totalCargosComisiones) {
      throw new HttpException(
        `Total de CARGOS Y COMISIONES no coincide: ${cargosParsedTotals[0].parsedAmount} !== ${totalCargosComisiones}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (pagoParsedTotals[0] && pagoParsedTotals[0].parsedAmount !== totalPago) {
      throw new HttpException(
        `Total de PAGO no coincide: ${pagoParsedTotals[0].parsedAmount} !== ${totalPago}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const parsedStatement = await this.txHost.tx.save(CreditCardStatement, {
      creditCardId: mainCreditCardId,
      billingPeriodStart: billingPeriodStart,
      billingPeriodEnd: billingPeriodEnd,
      dueDate: parse(dueDateMatch[0], 'dd/MM/yyyy', new Date()),
      dueAmount: parseAmount(dueAmountMatch[1]),
      minimumPayment: parseAmount(minimumPaymentMatch[1]),
      previousStatementDebt: previousStatementDebt,
      totalOperations: totalLiderMain + totalLiderAdditional + totalOtrosComerciosMain + totalOtrosComerciosAdditional,
      totalPayments: totalPago,
      totalPAT: 0,
      totalTransactions:
        totalLiderMain + totalLiderAdditional + totalOtrosComerciosMain + totalOtrosComerciosAdditional,
      totalInstallments,
      totalCharges: totalCargosComisiones,
      totalUnbilledInstallments: null,
      createdById: 'c3983079-8ad2-4057-aa26-5418e1003563',
    });

    await this.expensesService.saveParsedExpensesFromCreditCardStatement({
      ...parsedStatement,
      creditCardStatementId: parsedStatement.id,
      mainCreditCard: mainCreditCardNumberMatch[0],
      transactions: Object.fromEntries(transactionsMap),
    });

    return {
      ...parsedStatement,
      creditCardStatementId: parsedStatement.id,
      mainCreditCard: mainCreditCardNumberMatch[0],
      transactions: Object.fromEntries(transactionsMap),
    };
  }

  private categorizeLiderBciTransactions(
    transactionMatches: RegExpStringIterator<RegExpExecArray>,
    totalsMatches: {
      liderMatch: RegExpExecArray | null;
      otrosComerciosMatch: RegExpExecArray | null;
      productosServiciosMatch: RegExpExecArray | null;
      cargosComisionesMatch: RegExpExecArray | null;
      pagoMatch: RegExpExecArray | null;
    },
    categorizedTotals: {
      liderParsedTotals: TotalMatch[];
      otrosComerciosParsedTotals: TotalMatch[];
      cargosParsedTotals: TotalMatch[];
      pagoParsedTotals: TotalMatch[];
    },
    transactionsMap: Map<string, TransactionCategory>,
  ) {
    let totalLiderMain = 0;
    let totalLiderAdditional = 0;
    let totalOtrosComerciosMain = 0;
    let totalOtrosComerciosAdditional = 0;
    let totalCargosComisiones = 0;
    let totalInstallments = 0;
    let totalPago = 0;

    const { liderParsedTotals, otrosComerciosParsedTotals, cargosParsedTotals, pagoParsedTotals } = categorizedTotals;
    const { liderMatch, otrosComerciosMatch, productosServiciosMatch, cargosComisionesMatch, pagoMatch } =
      totalsMatches;

    for (const match of transactionMatches) {
      const [, location, date, description, operationAmount, totalAmount, installments, monthlyAmount] = match;

      const transactionIndex = match.index;
      const parsedOperationAmount = parseAmount(operationAmount);

      // Determine if it's a regular (T) or additional card (A) transaction
      const isAdditionalCard = description.includes('(A)');

      // Parse installment data if present
      let parsedCurrentInstallment = 1;
      let parsedTotalInstallments = 1;
      let parsedMonthlyAmount = parsedOperationAmount;
      let parsedTotalAmount = parsedOperationAmount;

      if (installments && monthlyAmount && totalAmount) {
        [parsedCurrentInstallment, parsedTotalInstallments] = installments
          .split('/')
          .map((installment) => Number.parseInt(installment));
        parsedMonthlyAmount = parseAmount(monthlyAmount);
        parsedTotalAmount = parseAmount(totalAmount);
        totalInstallments += parsedMonthlyAmount;
      }

      const transaction: Transaction = {
        location: location || 'N/A',
        date: date,
        description: description.trim(),
        operationAmount: parsedOperationAmount,
        totalAmount: parsedTotalAmount,
        currentInstallment: parsedCurrentInstallment,
        totalInstallments: parsedTotalInstallments,
        monthlyAmount: parsedMonthlyAmount,
        reference: '',
        referenceCode: '',
        creditCard: isAdditionalCard ? 'ADDITIONAL' : 'MAIN',
      };

      // Categorize based on position relative to totals
      if (
        liderMatch &&
        otrosComerciosMatch &&
        transactionIndex >= liderMatch.index &&
        transactionIndex < otrosComerciosMatch.index
      ) {
        if (isAdditionalCard) {
          this.addAdditionalCardTransactionToLiderBciCategory(
            liderParsedTotals,
            transactionIndex,
            parsedMonthlyAmount,
            transactionsMap,
            transaction,
            { totalLiderMain, totalLiderAdditional },
          );
          totalLiderAdditional += parsedMonthlyAmount;
        } else {
          this.addMainCardTransactionToLiderBciCategory(
            liderParsedTotals,
            transactionIndex,
            parsedMonthlyAmount,
            transactionsMap,
            transaction,
            { totalLiderMain, totalLiderAdditional },
          );
          totalLiderMain += parsedMonthlyAmount;
        }
      } else if (
        otrosComerciosMatch &&
        productosServiciosMatch &&
        transactionIndex >= otrosComerciosMatch.index &&
        transactionIndex < productosServiciosMatch.index
      ) {
        if (isAdditionalCard) {
          this.addAdditionalCardTransactionToOtrosComerciosCategory(
            otrosComerciosParsedTotals,
            transactionIndex,
            parsedMonthlyAmount,
            transactionsMap,
            transaction,
            { totalOtrosComerciosMain, totalOtrosComerciosAdditional },
          );
          totalOtrosComerciosAdditional += parsedMonthlyAmount;
        } else {
          this.addMainCardTransactionToOtrosComerciosCategory(
            otrosComerciosParsedTotals,
            transactionIndex,
            parsedMonthlyAmount,
            transactionsMap,
            transaction,
            { totalOtrosComerciosMain, totalOtrosComerciosAdditional },
          );
          totalOtrosComerciosMain += parsedMonthlyAmount;
        }
      } else if (
        cargosComisionesMatch &&
        transactionIndex >= cargosComisionesMatch.index &&
        transactionIndex < pagoMatch!.index - 20
      ) {
        totalCargosComisiones += parsedMonthlyAmount;

        this.addTransactionToCategory(
          transactionsMap,
          { ...transaction, reference: CreditCardStatementReferencesEnum.CHARGE },
          cargosParsedTotals[0]?.parsedAmount || 0,
          parsedMonthlyAmount,
        );
      } else if (pagoMatch && transactionIndex >= pagoMatch.index - 20) {
        totalPago += parsedMonthlyAmount;

        this.addTransactionToCategory(
          transactionsMap,
          { ...transaction, reference: CreditCardStatementReferencesEnum.PAYMENT },
          pagoParsedTotals[0]?.parsedAmount || 0,
          parsedMonthlyAmount,
        );
      }
    }
    return {
      totalLiderMain,
      totalLiderAdditional,
      totalOtrosComerciosMain,
      totalOtrosComerciosAdditional,
      totalCargosComisiones,
      totalInstallments,
      totalPago,
    };
  }

  private parseLiderBciInstallmentTransaction(
    parsedOperationAmount: number,
    installments: string | undefined,
    monthlyAmount: string | undefined,
    totalAmount: string | undefined,
    totalInstallments: number,
  ) {
    let parsedCurrentInstallment = 1;
    let parsedTotalInstallments = 1;
    let parsedMonthlyAmount = parsedOperationAmount;
    let parsedTotalAmount = parsedOperationAmount;

    if (installments && monthlyAmount && totalAmount) {
      [parsedCurrentInstallment, parsedTotalInstallments] = installments
        .split('/')
        .map((installment) => Number.parseInt(installment));
      parsedMonthlyAmount = parseAmount(monthlyAmount);
      parsedTotalAmount = parseAmount(totalAmount);
      totalInstallments += parsedMonthlyAmount;
    }
    return {
      parsedCurrentInstallment,
      parsedTotalInstallments,
      parsedMonthlyAmount,
      parsedTotalAmount,
      totalInstallments,
    };
  }

  private addMainCardTransactionToLiderBciCategory(
    liderParsedTotals: TotalMatch[],
    transactionIndex: number,
    parsedMonthlyAmount: number,
    transactionsMap: Map<string, TransactionCategory>,
    transaction: Transaction,
    totals: { totalLiderMain: number; totalLiderAdditional: number },
  ) {
    // Find the main card total (first total in LIDER section)
    const mainTotal = liderParsedTotals.find((t) => t.index > transactionIndex);
    totals.totalLiderMain += parsedMonthlyAmount;

    this.addTransactionToCategory(
      transactionsMap,
      { ...transaction, reference: CreditCardStatementReferencesEnum.TRANSACTION },
      mainTotal?.parsedAmount || 0,
      parsedMonthlyAmount,
    );
  }

  private addAdditionalCardTransactionToLiderBciCategory(
    liderParsedTotals: TotalMatch[],
    transactionIndex: number,
    parsedMonthlyAmount: number,
    transactionsMap: Map<string, TransactionCategory>,
    transaction: Transaction,
    totals: { totalLiderMain: number; totalLiderAdditional: number },
  ) {
    // Find the additional card total (second total in LIDER section)
    const additionalTotal = liderParsedTotals.find((t) => t.index > transactionIndex);
    totals.totalLiderAdditional += parsedMonthlyAmount;

    this.addTransactionToCategory(
      transactionsMap,
      { ...transaction, reference: CreditCardStatementReferencesEnum.TRANSACTION },
      additionalTotal?.parsedAmount || 0,
      parsedMonthlyAmount,
    );
  }

  private addMainCardTransactionToOtrosComerciosCategory(
    otrosComerciosParsedTotals: TotalMatch[],
    transactionIndex: number,
    parsedMonthlyAmount: number,
    transactionsMap: Map<string, TransactionCategory>,
    transaction: Transaction,
    totals: { totalOtrosComerciosMain: number; totalOtrosComerciosAdditional: number },
  ) {
    // Find the main card total in OTROS COMERCIOS section
    const mainTotal = otrosComerciosParsedTotals.find((t) => t.index > transactionIndex);
    totals.totalOtrosComerciosMain += parsedMonthlyAmount;

    this.addTransactionToCategory(
      transactionsMap,
      { ...transaction, reference: CreditCardStatementReferencesEnum.TRANSACTION },
      mainTotal?.parsedAmount || 0,
      parsedMonthlyAmount,
    );
  }

  private addAdditionalCardTransactionToOtrosComerciosCategory(
    otrosComerciosParsedTotals: TotalMatch[],
    transactionIndex: number,
    parsedMonthlyAmount: number,
    transactionsMap: Map<string, TransactionCategory>,
    transaction: Transaction,
    totals: { totalOtrosComerciosMain: number; totalOtrosComerciosAdditional: number },
  ) {
    // Find the additional card total in OTROS COMERCIOS section
    const additionalTotal = otrosComerciosParsedTotals.find((t) => t.index > transactionIndex);
    totals.totalOtrosComerciosAdditional += parsedMonthlyAmount;

    this.addTransactionToCategory(
      transactionsMap,
      { ...transaction, reference: CreditCardStatementReferencesEnum.TRANSACTION },
      additionalTotal?.parsedAmount || 0,
      parsedMonthlyAmount,
    );
  }

  private categorizeLiderBciTotals(text: string) {
    // Section markers to help categorize transactions
    const sectionMarkers = {
      // Match LIDER when it appears after "Total Operaciones" and before a location
      lider: /1\.\s*Total Operaciones\s+LIDER/m,

      // Match OTROS COMERCIOS as a section header
      otrosComerciosStart: /OTROS COMERCIOS\s+[A-Z]/m,

      // Products section
      productosServicios: /2\.\s*Productos o Servicios Voluntariamente Contratados/m,

      // Charges section
      cargosComisiones: /3\.\s*Cargos.*Comisiones.*Impuestos.*Abonos/m,

      // PAGO with date before it
      pagoMarker: /\d{2}\/\d{2}\/\d{4}\s+PAGO/m,
    };

    // Pattern to match totals: $ amount that is preceded by another $ amount
    const totalPattern = /\$\s+-?\d{1,3}(?:\.\d{3})*\s+\$\s+(-?\d{1,3}(?:\.\d{3})*)/gm;

    // Find section markers with their positions
    const liderMatch = sectionMarkers.lider.exec(text);
    const otrosComerciosMatch = sectionMarkers.otrosComerciosStart.exec(text);
    const productosServiciosMatch = sectionMarkers.productosServicios.exec(text);
    const cargosComisionesMatch = sectionMarkers.cargosComisiones.exec(text);
    const pagoMatch = sectionMarkers.pagoMarker.exec(text);

    const allTotals = this.findLiderBciTotals(text, totalPattern);

    const categorizedTotals = allTotals.reduce(
      (accumulator, total) => {
        if (
          liderMatch &&
          otrosComerciosMatch &&
          total.index > liderMatch.index &&
          total.index < otrosComerciosMatch.index
        ) {
          accumulator.liderParsedTotals.push(total);
        } else if (
          otrosComerciosMatch &&
          productosServiciosMatch &&
          total.index > otrosComerciosMatch.index &&
          total.index < productosServiciosMatch.index
        ) {
          accumulator.otrosComerciosParsedTotals.push(total);
        } else if (
          cargosComisionesMatch &&
          pagoMatch &&
          total.index > cargosComisionesMatch.index &&
          total.index < pagoMatch.index
        ) {
          accumulator.cargosParsedTotals.push(total);
        } else if (pagoMatch && total.index > pagoMatch.index) {
          accumulator.pagoParsedTotals.push(total);
        }
        return accumulator;
      },
      {
        liderParsedTotals: [] as TotalMatch[],
        otrosComerciosParsedTotals: [] as TotalMatch[],
        cargosParsedTotals: [] as TotalMatch[],
        pagoParsedTotals: [] as TotalMatch[],
      },
    );
    return {
      categorizedTotals,
      liderMatch,
      otrosComerciosMatch,
      productosServiciosMatch,
      cargosComisionesMatch,
      pagoMatch,
    };
  }

  private findLiderBciTotals(text: string, totalPattern: RegExp): TotalMatch[] {
    const totals: TotalMatch[] = [];
    const matches = text.matchAll(totalPattern);

    for (const match of matches) {
      if (match.index !== undefined) {
        const matchEnd = match.index + match[0].length;
        const remainingText = text.substring(matchEnd, matchEnd + 30);

        // Check if followed by installment pattern: XX/XX followed by $ (not a date)
        // Installments look like: "   03/03   $  44.751"
        // Dates look like: " 30/05/2025 PAGO"
        const hasInstallmentAfter = /^\s+\d{2}\/\d{2}\s+\$/.test(remainingText);

        if (!hasInstallmentAfter) {
          totals.push({
            amount: match[1],
            parsedAmount: parseAmount(match[1]),
            index: match.index + match[0].indexOf('$', 1),
          });
        }
      }
    }

    return totals;
  }
  private addTransactionToCategory(
    transactionsMap: Map<string, TransactionCategory>,
    transaction: Transaction,
    parsedTotalAmount: number,
    parsedMonthlyAmount: number,
  ) {
    const { reference } = transaction;
    if (!transactionsMap.has(reference)) {
      transactionsMap.set(reference, { transactions: [], parsedTotal: 0, calculatedTotal: 0 });
    }
    const category = transactionsMap.get(reference);
    if (category) {
      category.transactions.push(transaction);
      category.parsedTotal = parsedTotalAmount;
      category.calculatedTotal += parsedMonthlyAmount;
    }
  }

  async checkIfStatementExists(mainCreditCardId: string, billingPeriodStart: Date, billingPeriodEnd: Date) {
    return await this.creditCardStatementRepository.exists({
      where: {
        creditCardId: mainCreditCardId,
        billingPeriodStart: billingPeriodStart,
        billingPeriodEnd: billingPeriodEnd,
      },
    });
  }

  /**
   * Calculate the top and bottom bounds for a region based on page position
   */
  private calculateRegionBounds(
    currentPage: number,
    lastPage: number,
    pageHeight: number,
    endCoordinates: TransactionsCoordinates,
  ): RegionBounds {
    let bottom = 0;
    let top = 0;

    if (this.bankToParse === CreditCardStatementBanks.BancoDeChile) {
      if (currentPage === 0) {
        // For Banco de Chile, footer text appears ~200 points from bottom on first page
        bottom = 200;
      } else if (currentPage === lastPage) {
        // For Banco de Chile, on the last transaction page, stop above the "III. INFORMACIÓN DE PAGO" section with 50 padding
        bottom = pageHeight - (endCoordinates.y + endCoordinates.height) + 25;
      }
      if (currentPage !== 0) {
        // For Banco de Chile, on intermediate pages, add 50 padding at top to remove repeated headers
        top = 30;
      }
    } else if (this.bankToParse === CreditCardStatementBanks.LiderBCI) {
      if (currentPage !== 0) {
        top = 42;
        if (currentPage === lastPage) {
          // For Lider BCI, on the last transaction page, stop above the "III. INFORMACIÓN DE PAGO" section with 10 padding
          bottom = pageHeight - (endCoordinates.y + endCoordinates.height) + 20;
        }
      }
    }

    return { bottom, top };
  }

  /**
   * Generate a debug PDF showing only the transaction regions
   */
  async generateTransactionRegionsPdf(file: Express.Multer.File, filePath?: string): Promise<string> {
    const fileName = 'transaction_regions.pdf';
    const outputPath = filePath ? `${filePath}/${fileName}` : path.join(process.cwd(), fileName);

    if (!this.creditCardStatementPDF) {
      try {
        this.creditCardStatementPDF = await PDFDocument.load(file.buffer);
      } catch (error) {
        if (error.message.includes('encrypted') || error.message.includes('password')) {
          throw new HttpException('Pdf con contraseña no es soportado', HttpStatus.UNPROCESSABLE_ENTITY);
        }
      }
    }
    const pdfDoc = this.creditCardStatementPDF;
    const pages = pdfDoc.getPages();

    const newPdfDoc = await PDFDocument.create();

    const regions: Array<{ region: CutRegion; height: number }> = [];
    let totalHeight = 0;
    let maxWidth = 0;

    for (const item of this.creditCardStatementCoordinates.transactionsTable.coordinates) {
      const targetPage = pages[item.page];
      const { width: pageWidth, height: pageHeight } = targetPage.getSize();

      const bounds = this.calculateRegionBounds(
        item.page,
        this.creditCardStatementCoordinates.transactionsEnd.coordinates[0].page,
        pageHeight,
        this.creditCardStatementCoordinates.transactionsEnd.coordinates[0],
      );

      const cutHeight = pageHeight - item.y - bounds.bottom - bounds.top;

      const region: CutRegion = {
        x: Math.max(0, item.x),
        y: Math.max(0, item.y),
        width: item.width,
        height: item.height,
        page: item.page,
      };

      regions.push({ region, height: cutHeight });
      totalHeight += cutHeight;
      maxWidth = Math.max(maxWidth, pageWidth);
    }

    const newPage = newPdfDoc.addPage([maxWidth, totalHeight]);

    let currentY = totalHeight;
    for (const { region, height } of regions) {
      const targetPage = pages[region.page];
      const { width: pageWidth, height: pageHeight } = targetPage.getSize();

      const bounds = this.calculateRegionBounds(
        region.page,
        this.creditCardStatementCoordinates.transactionsEnd.coordinates[0].page,
        pageHeight,
        this.creditCardStatementCoordinates.transactionsEnd.coordinates[0],
      );

      const embeddedPage = await newPdfDoc.embedPage(targetPage, {
        left: 0,
        bottom: bounds.bottom,
        right: pageWidth,
        top: pageHeight - region.y - bounds.top,
      });

      currentY -= height;
      newPage.drawPage(embeddedPage, {
        x: 0,
        y: currentY,
        width: pageWidth,
        height: height,
      });
    }

    const newPdfBytes = await newPdfDoc.save();
    fs.writeFile(outputPath, newPdfBytes);

    return outputPath;
  }

  async getLatestCreditCardStatementDate() {
    const latestStatement = await this.creditCardStatementRepository.find({
      select: {
        id: true,
        billingPeriodEnd: true,
      },
      order: {
        billingPeriodEnd: 'DESC',
      },
    });

    return latestStatement.length > 0 ? latestStatement[0].billingPeriodEnd : null;
  }
}
