import { Injectable } from '@nestjs/common';
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

@Injectable()
export class CreditCardStatementService {
  constructor() {}

  async parseCreditCardStatement(
    file: Express.Multer.File,
    bankToParse: CreditCardStatementBanks,
    renderDebugPdf?: boolean,
    filePath?: string,
  ): Promise<ParsedStatement> {
    let transactionsTableCoordinates: TransactionsCoordinates[] = [];
    let transactionsEndCoorditnates: TransactionsCoordinates[] = [];
    if (bankToParse === CreditCardStatementBanks.BancoDeChile) {
      transactionsTableCoordinates = await this.findTextCoordinates(file, '2. PERIODO ACTUAL');
      transactionsEndCoorditnates = await this.findTextCoordinates(file, 'III. INFORMACIÓN DE PAGO');
    }

    // Optionally render debug PDF
    if (renderDebugPdf) {
      await this.generateTransactionRegionsPdf(
        transactionsTableCoordinates,
        transactionsEndCoorditnates,
        file,
        filePath,
      );
    }

    return await this.extractAndParseTransactions(transactionsTableCoordinates, transactionsEndCoorditnates, file);
  }

  async extractAndParseTransactions(
    transactionsTableCoordinates: TransactionsCoordinates[],
    transactionsEndCoorditnates: TransactionsCoordinates[],
    file: Express.Multer.File,
  ): Promise<ParsedStatement> {
    const pdfDoc = await PDFDocument.load(file.buffer);
    const pages = pdfDoc.getPages();

    const allTransactionsText: string[] = [];

    // Extract text from all transaction regions
    for (const item of transactionsTableCoordinates) {
      const targetPage = pages[item.page];
      const { height: pageHeight } = targetPage.getSize();

      const bounds = this.calculateRegionBounds(
        item.page,
        transactionsEndCoorditnates[0].page,
        pageHeight,
        transactionsEndCoorditnates[0],
      );

      const regionText = await this.extractTextFromCoordinates(
        file.buffer,
        item.page,
        item.y + bounds.top,
        pageHeight - bounds.bottom,
      );

      allTransactionsText.push(regionText);
    }

    return this.parseTransactionText(allTransactionsText.join('\n'));
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

  async findTextCoordinates(file: Express.Multer.File, searchText: string): Promise<TransactionsCoordinates[]> {
    const pdfBuffer = file.buffer;
    const textItems: TransactionsCoordinates[] = [];

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const pageSizes = pages.map((page) => page.getSize());

    const options = {
      pagerender: async (pageData: PDFPageProxy) => {
        const pageNumber = pageData._pageIndex;
        const pageHeight = pageSizes[pageNumber]?.height || 792;

        const textContent = await pageData.getTextContent();

        (textContent.items as TextItem[]).forEach((item) => {
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
        });

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
  ): Promise<string> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const pageHeight = pages[pageNumber].getSize().height;

    const options = {
      pagerender: async (pageData: PDFPageProxy) => {
        // Only process the specified page
        if (pageData._pageIndex !== pageNumber) {
          return '';
        }

        const textContent = await pageData.getTextContent();
        const textItems: Array<{ text: string; y: number; x: number }> = [];

        (textContent.items as TextItem[]).forEach((item) => {
          // Top to bottom conversion
          const y = pageHeight - item.transform[5];

          // Only include text within region
          if (y >= startY && y <= endY) {
            textItems.push({
              text: item.str,
              y: y,
              x: item.transform[4],
            });
          }
        });

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

  parseTransactionText(text: string): ParsedStatement {
    const transactionsMap: Map<string, TransactionCategory> = new Map();
    let totalPayments = 0;
    let totalOperations = 0;
    let totalPAT = 0;
    let totalInstallments = 0;
    let totalCharges = 0;

    // Extract totals
    const totalOperationsMatch = RegExp(/TOTAL OPERACIONES[^$]*\$\s*(-?[\d.,]+)/).exec(text);

    const totalPaymentsMatch = RegExp(/TOTAL PAGOS A LA CUENTA[^$]*\$\s*(-?[\d.,]+)/).exec(text);

    const totalPATMatch = RegExp(/TOTAL PAT A LA CUENTA[^$]*\$\s*(-?[\d.,]+)/).exec(text);

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

    const totalInstallmentsMatch = RegExp(/TOTAL COMPRAS EN CUOTAS A LA CUENTA[^$]*\$\s*(-?[\d.,]+)/).exec(text);

    const totalChargesMatch = RegExp(/CARGOS, COMISIONES[^$]*\$\s*(-?[\d.,]+)/).exec(text);

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
      const [, location, date, code, description, operationAmount, totalAmount, installment, monthlyAmount] = match;

      const transactionIndex = match.index;
      const parsedMonthlyAmount = this.parseAmount(monthlyAmount);
      const parsedOperationAmount = this.parseAmount(operationAmount);
      const parsedTotalAmount = this.parseAmount(totalAmount);

      let reference = '';

      const transaction: Transaction = {
        location: location || 'N/A',
        date: date,
        referenceCode: code,
        description: description.trim(),
        operationAmount: parsedOperationAmount,
        totalAmount: parsedTotalAmount,
        installment: installment,
        monthlyInstallment: parsedMonthlyAmount,
        reference: reference,
      };

      // The totals always appear at the end of the statement, so we can use their position to categorize transactions
      if (totalPaymentsMatch && totalPaymentsMatch.index > transactionIndex) {
        totalPayments += parsedMonthlyAmount;
        reference = 'PAYMENT';
        this.addTransactionToCategory(
          transactionsMap,
          { ...transaction, reference: reference },
          totalPayments,
          parsedMonthlyAmount,
        );
      } else if (totalPATMatch && totalPATMatch.index > transactionIndex) {
        totalPAT += parsedMonthlyAmount;
        reference = 'PAT';
        this.addTransactionToCategory(
          transactionsMap,
          { ...transaction, reference: reference },
          totalPAT,
          parsedMonthlyAmount,
        );
      } else if (
        creditCardsMatches.find((card) => {
          if (card.index > transactionIndex) {
            reference = card.reference;
            this.addTransactionToCategory(
              transactionsMap,
              { ...transaction, reference: reference },
              card.parsedTotal,
              parsedMonthlyAmount,
            );
            return true;
          }
        })
      ) {
        totalOperations += parsedMonthlyAmount;
      } else if (totalInstallmentsMatch && totalInstallmentsMatch.index > transactionIndex) {
        totalInstallments += parsedMonthlyAmount;
        reference = 'INSTALLMENT';
        this.addTransactionToCategory(
          transactionsMap,
          { ...transaction, reference: reference },
          totalInstallments,
          parsedMonthlyAmount,
        );
      }
      // Charges do not have end total, so we assume they appear after all cards
      else if (totalChargesMatch && totalChargesMatch.index < transactionIndex) {
        totalCharges += parsedMonthlyAmount;
        reference = 'CHARGE';
        this.addTransactionToCategory(
          transactionsMap,
          { ...transaction, reference: reference },
          totalCharges,
          parsedMonthlyAmount,
        );
      }
    }

    return {
      transactions: Object.fromEntries(transactionsMap),
      totalOperations,
      totalPayments,
      totalPAT,
      totalInstallments,
      totalCharges,
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
  async generateTransactionRegionsPdf(
    transactionsTableCoordinates: TransactionsCoordinates[],
    transactionsEndCoorditnates: TransactionsCoordinates[],
    file: Express.Multer.File,
    filePath?: string,
  ): Promise<string> {
    const fileName = 'transaction_regions.pdf';
    const outputPath = filePath ? `${filePath}/${fileName}` : path.join(process.cwd(), fileName);

    const pdfDoc = await PDFDocument.load(file.buffer);
    const pages = pdfDoc.getPages();

    const newPdfDoc = await PDFDocument.create();

    const regions: Array<{ region: CutRegion; height: number }> = [];
    let totalHeight = 0;
    let maxWidth = 0;

    for (const item of transactionsTableCoordinates) {
      const targetPage = pages[item.page];
      const { width: pageWidth, height: pageHeight } = targetPage.getSize();

      const bounds = this.calculateRegionBounds(
        item.page,
        transactionsEndCoorditnates[0].page,
        pageHeight,
        transactionsEndCoorditnates[0],
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
        transactionsEndCoorditnates[0].page,
        pageHeight,
        transactionsEndCoorditnates[0],
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
