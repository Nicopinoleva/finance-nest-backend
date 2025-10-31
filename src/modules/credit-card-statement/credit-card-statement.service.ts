import { HttpException, HttpStatus, Injectable, Scope } from '@nestjs/common';
import PdfParse from 'pdf-parse-new';
import { promises as fs } from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import type { PDFPageProxy } from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import { CreditCardStatementBanks } from 'src/utils';
import {
  CutRegion,
  ParsedStatement,
  RegionBounds,
  Transaction,
  TransactionCategory,
  TransactionsCoordinates,
} from './credit-card-statement.interface';
import { ExpensesService } from '@modules/expenses/expenses/expenses.service';
import { CreditCardStatementReferencesEnum } from 'src/utils/constants/credit-card-statement-references';
import { parse } from 'date-fns';
import { CreditCardStatement } from '@entities/credit-card-statement/credit-card-statement.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentMethodsService } from '@modules/payment-methods/payment-methods/payment-methods.service';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

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
    private readonly expensesService: ExpensesService,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  async parseCreditCardStatement(
    file: Express.Multer.File,
    bankToParse: CreditCardStatementBanks,
    renderDebugPdf?: boolean,
    filePath?: string,
  ): Promise<ParsedStatement> {
    if (bankToParse === CreditCardStatementBanks.BancoDeChile) {
      this.mainCreditCardTextCoordinates = await this.findTextCoordinates(file, 'N° DE TARJETA DE CRÉDITO');
      this.billingPeriodStartEndCoordinates = await this.findTextCoordinates(file, 'PERIODO FACTURADO');
      this.dueDateCoordinates = await this.findTextCoordinates(file, 'PAGAR HASTA');
      this.dueAmountCoordinates = await this.findTextCoordinates(file, 'MONTO TOTAL FACTURADO A PAGAR');
      this.minimumPaymentCoordinates = await this.findTextCoordinates(file, 'MONTO MINIMO A PAGAR');
      this.previousStatementDebtCoordinates = await this.findTextCoordinates(
        file,
        'SALDO ADEUDADO FINAL PERIODO ANTERIOR',
      );
      this.transactionsTableCoordinates = await this.findTextCoordinates(file, '2. PERIODO ACTUAL', false);
      this.transactionsEndCoordinates = await this.findTextCoordinates(file, 'III. INFORMACIÓN DE PAGO');
      this.unbilledStatementsTableStartCoordinates = await this.findTextCoordinates(
        file,
        '4.INFORMACION COMPRAS EN CUOTAS',
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
      this.creditCardStatementPDF = await PDFDocument.load(file.buffer);
    }
    const pdfDoc = this.creditCardStatementPDF;
    const pages = pdfDoc.getPages();

    // TODO: Maybe its possible to extract all text in one sweep instead of multiple calls
    const mainCreditCardText = await this.extractTextFromCoordinates(
      file.buffer,
      this.mainCreditCardTextCoordinates[0].page,
      Math.trunc(this.mainCreditCardTextCoordinates[0].y),
      Math.trunc(this.mainCreditCardTextCoordinates[0].y + this.mainCreditCardTextCoordinates[0].height),
    );

    const billingPeriodStartEndText = await this.extractTextFromCoordinates(
      file.buffer,
      this.billingPeriodStartEndCoordinates[0].page,
      Math.trunc(this.billingPeriodStartEndCoordinates[0].y),
      Math.trunc(this.billingPeriodStartEndCoordinates[0].y + this.billingPeriodStartEndCoordinates[0].height),
      Math.trunc(this.billingPeriodStartEndCoordinates[0].x + this.billingPeriodStartEndCoordinates[0].width + 15),
      Math.trunc(this.billingPeriodStartEndCoordinates[0].x + this.billingPeriodStartEndCoordinates[0].width + 90),
    );

    const dueDateText = await this.extractTextFromCoordinates(
      file.buffer,
      this.dueDateCoordinates[0].page,
      Math.trunc(this.dueDateCoordinates[0].y + 10),
      Math.trunc(this.dueDateCoordinates[0].y + this.dueDateCoordinates[0].height + 10),
    );

    const dueAmountText = await this.extractTextFromCoordinates(
      file.buffer,
      this.dueAmountCoordinates[0].page,
      Math.trunc(this.dueAmountCoordinates[0].y),
      Math.trunc(this.dueAmountCoordinates[0].y + this.dueAmountCoordinates[0].height + 10),
    );

    const minimumPaymentCoordinatesText = await this.extractTextFromCoordinates(
      file.buffer,
      this.minimumPaymentCoordinates[0].page,
      Math.trunc(this.minimumPaymentCoordinates[0].y),
      Math.trunc(this.minimumPaymentCoordinates[0].y + this.minimumPaymentCoordinates[0].height + 10),
    );

    const previousStatementDebtCoordinatesText = await this.extractTextFromCoordinates(
      file.buffer,
      this.previousStatementDebtCoordinates[0].page,
      Math.trunc(this.previousStatementDebtCoordinates[0].y),
      Math.trunc(this.previousStatementDebtCoordinates[0].y + this.previousStatementDebtCoordinates[0].height + 10),
      Math.trunc(this.previousStatementDebtCoordinates[0].x + this.previousStatementDebtCoordinates[0].width + 100),
      Math.trunc(this.previousStatementDebtCoordinates[0].x + this.previousStatementDebtCoordinates[0].width + 160),
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

      const regionText = await this.extractTextFromCoordinates(
        file.buffer,
        item.page,
        item.y + bounds.top,
        pageHeight - bounds.bottom,
      );

      allTransactionsText.push(regionText);
    }

    return this.parseTransactionText(
      mainCreditCardText,
      billingPeriodStartEndText,
      dueDateText,
      dueAmountText,
      minimumPaymentCoordinatesText,
      previousStatementDebtCoordinatesText,
      allTransactionsText.join('\n'),
    );
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
      bottom = pageHeight - (endCoordinates.y + endCoordinates.height) + 50;
    }
    if (currentPage !== 0) {
      // For Banco de Chile, on intermediate pages, add 50 padding at top to remove repeated headers
      top = 45;
    }

    return { bottom, top };
  }

  async findTextCoordinates(
    file: Express.Multer.File,
    searchText: string,
    stopAtFirstMatch = true,
  ): Promise<TransactionsCoordinates[]> {
    const pdfBuffer = file.buffer;
    const textItems: TransactionsCoordinates[] = [];

    if (!this.creditCardStatementPDF) {
      this.creditCardStatementPDF = await PDFDocument.load(pdfBuffer);
    }

    const pages = this.creditCardStatementPDF.getPages();
    const pageSizes = pages.map((page) => page.getSize());

    const options = {
      pagerender: async (pageData: PDFPageProxy) => {
        // Skip processing if we already found a result and should stop
        if (stopAtFirstMatch && textItems.length > 0) {
          return '';
        }

        const pageNumber = pageData._pageIndex;
        const pageHeight = pageSizes[pageNumber]?.height || 792;
        const textContent = await pageData.getTextContent();

        for (const item of textContent.items as TextItem[]) {
          // Skip processing if we already found a result and should stop
          if (stopAtFirstMatch && textItems.length > 0) {
            continue;
          }

          if (item.str.toLowerCase().includes(searchText.toLowerCase())) {
            textItems.push({
              text: item.str,
              x: item.transform[4],
              y: pageHeight - item.transform[5],
              width: item.width || 0,
              height: item.height || item.transform[3] || 12,
              page: pageNumber,
            });
          }
        }

        return '';
      },
    };

    await PdfParse(pdfBuffer, options);
    return textItems;
  }

  async extractTextFromCoordinates(
    pdfBuffer: Buffer,
    pageNumber: number,
    startY: number,
    endY: number,
    startX?: number,
    endX?: number,
  ): Promise<string> {
    if (!this.creditCardStatementPDF) {
      this.creditCardStatementPDF = await PDFDocument.load(pdfBuffer);
    }
    const pages = this.creditCardStatementPDF.getPages();
    const pageHeight = pages[pageNumber].getSize().height;

    const options = {
      pagerender: async (pageData: PDFPageProxy) => {
        // Only process the specified page
        if (pageData._pageIndex !== pageNumber) {
          return '';
        }

        const textContent = await pageData.getTextContent();
        const textItems: Array<{ text: string; y: number; x: number }> = [];

        for (const item of textContent.items as TextItem[]) {
          // Top to bottom conversion
          const y = Math.trunc(pageHeight - item.transform[5]);

          // Only include text within region
          if (startX !== undefined && endX !== undefined) {
            const x = Math.trunc(item.transform[4]);
            if (x >= startX && x <= endX && y >= startY && y <= endY) {
              textItems.push({
                text: item.str,
                y: y,
                x: x,
              });
            }
          } else if (y >= startY && y <= endY) {
            textItems.push({
              text: item.str,
              y: y,
              x: item.transform[4],
            });
          }
        }

        // Sort by y position (top to bottom) then x position (left to right)
        textItems.sort((a, b) => {
          const yDiff = a.y - b.y;
          if (Math.abs(yDiff) < 5) return a.x - b.x; // Same line
          return yDiff;
        });
        // TODO: This could be skipped
        return textItems.map((item) => item.text).join(' ');
      },
    };

    // This parses the pdf only on the specified regions
    const data = await PdfParse(pdfBuffer, options);
    return data.text;
  }

  // TODO: Atomize to smaller functions
  @Transactional()
  async parseTransactionText(
    mainCreditCard: string,
    billingPeriodStartEnd: string,
    dueDateText: string,
    dueAmountText: string,
    minimumPaymentCoordinatesText: string,
    previousStatementDebtCoordinatesText: string,
    text: string,
  ): Promise<ParsedStatement> {
    const transactionsMap: Map<string, TransactionCategory> = new Map();
    let totalPayments = 0;
    let totalTransactions = 0;
    let totalPAT = 0;
    let totalInstallments = 0;
    let totalCharges = 0;
    let totalUnbilledInstallments = 0;

    const mainCreditCardNumberMatch = new RegExp(/\d{4}(?=\D*$)/).exec(mainCreditCard);
    if (!mainCreditCardNumberMatch) {
      throw new HttpException('Could not extract main credit card number', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const billingPeriodMatch = billingPeriodStartEnd.match(/\d{2}-\d{2}-\d{4}/g);
    if (!billingPeriodMatch) {
      throw new HttpException('Could not extract billing period dates', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const dueDateMatch = new RegExp(/\d{2}\/\d{2}\/\d{4}/).exec(dueDateText);
    if (!dueDateMatch) {
      throw new HttpException('Could not extract due date', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const dueAmountMatch = new RegExp(/\$\s*(-?[\d.,]+)/).exec(dueAmountText);
    if (!dueAmountMatch) {
      throw new HttpException('Could not extract due amount', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const minimumPaymentMatch = new RegExp(/\$\s*(-?[\d.,]+)/).exec(minimumPaymentCoordinatesText);
    if (!minimumPaymentMatch) {
      throw new HttpException('Could not extract minimum payment amount', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const previousStatementDebtMatch = new RegExp(/\$\s*(-?[\d.,]+)/).exec(previousStatementDebtCoordinatesText);
    if (!previousStatementDebtMatch) {
      throw new HttpException('Could not extract previous statement debt amount', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const creditCardId = await this.paymentMethodService.getIdByName(mainCreditCardNumberMatch[0]);
    const billingPeriodStart = parse(billingPeriodMatch[0], 'dd-MM-yyyy', new Date());
    const billingPeriodEnd = parse(billingPeriodMatch[1], 'dd-MM-yyyy', new Date());

    const checkRepeatedStatement = await this.creditCardStatementRepository.exists({
      where: {
        creditCardId: creditCardId,
        billingPeriodStart: billingPeriodStart,
        billingPeriodEnd: billingPeriodEnd,
      },
    });

    if (checkRepeatedStatement) {
      throw new HttpException('Statement already exists', HttpStatus.NOT_ACCEPTABLE);
    }

    // Extract totals
    const totalOperationsMatch = new RegExp(/TOTAL OPERACIONES[^$]*\$\s*(-?[\d.,]+)/).exec(text);
    const totalPaymentsMatch = new RegExp(/TOTAL PAGOS A LA CUENTA[^$]*\$\s*(-?[\d.,]+)/).exec(text);
    const totalPATMatch = new RegExp(/TOTAL PAT A LA CUENTA[^$]*\$\s*(-?[\d.,]+)/).exec(text);
    const totalInstallmentsMatch = new RegExp(/TOTAL COMPRAS EN CUOTAS A LA CUENTA[^$]*\$\s*(-?[\d.,]+)/).exec(text);
    const totalChargesMatch = new RegExp(/CARGOS, COMISIONES[^$]*\$\s*(-?[\d.,]+)/).exec(text);
    const totalUnbilledInstallmentsMatch = new RegExp(/4.INFORMACION COMPRAS EN CUOTAS[^$]*\$\s*(-?[\d.,]+)/).exec(
      text,
    );

    const parsedTotalOperations = totalOperationsMatch ? this.parseAmount(totalOperationsMatch[1]) : 0;
    const parsedTotalCharges = totalChargesMatch ? this.parseAmount(totalChargesMatch[1]) : 0;
    const parsedTotalUnbilledInstallments = totalUnbilledInstallmentsMatch
      ? this.parseAmount(totalUnbilledInstallmentsMatch[1])
      : 0;

    // To identify multiple cards
    const cardTotalPattern = /TOTAL TARJETA (X+\d{4})[^$]*\$\s*(-?[\d.,]+)/g;

    const referenceMatches = text.matchAll(cardTotalPattern);
    const creditCardsMatches = Array.from(referenceMatches).map((match) => ({
      reference: match[1],
      parsedTotal: this.parseAmount(match[2]),
      index: match.index,
    }));

    // Sort credit cards by their position in text
    creditCardsMatches.sort((a, b) => a.index - b.index);

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

    const transactionMatches = text.matchAll(transactionPattern);

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
              { ...transaction, reference: card.reference },
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
      } else if (totalChargesMatch && totalChargesMatch.index < transactionIndex) {
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
        `Parsed operations do not match parsed value: ${parsedTotalOperations} !== ${totalCalculatedOperations}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    } else if (parsedTotalCharges !== totalCharges) {
      throw new HttpException(
        `Parsed charges do not match parsed value: ${parsedTotalCharges} !== ${totalCharges}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    } else if (parsedTotalUnbilledInstallments !== totalUnbilledInstallments) {
      throw new HttpException(
        `Parsed unbilled installments do not match parsed value: ${parsedTotalUnbilledInstallments} !== ${totalUnbilledInstallments}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const parsedStatement = await this.txHost.tx.save(CreditCardStatement, {
      creditCardId: creditCardId,
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
    return parseFloat(amountStr.replace(/[$\s.,]/g, (match) => (match === ',' ? '.' : '')));
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
   * Generate a debug PDF showing only the transaction regions
   */
  async generateTransactionRegionsPdf(file: Express.Multer.File, filePath?: string): Promise<string> {
    const fileName = 'transaction_regions.pdf';
    const outputPath = filePath ? `${filePath}/${fileName}` : path.join(process.cwd(), fileName);

    if (!this.creditCardStatementPDF) {
      this.creditCardStatementPDF = await PDFDocument.load(file.buffer);
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
}
