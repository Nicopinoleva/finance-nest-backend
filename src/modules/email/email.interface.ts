export interface EmailConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  authTimeout?: number;
}

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: Date;
  text: string;
  html: string;
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
}
