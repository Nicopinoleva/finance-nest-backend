import axios from 'axios';
import { CaptchaService } from './captcha.utils';
import { Logger } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { formatInTimeZone } from 'date-fns-tz';

interface LiderBCILoginResponse {
  access_token: string;
  refresh_token: string;
  token_expires_in: number;
  refresh_expires_in: number;
}

interface LiderBCIUnbilledExpense {
  descripcion: string;
  fecha: string;
  monto: number;
  tipo: string;
  cuota: string;
}

export interface LiderBCIUnbilledExpensesResponse {
  movimiento: LiderBCIUnbilledExpense[];
}

export async function getLiderUnbilledExpenses(pubSub?: PubSub) {
  const logger = new Logger('LiderBCIUtil');
  const log = (level: 'log' | 'error', message: string) => {
    logger[level](message);
    pubSub?.publish('EXPENSE_LOGS', {
      expenseLogs: {
        level,
        message,
        context: 'LiderBCIUtil',
        timestamp: formatInTimeZone(new Date(), 'America/Santiago', 'yyyy-MM-dd HH:mm:ss'),
      },
    });
  };
  log('log', 'Starting process to get Lider BCI unbilled expenses');
  if (
    !process.env.CAPTCHA_API_KEY ||
    !process.env.LIDER_BCI_URL ||
    !process.env.LIDER_BCI_SITEKEY ||
    !process.env.LIDER_BCI_USERNAME ||
    !process.env.LIDER_BCI_PASSWORD ||
    !process.env.LIDER_BCI_LOGIN_URL
  ) {
    throw new Error('LIDER BCI environment variables are not properly set');
  }
  log('log', 'Obtaining captcha token for Lider BCI');
  const captchaToken = await new CaptchaService(process.env.CAPTCHA_API_KEY).solveCloudflareTurnstile({
    pageurl: process.env.LIDER_BCI_URL,
    sitekey: process.env.LIDER_BCI_SITEKEY,
  });
  log('log', 'Captcha token obtained for Lider BCI');
  const liderBCILoginResponse = await loginLiderBCI(captchaToken.data);
  if (liderBCILoginResponse instanceof Error) {
    log('error', 'Error logging into Lider BCI');
    return liderBCILoginResponse;
  }
  log('log', 'Successfully logged into Lider BCI');
  const liderUnbilledExpensesData = await liderUnbilledExpenses(liderBCILoginResponse.access_token);
  if (liderUnbilledExpensesData instanceof Error) {
    log('error', 'Error fetching Lider BCI unbilled expenses');
    return liderUnbilledExpensesData;
  }
  log('log', `Successfully fetched ${liderUnbilledExpensesData.movimiento.length} Lider BCI unbilled expenses`);
  return liderUnbilledExpensesData;
}

async function loginLiderBCI(captchaToken: string) {
  const body = JSON.stringify({
    user: process.env.LIDER_BCI_USERNAME,
    pass: process.env.LIDER_BCI_PASSWORD,
    channel: 'WEB',
    os: 'Firefox',
    type: 'COMPLETO',
    tokenCaptcha: captchaToken,
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: process.env.LIDER_BCI_LOGIN_URL,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0',
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Content-Type': 'application/json',
      Origin: 'https://www.liderbciserviciosfinancieros.cl',
      Connection: 'keep-alive',
      Referer: 'https://www.liderbciserviciosfinancieros.cl/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      Priority: 'u=0',
      TE: 'trailers',
    },
    data: body,
  };

  return await axios
    .request(config)
    .then((response: { data: LiderBCILoginResponse }) => {
      return response.data;
    })
    .catch((error: Error) => {
      return error;
    });
}

async function liderUnbilledExpenses(accessToken: string) {
  const data = JSON.stringify({ rutin: '194102356' });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api-ssff.retailcard.cl/ssff-api-creditcard/api/movfacturarpesos',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0',
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Content-Type': 'application/json',
      Origin: 'https://www.liderbciserviciosfinancieros.cl',
      Connection: 'keep-alive',
      Referer: 'https://www.liderbciserviciosfinancieros.cl/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      Authorization: `bearer ${accessToken}`,
      TE: 'trailers',
    },
    data: data,
  };
  return await axios
    .request(config)
    .then((response: { data: LiderBCIUnbilledExpensesResponse }) => {
      return response.data;
    })
    .catch((error: Error) => {
      return error;
    });
}
