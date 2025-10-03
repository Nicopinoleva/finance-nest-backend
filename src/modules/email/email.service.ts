import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Imap from 'imap';
import { EmailMessage } from './email.interface';
import { simpleParser, ParsedMail } from 'mailparser';
import { Readable } from 'stream';

interface TransactionData {
  date: string;
  paymentMethodNumber: string;
  currency: string;
  amount: string;
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
  async searchEmails(criteria: string[][], folder: string = 'INBOX'): Promise<EmailMessage[]> {
    return new Promise((resolve, reject) => {
      const emails: EmailMessage[] = [];
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

            const fetch = imap.fetch(results.slice(0, 10), {
              bodies: 'TEXT',
              struct: true,
              envelope: true,
            });

            fetch.on('message', (msg, seqno) => {
              let buffer = '';

              msg.on('body', (stream, info) => {
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });

                stream.once('end', async () => {
                  try {
                    const parsed = await this.parseEmail(buffer);
                    this.extractTransactionData(parsed.text || '');
                    emails.push(this.formatEmail(parsed, seqno.toString()));
                  } catch (parseErr) {
                    this.logger.error(`Parsing error for message ${seqno}:`, parseErr);
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
  async filterEmails(filters: string[][], folder: string = 'INBOX'): Promise<EmailMessage[]> {
    return this.searchEmails(filters, folder);
  }

  extractTransactionData(text: string): TransactionData | null {
    // Regular expression to match the transaction pattern
    // Looking for: "compra por US$X,XX con Tarjeta de Crédito ****XXXX en ... el DD/MM/YYYY HH:MM"
    const transactionRegex =
      /compra por\s+([A-Z$]+)([\d,\.]+)\s+con Tarjeta de Crédito\s+\*{4}(\d{4})\s+en.*?el\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})/i;

    const match = transactionRegex.exec(text);

    if (!match) {
      return null;
    }

    const [, currency, amount, cardNumber, date, time] = match;

    this.logger.log(
      `Extracted transaction - Date: ${date} ${time}, Amount: ${currency} ${amount}, Card: ****${cardNumber}`,
    );

    return {
      date: `${date} ${time}`, // Full date with time
      paymentMethodNumber: `****${cardNumber}`, // Keep the masked format
      currency: currency.replace('$', ''), // Remove $ symbol, keep currency code
      amount: amount,
    };

    //   /**
    //    * Get emails within date range
    //    * @param since - Start date
    //    * @param before - End date
    //    * @param folder - Email folder to search in
    //    * @returns Array of email messages within date range
    //    */
    //   async getEmailsByDateRange(since: Date, before: Date, folder: string = 'INBOX'): Promise<EmailMessage[]> {
    //     const sinceStr = since.toISOString().split('T')[0];
    //     const beforeStr = before.toISOString().split('T')[0];
    //     return this.searchEmails(['SINCE', sinceStr, 'BEFORE', beforeStr], folder);
    //   }
  }
}
