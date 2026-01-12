import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Imap from 'imap';
import { EmailMessage } from './email.interface';
import { simpleParser, ParsedMail } from 'mailparser';
import { Readable } from 'node:stream';
import * as cheerio from 'cheerio';

export interface EmailTransaction {
  date: Date;
  paymentMethodNumber: string;
  currency: string;
  amount: string;
  location: string;
  description: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly imapConfig: Imap.Config;

  constructor(private readonly configService: ConfigService) {
    // Initialize IMAP configuration from environment variables
    this.imapConfig = {
      user: this.configService.get<string>('EMAIL_USER') ?? '',
      password: this.configService.get<string>('EMAIL_PASSWORD') ?? '',
      host: this.configService.get<string>('EMAIL_HOST', 'imap.gmail.com'),
      port: this.configService.get<number>('EMAIL_PORT', 993),
      tls: this.configService.get<boolean>('EMAIL_TLS', true),
      tlsOptions: {
        rejectUnauthorized: false,
      },
      authTimeout: this.configService.get<number>('EMAIL_AUTH_TIMEOUT', 10000),
    };
  }

  /**
   * Connect to IMAP server and read emails
   * @param folder - Email folder to read from (default: 'INBOX')
   * @param limit - Number of emails to fetch (default: 10)
   * @returns Array of parsed email messages
   */
  async readEmails(folder: string = 'INBOX', limit: number = 10): Promise<EmailMessage[]> {
    return new Promise((resolve, reject) => {
      const emails: EmailMessage[] = [];
      const imap = new Imap(this.imapConfig);

      imap.once('ready', () => {
        this.logger.log('IMAP connection established');

        imap.openBox(folder, false, (err, box) => {
          if (err) {
            this.logger.error('Failed to open mailbox', err);
            imap.end();
            return reject(new Error(err.message));
          }

          // Fetch latest emails
          const fetchRange = Math.max(1, box.messages.total - limit + 1) + ':*';
          const fetch = imap.seq.fetch(fetchRange, {
            bodies: 'TEXT',
            struct: true,
            envelope: true,
          });

          fetch.on('message', (msg, seqno) => {
            const prefix = `(#${seqno})`;
            let buffer = '';

            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });

              stream.once('end', async () => {
                try {
                  const parsed = await this.parseEmail(buffer);
                  emails.push(this.formatEmail(parsed, seqno.toString()));
                } catch (parseErr) {
                  this.logger.error(`${prefix} Parsing error:`, parseErr);
                }
              });
            });

            msg.once('attributes', (attrs) => {
              this.logger.debug(`${prefix} Attributes:`, attrs);
            });

            msg.once('end', () => {
              this.logger.debug(`${prefix} Finished`);
            });
          });

          fetch.once('error', (err) => {
            this.logger.error('Fetch error:', err);
            reject(new Error(err.message));
          });

          fetch.once('end', () => {
            this.logger.log(`Fetched ${emails.length} emails`);
            imap.end();
          });
        });
      });

      imap.once('error', (err: Error) => {
        this.logger.error('IMAP error:', err);
        reject(new Error(err.message));
      });

      imap.once('end', () => {
        this.logger.log('IMAP connection ended');
        resolve(emails);
      });

      imap.connect();
    });
  }

  /**
   * Read emails with specific search criteria
   * @param criteria - IMAP search criteria
   * @param folder - Email folder to search in
   * @returns Array of parsed email messages matching criteria
   */
  async searchEmails(criteria: string[][], folder: string = 'INBOX'): Promise<EmailTransaction[]> {
    return new Promise((resolve, reject) => {
      const emails: EmailTransaction[] = [];
      const imap = new Imap(this.imapConfig);

      imap.once('ready', () => {
        this.logger.log('IMAP connection established for search');

        imap.openBox(folder, false, (err, box) => {
          if (err) {
            this.logger.error('Failed to open mailbox for search', err);
            imap.end();
            return reject(err);
          }

          imap.search(criteria, (err, results) => {
            if (err) {
              this.logger.error('Search error:', err);
              imap.end();
              return reject(err);
            }

            if (!results || results.length === 0) {
              this.logger.log('No emails found matching criteria');
              imap.end();
              return resolve([]);
            }

            const fetch = imap.fetch(results, {
              bodies: 'TEXT',
              struct: true,
              envelope: true,
            });

            fetch.on('message', (msg, seqno) => {
              let buffer = '';

              msg.on('body', (stream) => {
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });

                stream.once('end', async () => {
                  try {
                    const parsed = await this.parseEmail(buffer);
                    const Emailtransaction = this.extractEmailTransaction(parsed.html || '');
                    if (Emailtransaction) {
                      emails.push(Emailtransaction);
                    }
                  } catch (error_) {
                    this.logger.error(`Parsing error for message ${seqno}:`, error_);
                  }
                });
              });
            });

            fetch.once('error', (err) => {
              this.logger.error('Fetch error during search:', err);
              reject(err);
            });

            fetch.once('end', () => {
              this.logger.log(`Found ${emails.length} emails matching criteria`);
              imap.end();
            });
          });
        });
      });

      imap.once('error', (err: Error) => {
        this.logger.error('IMAP error during search:', err);
        reject(new Error(err.message));
      });

      imap.once('end', () => {
        this.logger.log('IMAP search connection ended');
        resolve(emails);
      });

      imap.connect();
    });
  }

  /**
   * Parse raw email data
   * @param rawEmail - Raw email string
   * @returns Parsed email object
   */
  private async parseEmail(rawEmail: string): Promise<ParsedMail> {
    const stream = Readable.from(rawEmail);
    return await simpleParser(stream);
  }

  /**
   * Format parsed email into EmailMessage interface
   * @param parsed - Parsed email from mailparser
   * @param id - Email ID/sequence number
   * @returns Formatted email message
   */
  private formatEmail(parsed: ParsedMail, id: string): EmailMessage {
    return {
      id,
      from: parsed.from?.text || '',
      to: '',
      subject: parsed.subject || '',
      date: parsed.date || new Date(),
      text: parsed.text || '',
      html: parsed.html || '',
      attachments:
        parsed.attachments?.map((att) => ({
          filename: att.filename || 'unknown',
          contentType: att.contentType || 'application/octet-stream',
          size: att.size || 0,
        })) || [],
    };
  }

  /**
   * Get emails by subject
   * @param filters - Filters for search
   * @param folder - Email folder to search in
   * @returns Array of email messages matching subject
   */
  async filterEmails(filters: string[][], folder: string = 'INBOX'): Promise<EmailTransaction[]> {
    return this.searchEmails(filters, folder);
  }

  extractEmailTransaction(html: string): EmailTransaction | null {
    // Regular expression to match the transaction pattern
    // Pattern: "compra por $X con Tarjeta de Cr&eacute;dito ****XXXX en [DESCRIPTION] [LOCATION] el DD/MM/YYYY HH:MM"

    const $ = cheerio.load(html);

    const text = $('body').text().replaceAll(/\s+/g, ' ').trim();

    // Break down the regex into simpler parts to reduce complexity
    const currencyPattern = String.raw`(US\$|\$)`;
    const amountPattern = String.raw`([\d.,]+)`;
    const cardPattern = String.raw`\*{4}(\d{4})`;
    const datePattern = String.raw`(\d{2}/\d{2}/\d{4})`;
    const timePattern = String.raw`(\d{2}:\d{2})`;

    const transactionRegex = new RegExp(
      String.raw`compra\s+por\s+${currencyPattern}\s*${amountPattern}\s+con\s+Tarjeta\s+de\s+Cr[eé]dito\s+${cardPattern}\s+en\s+(.+?)\s+el\s+${datePattern}\s+${timePattern}`,
      'i',
    );

    const match = transactionRegex.exec(text);

    if (!match) {
      this.logger.warn('No transaction data found in email');
      return null;
    }

    const [, currencyWithSymbol, amount, cardNumber, locationAndDescription, date, time] = match;

    // Split location and description
    // Format is typically: "DESCRIPTION       LOCATION     COUNTRY_CODE"
    // Multiple spaces separate the fields
    const parts = locationAndDescription.trim().split(/\s{2,}/); // Split by 2 or more spaces

    let description = '';
    let location = '';

    if (parts.length >= 2) {
      // First part is description, rest is location
      description = parts[0].trim();
      location = parts.slice(1).join(' ').trim();
    } else {
      // If we can't split properly, use the whole thing as description
      description = locationAndDescription.trim();
    }

    // Extract currency code from captured group (e.g., "US$" -> "US", "$" -> "CLP")
    let currency = 'CLP';
    if (currencyWithSymbol) {
      const currencyRegex = /([A-Z]{2,3})/;
      const currencyMatch = currencyRegex.exec(currencyWithSymbol);
      if (currencyMatch) {
        currency = currencyMatch[1];
      }
    }

    const cleanAmount = amount.replaceAll(/[,.]/g, (match, offset, string) => {
      // Replace commas with nothing (thousands separator)
      // Keep the last period/comma as decimal separator
      const lastDot = string.lastIndexOf('.');
      const lastComma = string.lastIndexOf(',');
      const lastSeparator = Math.max(lastDot, lastComma);
      return offset === lastSeparator ? '.' : '';
    });

    const [day, month, year] = date.split('/').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    // Create Date object in local timezone
    // Note: Month is 0-indexed in JavaScript Date
    const transactionDate = new Date(year, month - 1, day, hours, minutes);

    const Emailtransaction: EmailTransaction = {
      date: transactionDate,
      paymentMethodNumber: cardNumber,
      currency: currency,
      amount: cleanAmount,
      location: location,
      description: description,
    };

    this.logger.log(
      `Extracted transaction - Date: ${Emailtransaction.date}, Amount: ${Emailtransaction.currency} ${Emailtransaction.amount}, Card: ${Emailtransaction.paymentMethodNumber}, Description: ${Emailtransaction.description}, Location: ${Emailtransaction.location}`,
    );

    return Emailtransaction;
  }
}
