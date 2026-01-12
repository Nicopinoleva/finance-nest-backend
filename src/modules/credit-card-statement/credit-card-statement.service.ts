import { forwardRef, HttpException, HttpStatus, Inject, Injectable, Scope } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import {
  CutRegion,
  ParsedStatement,
  RegionBounds,
  Transaction,
  TransactionCategory,
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
import { CreditCardStatementBanks, extractTextFromCoordinates, findTextCoordinates, normalizeDateString } from '@utils';
import { PaymentMethod } from '@entities';

@Injectable({ scope: Scope.REQUEST })
export class CreditCardStatementService {
  private creditCardStatementPDF: PDFDocument;
  private billingPeriodStartEndCoordinates: TransactionsCoordinates[] = [];
  private transactionsTableCoordinates: TransactionsCoordinates[] = [];
  private transactionsEndCoordinates: TransactionsCoordinates[] = [];
  private mainCreditCardTextCoordinates: TransactionsCoordinates[] = [];
  private dueDateCoordinates: TransactionsCoordinates[] = [];
  private dueAmountCoordinates: TransactionsCoordinates[] = [];
  private minimumPaymentCoordinates: TransactionsCoordinates[] = [];
  private previousStatementDebtCoordinates: TransactionsCoordinates[] = [];
  private unbilledStatementsTableStartCoordinates: TransactionsCoordinates[] = [];
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
    if (!this.creditCardStatementPDF) {
      try {
        this.creditCardStatementPDF = await PDFDocument.load(file.buffer);
      } catch (error) {
        if (error.message.includes('encrypted') || error.message.includes('password')) {
          throw new HttpException('Pdf con contraseña no es soportado', HttpStatus.UNPROCESSABLE_ENTITY);
        }
      }
    }
    if (bankToParse === CreditCardStatementBanks.BancoDeChile) {
      // TODO: make this one call to run throw pdf only once(check if possible with legacy pdfs, seem that they are not ordered)
      this.mainCreditCardTextCoordinates = await findTextCoordinates(
        file,
        'n° de tarjeta de credito',
        this.creditCardStatementPDF,
      );
      this.billingPeriodStartEndCoordinates = await findTextCoordinates(
        file,
        'periodo facturado',
        this.creditCardStatementPDF,
      );
      this.dueDateCoordinates = await findTextCoordinates(file, 'pagar hasta', this.creditCardStatementPDF, false);
      this.dueAmountCoordinates = await findTextCoordinates(
        file,
        'monto total facturado a pagar',
        this.creditCardStatementPDF,
      );
      this.minimumPaymentCoordinates = await findTextCoordinates(
        file,
        'monto minimo a pagar',
        this.creditCardStatementPDF,
      );
      this.previousStatementDebtCoordinates = await findTextCoordinates(
        file,
        'saldo adeudado final periodo anterior',
        this.creditCardStatementPDF,
      );
      this.transactionsTableCoordinates = await findTextCoordinates(
        file,
        '2. periodo actual',
        this.creditCardStatementPDF,
        false,
      );
      this.transactionsEndCoordinates = await findTextCoordinates(
        file,
        'iii. informacion de pago',
        this.creditCardStatementPDF,
      );
      this.unbilledStatementsTableStartCoordinates = await findTextCoordinates(
        file,
        '4. informacion compras en cuotas',
        this.creditCardStatementPDF,
      );
    }

    // Optionally render debug PDF
    if (renderDebugPdf) {
      await this.generateTransactionRegionsPdf(file, filePath);
    }

    return await this.extractAndParseTransactions(file);
  }

  async extractAndParseTransactions(file: Express.Multer.File): Promise<ParsedStatement> {
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

    // TODO: Maybe its possible to extract all text in one sweep instead of multiple calls
    const mainCreditCardText = await extractTextFromCoordinates(
      file.buffer,
      this.mainCreditCardTextCoordinates[0].page,
      this.creditCardStatementPDF,
      Math.trunc(this.mainCreditCardTextCoordinates[0].y),
      Math.trunc(this.mainCreditCardTextCoordinates[0].y + this.mainCreditCardTextCoordinates[0].height - 3),
    );

    const billingPeriodStartEndText = await extractTextFromCoordinates(
      file.buffer,
      this.billingPeriodStartEndCoordinates[0].page,
      this.creditCardStatementPDF,
      Math.trunc(this.billingPeriodStartEndCoordinates[0].y),
      Math.trunc(this.billingPeriodStartEndCoordinates[0].y + this.billingPeriodStartEndCoordinates[0].height),
      Math.trunc(this.billingPeriodStartEndCoordinates[0].x + this.billingPeriodStartEndCoordinates[0].width + 15),
      Math.trunc(this.billingPeriodStartEndCoordinates[0].x + this.billingPeriodStartEndCoordinates[0].width + 90),
    );

    const dueDateTexts: string[] = [];

    for (const [_, coord] of this.dueDateCoordinates.entries()) {
      dueDateTexts.push(
        await extractTextFromCoordinates(
          file.buffer,
          coord.page,
          this.creditCardStatementPDF,
          Math.trunc(coord.y + 10),
          Math.trunc(coord.y + coord.height + 10),
        ),
      );
    }

    const dueAmountText = await extractTextFromCoordinates(
      file.buffer,
      this.dueAmountCoordinates[0].page,
      this.creditCardStatementPDF,
      Math.trunc(this.dueAmountCoordinates[0].y),
      Math.trunc(this.dueAmountCoordinates[0].y + this.dueAmountCoordinates[0].height + 10),
    );

    const minimumPaymentCoordinatesText = await extractTextFromCoordinates(
      file.buffer,
      this.minimumPaymentCoordinates[0].page,
      this.creditCardStatementPDF,
      Math.trunc(this.minimumPaymentCoordinates[0].y),
      Math.trunc(this.minimumPaymentCoordinates[0].y + this.minimumPaymentCoordinates[0].height + 10),
    );

    const previousStatementDebtCoordinatesText = await extractTextFromCoordinates(
      file.buffer,
      this.previousStatementDebtCoordinates[0].page,
      this.creditCardStatementPDF,
      Math.trunc(this.previousStatementDebtCoordinates[0].y),
      Math.trunc(this.previousStatementDebtCoordinates[0].y + this.previousStatementDebtCoordinates[0].height + 10),
      Math.trunc(this.previousStatementDebtCoordinates[0].x + this.previousStatementDebtCoordinates[0].width + 70),
      Math.trunc(this.previousStatementDebtCoordinates[0].x + this.previousStatementDebtCoordinates[0].width + 130),
    );

    const allTransactionsText: string[] = [];

    // Extract text from all transaction regions
    for (const item of this.transactionsTableCoordinates) {
      const targetPage = pages[item.page];
      const { height: pageHeight } = targetPage.getSize();

      const bounds = this.calculateRegionBounds(
        item.page,
        this.transactionsEndCoordinates[0].page,
        pageHeight,
        this.transactionsEndCoordinates[0],
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

    return this.parseTransactionText(
      [mainCreditCardText],
      [billingPeriodStartEndText],
      dueDateTexts,
      [dueAmountText],
      [minimumPaymentCoordinatesText],
      [previousStatementDebtCoordinatesText],
      allTransactionsText.join('\n'),
    );
  }

  // TODO: Atomize to smaller functions
  @Transactional()
  async parseTransactionText(
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

    if (!totalUnbilledInstallmentsMatch && this.unbilledStatementsTableStartCoordinates.length > 0) {
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
          parsedTotal: this.parseAmount(match[2]),
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

    // if (creditCardsMatches.length === 0) {
    //   throw new HttpException('No se pudo extraer el total de tarjetas de crédito', HttpStatus.UNPROCESSABLE_ENTITY);
    // }

    // Sort credit cards by their position in text
    creditCardsMatches.sort((a, b) => a.index - b.index);

    const parsedTotalOperations =
      (totalPaymentsMatch ? this.parseAmount(totalPaymentsMatch[1]) : 0) +
      (totalPATMatch ? this.parseAmount(totalPATMatch[1]) : 0) +
      creditCardsMatches.reduce((sum, card) => sum + card.parsedTotal, 0) +
      this.parseAmount(totalInstallmentsMatch?.[1] ?? '0');

    const parsedTotalCharges = this.parseAmount(totalChargesMatch[1]);
    const parsedTotalUnbilledInstallments = totalUnbilledInstallmentsMatch
      ? this.parseAmount(totalUnbilledInstallmentsMatch[1])
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
      const parsedMonthlyAmount = this.parseAmount(monthlyAmount);
      const parsedOperationAmount = this.parseAmount(operationAmount);
      const parsedTotalAmount = this.parseAmount(totalAmount);

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
      dueAmount: this.parseAmount(dueAmountMatch[1]),
      minimumPayment: this.parseAmount(minimumPaymentMatch[1]),
      previousStatementDebt: this.parseAmount(previousStatementDebtMatch[1]),
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

  private parseAmount(amountStr: string): number {
    // Remove currency symbols, spaces, thousand separators, and convert Chilean decimal format
    // Chilean format: 1.234.567,89 or -1.234.567,89
    return Number.parseFloat(amountStr.replace(/[$\s.,]/g, (match) => (match === ',' ? '.' : '')));
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

    for (const item of this.transactionsTableCoordinates) {
      const targetPage = pages[item.page];
      const { width: pageWidth, height: pageHeight } = targetPage.getSize();

      const bounds = this.calculateRegionBounds(
        item.page,
        this.transactionsEndCoordinates[0].page,
        pageHeight,
        this.transactionsEndCoordinates[0],
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
        this.transactionsEndCoordinates[0].page,
        pageHeight,
        this.transactionsEndCoordinates[0],
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
