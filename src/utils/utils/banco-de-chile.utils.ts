import { Logger } from '@nestjs/common';
import axios from 'axios';

export interface BancoDeChileCreditCardsIdsResponse {
  idProducto: string;
  marca: string;
  numero: string;
  tipo: string;
  titular: boolean;
}

export interface BancoDeChileUnbilledExpenseCreditCard {
  tarjetaHabiente: string;
  fechaFacturacionAnterior: number;
  fechaAhora: number;
  fechaFacturacionAnteriorString: string;
  fechaAhoraString: string;
  fechaProximaFacturacionCalendario: string;
  listaMovNoFactur: BancoDeChileUnbilledExpense[];
}

export interface BancoDeChileUnbilledExpense {
  origenTransaccion: string;
  fechaTransaccion: number;
  fechaTransaccionString: string;
  montoCompra: number;
  glosaTransaccion: string;
  codigoComercioTBK: number;
  codigoComercioINT: string;
  nombreComercio: string;
  rubroComercio: string;
  codigoPaisComercio: string;
  ciudad: string;
  fechaAutorizacion: string;
  horaAutorizacion: string;
  numeroTarjeta: string;
  descripcionTransaccion: string;
  montoMonedaOrigen: string;
  codigoMonedaOrigen: number;
  despliegueCuotas: string;
  numeroCuotas: string;
  numeroTotalCuotas: string;
  tipoTarjeta: string;
  fechaAutorizacionString: string;
  montoCompraString: string;
  nombreTarjetaHabiente: string;
  numeroTarjetaCompleto: string | null;
}

export async function getBancoDeChileUnbilledExpenses() {
  const logger = new Logger('BancoDeChileUtil');
  logger.log('Starting process to get Banco de Chile unbilled expenses');

  if (
    !process.env.BROWSERLESS_TOKEN ||
    !process.env.BANCO_DE_CHILE_URL ||
    !process.env.BANCO_DE_CHILE_USERNAME ||
    !process.env.BANCO_DE_CHILE_PASSWORD
  ) {
    throw new Error('BANCO DE CHILE environment variables are not properly set');
  }

  const cookies = await fetchBancoDeChileLoginCookies();
  if (cookies instanceof Error) {
    logger.error('Error logging into Banco de Chile', cookies);
    return;
  }
  if (!cookies.some((cookie) => cookie.name === 'mod_auth_openidc_session')) {
    logger.error('Login to Banco de Chile was not successful, session cookie not found');
    return;
  }
  logger.log('Successfully logged into Banco de Chile, fetching credit cards ids');
  const creditCardsIdsResponse = await fetchBancoDeChileCreditCardsIds(cookies as { name: string; value: string }[]);
  if (creditCardsIdsResponse instanceof Error) {
    logger.error('Error fetching Banco de Chile credit cards ids', creditCardsIdsResponse);
    return;
  }
  logger.log('Successfully fetched Banco de Chile credit cards ids');

  const unbilledExpensesResultMap = new Map<string, BancoDeChileUnbilledExpenseCreditCard>();

  for (const creditCard of creditCardsIdsResponse) {
    logger.log(`Fetching unbilled expenses for credit card ${creditCard.numero}`);
    const unbilledExpensesResponse = await fetchBancoDeChileUnbilledExpensesForCreditCard(
      creditCard.idProducto,
      cookies as { name: string; value: string }[],
    );
    if (unbilledExpensesResponse instanceof Error) {
      logger.error(`Error fetching unbilled expenses for credit card ${creditCard.numero}`, unbilledExpensesResponse);
    } else {
      logger.log(`Successfully fetched unbilled expenses for credit card ${creditCard.numero}`);
      unbilledExpensesResultMap.set(creditCard.numero, unbilledExpensesResponse);
    }
  }
  return unbilledExpensesResultMap;
}

async function fetchBancoDeChileLoginCookies(): Promise<{ name: string; value: string }[] | Error> {
  const config = {
    method: 'POST',
    url: 'https://production-sfo.browserless.io/stealth/bql',
    params: {
      token: process.env.BROWSERLESS_TOKEN,
      proxy: 'residential',
      blockConsentModals: true,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      query: `
        mutation LoginAndExtractCookies {
            viewport(width: 1366, height: 768) {
                width
                height
                time
            }
            goto(
                url: "${process.env.BANCO_DE_CHILE_URL}",
                waitUntil: domContentLoaded
            ) {
                status
            }
            typeUsername: type(
                selector: "#ppriv_per-login-click-input-rut"
                text: "${process.env.BANCO_DE_CHILE_USERNAME}"
            ) {
                time
            }
            typePassword: type(
                selector: "#ppriv_per-login-click-input-password"
                text: "${process.env.BANCO_DE_CHILE_PASSWORD}"
            ) {
                time
            }
            click(selector: "#ppriv_per-login-click-ingresar-login") {
                time
            }
            waitForRequest(url: "https://portalpersonas.bancochile.cl/mibancochile/rest/persona/ultimos-accesos/acceso/obtener-ultimo") {
                url
            }
            cookies {
                cookies {
                    value
                    name
                }
            }
        }
      `,
      operationName: 'LoginAndExtractCookies',
    },
  };

  return await axios
    .request(config)
    .then((response) => {
      return response.data.data.cookies.cookies;
    })
    .catch((error: Error) => {
      return error;
    });
}

async function fetchBancoDeChileCreditCardsIds(
  cookies: { name: string; value: string }[],
): Promise<BancoDeChileCreditCardsIdsResponse[] | Error> {
  let data = JSON.stringify({});

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://portalpersonas.bancochile.cl/mibancochile/rest/persona/tarjetas/widget/informacion-tarjetas',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      Referer: 'https://portalpersonas.bancochile.cl/mibancochile-web/front/persona/index.html',
      'Content-Type': 'application/json',
      Origin: 'https://portalpersonas.bancochile.cl',
      Connection: 'keep-alive',
      Cookie: cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; '),
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    },
    data: data,
  };

  return await axios
    .request(config)
    .then((response: { data: BancoDeChileCreditCardsIdsResponse[] }) => {
      return response.data;
    })
    .catch((error) => {
      return error;
    });
}

async function fetchBancoDeChileUnbilledExpensesForCreditCard(
  creditCardId: string,
  cookies: { name: string; value: string }[],
): Promise<BancoDeChileUnbilledExpenseCreditCard | Error> {
  let data = JSON.stringify({
    idTarjeta: creditCardId,
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://portalpersonas.bancochile.cl/mibancochile/rest/persona/tarjeta-credito-digital/movimientos-no-facturados',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      Referer: 'https://portalpersonas.bancochile.cl/mibancochile-web/front/persona/index.html',
      'Content-Type': 'application/json',
      Origin: 'https://portalpersonas.bancochile.cl',
      Connection: 'keep-alive',
      Cookie: cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; '),
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      Priority: 'u=0',
    },
    data: data,
  };

  return await axios
    .request(config)
    .then((response) => {
      return response.data as BancoDeChileUnbilledExpenseCreditCard;
    })
    .catch((error) => {
      return error;
    });
}
