import { TransactionsCoordinates } from '@modules/credit-card-statement/credit-card-statement.interface';
import { PDFDocument } from 'pdf-lib';
import { PDFPageProxy } from 'pdfjs-dist';
import { removeAccents, removeSpaces } from './string.utils';
import PdfParse from 'pdf-parse-new';
import { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api';

export async function findTextCoordinates(
  file: Express.Multer.File,
  searchText: string,
  pdf: PDFDocument,
  stopAtFirstMatch = true,
): Promise<TransactionsCoordinates[]> {
  const pdfBuffer = file.buffer;
  const textItems: TransactionsCoordinates[] = [];

  const pages = pdf.getPages();
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

      const items = textContent.items as TextItem[];
      let index = 0;

      while (index < items.length) {
        // Skip processing if we already found a result and should stop
        if (stopAtFirstMatch && textItems.length > 0) {
          break;
        }

        const item = items[index];

        const { groupedText, groupedWidth, groupingIndex } = groupCharactersText(items, index, textContent);
        const formattedGroupedText = removeSpaces(removeAccents(groupedText.toLowerCase()));
        if (formattedGroupedText.includes(removeSpaces(removeAccents(searchText.toLowerCase())))) {
          textItems.push({
            text: groupedText,
            x: item.transform[4],
            y: pageHeight - item.transform[5],
            width: groupedWidth,
            height: item.height || item.transform[3] || 12,
            page: pageNumber,
          });
        }
        index = index + groupingIndex + 1;
      }

      return '';
    },
  };

  await PdfParse(pdfBuffer, options);
  return textItems;
}

export async function extractTextFromCoordinates(
  pdfBuffer: Buffer,
  pageNumber: number,
  pdf: PDFDocument,
  startY: number,
  endY: number,
  startX?: number,
  endX?: number,
): Promise<string> {
  const pages = pdf.getPages();
  const pageHeight = pages[pageNumber].getSize().height;

  const options = {
    pagerender: async (pageData: PDFPageProxy) => {
      // Only process the specified page
      if (pageData._pageIndex !== pageNumber) {
        return '';
      }

      const textContent = await pageData.getTextContent();
      const textItems: Array<{ text: string; y: number; x: number }> = [];

      const items = textContent.items as TextItem[];
      let index = 0;
      while (index < items.length) {
        const item = items[index];
        const { groupedText, groupingIndex } = groupCharactersText(items, index, textContent);

        // Top to bottom conversion
        const y = Math.trunc(pageHeight - item.transform[5]);
        // Only include text within region
        if (startX !== undefined && endX !== undefined) {
          const x = Math.trunc(item.transform[4]);
          if (x >= startX && x <= endX && y >= startY && y <= endY) {
            textItems.push({
              text: groupedText,
              y: y,
              x: x,
            });
          }
        } else if (y >= startY && y <= endY) {
          textItems.push({
            text: groupedText,
            y: y,
            x: item.transform[4],
          });
        }
        index = index + groupingIndex + 1;
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

function groupCharactersText(items: TextItem[], index: number, textContent: TextContent) {
  let groupingIndex = 0;
  let groupedText = '';
  let groupedWidth = 0;
  while (groupingIndex <= items.length) {
    const firstCharacterItem = items[index + groupingIndex];
    if (groupedText === '') {
      groupedText += firstCharacterItem.str;
      groupedWidth += firstCharacterItem.width || 0;
    }
    const nextItem = textContent.items[index + groupingIndex + 1] as TextItem;
    if (
      nextItem &&
      // x
      Math.abs(nextItem.transform[4] - firstCharacterItem.transform[4]) < 7 &&
      // y
      Math.abs(nextItem.transform[5] - firstCharacterItem.transform[5]) < 7
    ) {
      groupedText += nextItem.str;
      groupedWidth += nextItem.width || 0;
      groupingIndex++;
    } else {
      break;
    }
  }
  return { groupedText, groupedWidth, groupingIndex };
}
