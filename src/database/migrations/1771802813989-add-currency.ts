import { MigrationInterface, QueryRunner } from 'typeorm';

const CURRENCIES = [
  { numericCode: 971, alphabeticCode: 'AFN', name: 'Afghani', minorUnit: 2 },
  { numericCode: 8, alphabeticCode: 'ALL', name: 'Lek', minorUnit: 2 },
  { numericCode: 12, alphabeticCode: 'DZD', name: 'Algerian Dinar', minorUnit: 2 },
  { numericCode: 840, alphabeticCode: 'USD', name: 'US Dollar', minorUnit: 2 },
  { numericCode: 978, alphabeticCode: 'EUR', name: 'Euro', minorUnit: 2 },
  { numericCode: 973, alphabeticCode: 'AOA', name: 'Kwanza', minorUnit: 2 },
  { numericCode: 951, alphabeticCode: 'XCD', name: 'East Caribbean Dollar', minorUnit: 2 },
  { numericCode: 32, alphabeticCode: 'ARS', name: 'Argentine Peso', minorUnit: 2 },
  { numericCode: 51, alphabeticCode: 'AMD', name: 'Armenian Dram', minorUnit: 2 },
  { numericCode: 533, alphabeticCode: 'AWG', name: 'Aruban Florin', minorUnit: 2 },
  { numericCode: 36, alphabeticCode: 'AUD', name: 'Australian Dollar', minorUnit: 2 },
  { numericCode: 944, alphabeticCode: 'AZN', name: 'Azerbaijan Manat', minorUnit: 2 },
  { numericCode: 44, alphabeticCode: 'BSD', name: 'Bahamian Dollar', minorUnit: 2 },
  { numericCode: 48, alphabeticCode: 'BHD', name: 'Bahraini Dinar', minorUnit: 3 },
  { numericCode: 50, alphabeticCode: 'BDT', name: 'Taka', minorUnit: 2 },
  { numericCode: 52, alphabeticCode: 'BBD', name: 'Barbados Dollar', minorUnit: 2 },
  { numericCode: 933, alphabeticCode: 'BYN', name: 'Belarusian Ruble', minorUnit: 2 },
  { numericCode: 84, alphabeticCode: 'BZD', name: 'Belize Dollar', minorUnit: 2 },
  { numericCode: 952, alphabeticCode: 'XOF', name: 'CFA Franc BCEAO', minorUnit: 0 },
  { numericCode: 60, alphabeticCode: 'BMD', name: 'Bermudian Dollar', minorUnit: 2 },
  { numericCode: 64, alphabeticCode: 'BTN', name: 'Ngultrum', minorUnit: 2 },
  { numericCode: 356, alphabeticCode: 'INR', name: 'Indian Rupee', minorUnit: 2 },
  { numericCode: 68, alphabeticCode: 'BOB', name: 'Boliviano', minorUnit: 2 },
  { numericCode: 984, alphabeticCode: 'BOV', name: 'Mvdol', minorUnit: 2 },
  { numericCode: 977, alphabeticCode: 'BAM', name: 'Convertible Mark', minorUnit: 2 },
  { numericCode: 72, alphabeticCode: 'BWP', name: 'Pula', minorUnit: 2 },
  { numericCode: 578, alphabeticCode: 'NOK', name: 'Norwegian Krone', minorUnit: 2 },
  { numericCode: 986, alphabeticCode: 'BRL', name: 'Brazilian Real', minorUnit: 2 },
  { numericCode: 96, alphabeticCode: 'BND', name: 'Brunei Dollar', minorUnit: 2 },
  { numericCode: 975, alphabeticCode: 'BGN', name: 'Bulgarian Lev', minorUnit: 2 },
  { numericCode: 108, alphabeticCode: 'BIF', name: 'Burundi Franc', minorUnit: 0 },
  { numericCode: 132, alphabeticCode: 'CVE', name: 'Cabo Verde Escudo', minorUnit: 2 },
  { numericCode: 116, alphabeticCode: 'KHR', name: 'Riel', minorUnit: 2 },
  { numericCode: 950, alphabeticCode: 'XAF', name: 'CFA Franc BEAC', minorUnit: 0 },
  { numericCode: 124, alphabeticCode: 'CAD', name: 'Canadian Dollar', minorUnit: 2 },
  { numericCode: 136, alphabeticCode: 'KYD', name: 'Cayman Islands Dollar', minorUnit: 2 },
  { numericCode: 990, alphabeticCode: 'CLF', name: 'Unidad de Fomento', minorUnit: 4 },
  { numericCode: 152, alphabeticCode: 'CLP', name: 'Chilean Peso', minorUnit: 0 },
  { numericCode: 156, alphabeticCode: 'CNY', name: 'Yuan Renminbi', minorUnit: 2 },
  { numericCode: 170, alphabeticCode: 'COP', name: 'Colombian Peso', minorUnit: 2 },
  { numericCode: 970, alphabeticCode: 'COU', name: 'Unidad de Valor Real', minorUnit: 2 },
  { numericCode: 174, alphabeticCode: 'KMF', name: 'Comorian Franc', minorUnit: 0 },
  { numericCode: 976, alphabeticCode: 'CDF', name: 'Congolese Franc', minorUnit: 2 },
  { numericCode: 554, alphabeticCode: 'NZD', name: 'New Zealand Dollar', minorUnit: 2 },
  { numericCode: 188, alphabeticCode: 'CRC', name: 'Costa Rican Colon', minorUnit: 2 },
  { numericCode: 191, alphabeticCode: 'HRK', name: 'Kuna', minorUnit: 2 },
  { numericCode: 192, alphabeticCode: 'CUP', name: 'Cuban Peso', minorUnit: 2 },
  { numericCode: 931, alphabeticCode: 'CUC', name: 'Peso Convertible', minorUnit: 2 },
  { numericCode: 532, alphabeticCode: 'ANG', name: 'Netherlands Antillean Guilder', minorUnit: 2 },
  { numericCode: 203, alphabeticCode: 'CZK', name: 'Czech Koruna', minorUnit: 2 },
  { numericCode: 208, alphabeticCode: 'DKK', name: 'Danish Krone', minorUnit: 2 },
  { numericCode: 262, alphabeticCode: 'DJF', name: 'Djibouti Franc', minorUnit: 0 },
  { numericCode: 214, alphabeticCode: 'DOP', name: 'Dominican Peso', minorUnit: 2 },
  { numericCode: 818, alphabeticCode: 'EGP', name: 'Egyptian Pound', minorUnit: 2 },
  { numericCode: 222, alphabeticCode: 'SVC', name: 'El Salvador Colon', minorUnit: 2 },
  { numericCode: 232, alphabeticCode: 'ERN', name: 'Nakfa', minorUnit: 2 },
  { numericCode: 230, alphabeticCode: 'ETB', name: 'Ethiopian Birr', minorUnit: 2 },
  { numericCode: 238, alphabeticCode: 'FKP', name: 'Falkland Islands Pound', minorUnit: 2 },
  { numericCode: 242, alphabeticCode: 'FJD', name: 'Fiji Dollar', minorUnit: 2 },
  { numericCode: 953, alphabeticCode: 'XPF', name: 'CFP Franc', minorUnit: 0 },
  { numericCode: 270, alphabeticCode: 'GMD', name: 'Dalasi', minorUnit: 2 },
  { numericCode: 981, alphabeticCode: 'GEL', name: 'Lari', minorUnit: 2 },
  { numericCode: 936, alphabeticCode: 'GHS', name: 'Ghana Cedi', minorUnit: 2 },
  { numericCode: 292, alphabeticCode: 'GIP', name: 'Gibraltar Pound', minorUnit: 2 },
  { numericCode: 320, alphabeticCode: 'GTQ', name: 'Quetzal', minorUnit: 2 },
  { numericCode: 826, alphabeticCode: 'GBP', name: 'Pound Sterling', minorUnit: 2 },
  { numericCode: 324, alphabeticCode: 'GNF', name: 'Guinean Franc', minorUnit: 0 },
  { numericCode: 328, alphabeticCode: 'GYD', name: 'Guyana Dollar', minorUnit: 2 },
  { numericCode: 332, alphabeticCode: 'HTG', name: 'Gourde', minorUnit: 2 },
  { numericCode: 340, alphabeticCode: 'HNL', name: 'Lempira', minorUnit: 2 },
  { numericCode: 344, alphabeticCode: 'HKD', name: 'Hong Kong Dollar', minorUnit: 2 },
  { numericCode: 348, alphabeticCode: 'HUF', name: 'Forint', minorUnit: 2 },
  { numericCode: 352, alphabeticCode: 'ISK', name: 'Iceland Krona', minorUnit: 0 },
  { numericCode: 360, alphabeticCode: 'IDR', name: 'Rupiah', minorUnit: 2 },
  { numericCode: 960, alphabeticCode: 'XDR', name: 'SDR (Special Drawing Right)', minorUnit: null },
  { numericCode: 364, alphabeticCode: 'IRR', name: 'Iranian Rial', minorUnit: 2 },
  { numericCode: 368, alphabeticCode: 'IQD', name: 'Iraqi Dinar', minorUnit: 3 },
  { numericCode: 376, alphabeticCode: 'ILS', name: 'New Israeli Sheqel', minorUnit: 2 },
  { numericCode: 388, alphabeticCode: 'JMD', name: 'Jamaican Dollar', minorUnit: 2 },
  { numericCode: 392, alphabeticCode: 'JPY', name: 'Yen', minorUnit: 0 },
  { numericCode: 400, alphabeticCode: 'JOD', name: 'Jordanian Dinar', minorUnit: 3 },
  { numericCode: 398, alphabeticCode: 'KZT', name: 'Tenge', minorUnit: 2 },
  { numericCode: 404, alphabeticCode: 'KES', name: 'Kenyan Shilling', minorUnit: 2 },
  { numericCode: 408, alphabeticCode: 'KPW', name: 'North Korean Won', minorUnit: 2 },
  { numericCode: 410, alphabeticCode: 'KRW', name: 'Won', minorUnit: 0 },
  { numericCode: 414, alphabeticCode: 'KWD', name: 'Kuwaiti Dinar', minorUnit: 3 },
  { numericCode: 417, alphabeticCode: 'KGS', name: 'Som', minorUnit: 2 },
  { numericCode: 418, alphabeticCode: 'LAK', name: 'Lao Kip', minorUnit: 2 },
  { numericCode: 422, alphabeticCode: 'LBP', name: 'Lebanese Pound', minorUnit: 2 },
  { numericCode: 426, alphabeticCode: 'LSL', name: 'Loti', minorUnit: 2 },
  { numericCode: 710, alphabeticCode: 'ZAR', name: 'Rand', minorUnit: 2 },
  { numericCode: 430, alphabeticCode: 'LRD', name: 'Liberian Dollar', minorUnit: 2 },
  { numericCode: 434, alphabeticCode: 'LYD', name: 'Libyan Dinar', minorUnit: 3 },
  { numericCode: 756, alphabeticCode: 'CHF', name: 'Swiss Franc', minorUnit: 2 },
  { numericCode: 446, alphabeticCode: 'MOP', name: 'Pataca', minorUnit: 2 },
  { numericCode: 807, alphabeticCode: 'MKD', name: 'Denar', minorUnit: 2 },
  { numericCode: 969, alphabeticCode: 'MGA', name: 'Malagasy Ariary', minorUnit: 2 },
  { numericCode: 454, alphabeticCode: 'MWK', name: 'Malawi Kwacha', minorUnit: 2 },
  { numericCode: 458, alphabeticCode: 'MYR', name: 'Malaysian Ringgit', minorUnit: 2 },
  { numericCode: 462, alphabeticCode: 'MVR', name: 'Rufiyaa', minorUnit: 2 },
  { numericCode: 929, alphabeticCode: 'MRU', name: 'Ouguiya', minorUnit: 2 },
  { numericCode: 480, alphabeticCode: 'MUR', name: 'Mauritius Rupee', minorUnit: 2 },
  { numericCode: 965, alphabeticCode: 'XUA', name: 'ADB Unit of Account', minorUnit: null },
  { numericCode: 484, alphabeticCode: 'MXN', name: 'Mexican Peso', minorUnit: 2 },
  { numericCode: 979, alphabeticCode: 'MXV', name: 'Mexican Unidad de Inversion (UDI)', minorUnit: 2 },
  { numericCode: 498, alphabeticCode: 'MDL', name: 'Moldovan Leu', minorUnit: 2 },
  { numericCode: 496, alphabeticCode: 'MNT', name: 'Tugrik', minorUnit: 2 },
  { numericCode: 504, alphabeticCode: 'MAD', name: 'Moroccan Dirham', minorUnit: 2 },
  { numericCode: 516, alphabeticCode: 'NAD', name: 'Namibia Dollar', minorUnit: 2 },
  { numericCode: 524, alphabeticCode: 'NPR', name: 'Nepalese Rupee', minorUnit: 2 },
  { numericCode: 558, alphabeticCode: 'NIO', name: 'Cordoba Oro', minorUnit: 2 },
  { numericCode: 566, alphabeticCode: 'NGN', name: 'Naira', minorUnit: 2 },
  { numericCode: 512, alphabeticCode: 'OMR', name: 'Rial Omani', minorUnit: 3 },
  { numericCode: 586, alphabeticCode: 'PKR', name: 'Pakistan Rupee', minorUnit: 2 },
  { numericCode: 590, alphabeticCode: 'PAB', name: 'Balboa', minorUnit: 2 },
  { numericCode: 598, alphabeticCode: 'PGK', name: 'Kina', minorUnit: 2 },
  { numericCode: 600, alphabeticCode: 'PYG', name: 'Guarani', minorUnit: 0 },
  { numericCode: 604, alphabeticCode: 'PEN', name: 'Sol', minorUnit: 2 },
  { numericCode: 608, alphabeticCode: 'PHP', name: 'Philippine Peso', minorUnit: 2 },
  { numericCode: 985, alphabeticCode: 'PLN', name: 'Zloty', minorUnit: 2 },
  { numericCode: 634, alphabeticCode: 'QAR', name: 'Qatari Rial', minorUnit: 2 },
  { numericCode: 946, alphabeticCode: 'RON', name: 'Romanian Leu', minorUnit: 2 },
  { numericCode: 643, alphabeticCode: 'RUB', name: 'Russian Ruble', minorUnit: 2 },
  { numericCode: 646, alphabeticCode: 'RWF', name: 'Rwanda Franc', minorUnit: 0 },
  { numericCode: 654, alphabeticCode: 'SHP', name: 'Saint Helena Pound', minorUnit: 2 },
  { numericCode: 682, alphabeticCode: 'SAR', name: 'Saudi Riyal', minorUnit: 2 },
  { numericCode: 941, alphabeticCode: 'RSD', name: 'Serbian Dinar', minorUnit: 2 },
  { numericCode: 690, alphabeticCode: 'SCR', name: 'Seychelles Rupee', minorUnit: 2 },
  { numericCode: 694, alphabeticCode: 'SLL', name: 'Leone', minorUnit: 2 },
  { numericCode: 925, alphabeticCode: 'SLE', name: 'Leone', minorUnit: 2 },
  { numericCode: 702, alphabeticCode: 'SGD', name: 'Singapore Dollar', minorUnit: 2 },
  { numericCode: 994, alphabeticCode: 'XSU', name: 'Sucre', minorUnit: null },
  { numericCode: 90, alphabeticCode: 'SBD', name: 'Solomon Islands Dollar', minorUnit: 2 },
  { numericCode: 706, alphabeticCode: 'SOS', name: 'Somali Shilling', minorUnit: 2 },
  { numericCode: 728, alphabeticCode: 'SSP', name: 'South Sudanese Pound', minorUnit: 2 },
  { numericCode: 144, alphabeticCode: 'LKR', name: 'Sri Lanka Rupee', minorUnit: 2 },
  { numericCode: 938, alphabeticCode: 'SDG', name: 'Sudanese Pound', minorUnit: 2 },
  { numericCode: 968, alphabeticCode: 'SRD', name: 'Surinam Dollar', minorUnit: 2 },
  { numericCode: 748, alphabeticCode: 'SZL', name: 'Lilangeni', minorUnit: 2 },
  { numericCode: 752, alphabeticCode: 'SEK', name: 'Swedish Krona', minorUnit: 2 },
  { numericCode: 947, alphabeticCode: 'CHE', name: 'WIR Euro', minorUnit: 2 },
  { numericCode: 948, alphabeticCode: 'CHW', name: 'WIR Franc', minorUnit: 2 },
  { numericCode: 760, alphabeticCode: 'SYP', name: 'Syrian Pound', minorUnit: 2 },
  { numericCode: 901, alphabeticCode: 'TWD', name: 'New Taiwan Dollar', minorUnit: 2 },
  { numericCode: 972, alphabeticCode: 'TJS', name: 'Somoni', minorUnit: 2 },
  { numericCode: 834, alphabeticCode: 'TZS', name: 'Tanzanian Shilling', minorUnit: 2 },
  { numericCode: 764, alphabeticCode: 'THB', name: 'Baht', minorUnit: 2 },
  { numericCode: 776, alphabeticCode: 'TOP', name: "Pa'anga", minorUnit: 2 },
  { numericCode: 780, alphabeticCode: 'TTD', name: 'Trinidad and Tobago Dollar', minorUnit: 2 },
  { numericCode: 788, alphabeticCode: 'TND', name: 'Tunisian Dinar', minorUnit: 3 },
  { numericCode: 949, alphabeticCode: 'TRY', name: 'Turkish Lira', minorUnit: 2 },
  { numericCode: 934, alphabeticCode: 'TMT', name: 'Turkmenistan New Manat', minorUnit: 2 },
  { numericCode: 800, alphabeticCode: 'UGX', name: 'Uganda Shilling', minorUnit: 0 },
  { numericCode: 980, alphabeticCode: 'UAH', name: 'Hryvnia', minorUnit: 2 },
  { numericCode: 784, alphabeticCode: 'AED', name: 'UAE Dirham', minorUnit: 2 },
  { numericCode: 997, alphabeticCode: 'USN', name: 'US Dollar (Next day)', minorUnit: 2 },
  { numericCode: 858, alphabeticCode: 'UYU', name: 'Peso Uruguayo', minorUnit: 2 },
  { numericCode: 940, alphabeticCode: 'UYI', name: 'Uruguay Peso en Unidades Indexadas (UI)', minorUnit: 0 },
  { numericCode: 927, alphabeticCode: 'UYW', name: 'Unidad Previsional', minorUnit: 4 },
  { numericCode: 860, alphabeticCode: 'UZS', name: 'Uzbekistan Sum', minorUnit: 2 },
  { numericCode: 548, alphabeticCode: 'VUV', name: 'Vatu', minorUnit: 0 },
  { numericCode: 937, alphabeticCode: 'VES', name: 'Bolívar Soberano', minorUnit: 2 },
  { numericCode: 704, alphabeticCode: 'VND', name: 'Dong', minorUnit: 0 },
  { numericCode: 882, alphabeticCode: 'WST', name: 'Tala', minorUnit: 2 },
  { numericCode: 886, alphabeticCode: 'YER', name: 'Yemeni Rial', minorUnit: 2 },
  { numericCode: 894, alphabeticCode: 'ZMW', name: 'Zambian Kwacha', minorUnit: 2 },
  { numericCode: 716, alphabeticCode: 'ZWL', name: 'Zimbabwe Dollar', minorUnit: 2 },
  {
    numericCode: 955,
    alphabeticCode: 'XBA',
    name: 'Bond Markets Unit European Composite Unit (EURCO)',
    minorUnit: null,
  },
  {
    numericCode: 956,
    alphabeticCode: 'XBB',
    name: 'Bond Markets Unit European Monetary Unit (E.M.U.-6)',
    minorUnit: null,
  },
  {
    numericCode: 957,
    alphabeticCode: 'XBC',
    name: 'Bond Markets Unit European Unit of Account 9 (E.U.A.-9)',
    minorUnit: null,
  },
  {
    numericCode: 958,
    alphabeticCode: 'XBD',
    name: 'Bond Markets Unit European Unit of Account 17 (E.U.A.-17)',
    minorUnit: null,
  },
  {
    numericCode: 963,
    alphabeticCode: 'XTS',
    name: 'Codes specifically reserved for testing purposes',
    minorUnit: null,
  },
  {
    numericCode: 999,
    alphabeticCode: 'XXX',
    name: 'The codes assigned for transactions where no currency is involved',
    minorUnit: null,
  },
  { numericCode: 959, alphabeticCode: 'XAU', name: 'Gold', minorUnit: null },
  { numericCode: 964, alphabeticCode: 'XPD', name: 'Palladium', minorUnit: null },
  { numericCode: 962, alphabeticCode: 'XPT', name: 'Platinum', minorUnit: null },
  { numericCode: 961, alphabeticCode: 'XAG', name: 'Silver', minorUnit: null },
];

export class AddCurrency1771802813989 implements MigrationInterface {
  name = 'AddCurrency1771802813989';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------ //
    // 1. Create the currency table
    // ------------------------------------------------------------------ //
    await queryRunner.query(`
      CREATE TABLE "currency" (
        "id"               uuid                NOT NULL DEFAULT uuid_generate_v4(),
        "numeric_code"     integer             NOT NULL,
        "alphabetic_code"  character(3)        NOT NULL,
        "name"             character varying(100) NOT NULL,
        "minor_unit"       integer,
        CONSTRAINT "UQ_5728c9395c45f76ac9876d26726" UNIQUE ("alphabetic_code"),
        CONSTRAINT "PK_3cda65c731a6264f0e444cc9b91" PRIMARY KEY ("id")
      )
    `);

    // ------------------------------------------------------------------ //
    // 2. Seed all ISO 4217 currencies
    // ------------------------------------------------------------------ //
    for (const c of CURRENCIES) {
      const minorUnitValue = c.minorUnit === null ? 'NULL' : c.minorUnit;
      await queryRunner.query(`
        INSERT INTO "currency" ("numeric_code", "alphabetic_code", "name", "minor_unit")
        VALUES (${c.numericCode}, '${c.alphabeticCode}', '${c.name.replace(/'/g, "''")}', ${minorUnitValue})
        ON CONFLICT ("alphabetic_code") DO NOTHING
      `);
    }

    // ------------------------------------------------------------------ //
    // 3. Rename old varchar currency column to a temp name so we can keep
    //    its values while we add the new FK column alongside it.
    //    Old values are the ISO numeric codes stored as strings: '152', '840'
    // ------------------------------------------------------------------ //
    await queryRunner.query(`
      ALTER TABLE "expense" RENAME COLUMN "currency" TO "currency_numeric_code_old"
    `);

    // ------------------------------------------------------------------ //
    // 4. Add the new uuid FK column (nullable first so existing rows don't
    //    violate NOT NULL before we backfill)
    // ------------------------------------------------------------------ //
    await queryRunner.query(`
      ALTER TABLE "expense" ADD COLUMN "currency_id" uuid
    `);

    // ------------------------------------------------------------------ //
    // 4b. Normalize bank-specific codes to standard ISO alphabetic codes.
    //     '0' is the code your bank returns for CLP in unbilled statements.
    // ------------------------------------------------------------------ //
    await queryRunner.query(`
      UPDATE "expense"
      SET    "currency_numeric_code_old" = 'CLP'
      WHERE  TRIM("currency_numeric_code_old") = '0'
    `);

    // ------------------------------------------------------------------ //
    // 5. Backfill: match old alphabetic code → currency.id
    //    Case-insensitive + trim to handle any casing/padding inconsistencies.
    //    Also handles numeric codes ('152', '840') via numeric_code fallback.
    // ------------------------------------------------------------------ //
    await queryRunner.query(`
      UPDATE "expense" e
      SET    "currency_id" = c."id"
      FROM   "currency" c
      WHERE  LOWER(TRIM(c."alphabetic_code")) = LOWER(TRIM(e."currency_numeric_code_old"))
         OR  c."numeric_code"::text = TRIM(e."currency_numeric_code_old")
    `);

    // ------------------------------------------------------------------ //
    // 5b. Safety check: fail with a clear message if any rows are unmatched
    // ------------------------------------------------------------------ //
    const unmatched: { val: string; cnt: string }[] = await queryRunner.query(`
      SELECT TRIM("currency_numeric_code_old") AS val, COUNT(*) AS cnt
      FROM   "expense"
      WHERE  "currency_id" IS NULL
      GROUP  BY TRIM("currency_numeric_code_old")
    `);

    if (unmatched.length > 0) {
      const details = unmatched.map((r) => `'${r.val}' (${r.cnt} rows)`).join(', ');
      throw new Error(
        `Currency backfill failed — unrecognized values in expense.currency column: ${details}. ` +
          `Add these codes to the CURRENCIES array in this migration and re-run.`,
      );
    }

    // ------------------------------------------------------------------ //
    // 6. Every row matched — now enforce NOT NULL
    // ------------------------------------------------------------------ //
    await queryRunner.query(`
      ALTER TABLE "expense" ALTER COLUMN "currency_id" SET NOT NULL
    `);

    // ------------------------------------------------------------------ //
    // 7. Drop the old column — data is safe in currency_id
    // ------------------------------------------------------------------ //
    await queryRunner.query(`
      ALTER TABLE "expense" DROP COLUMN "currency_numeric_code_old"
    `);

    // ------------------------------------------------------------------ //
    // 8. Add the foreign-key constraint
    // ------------------------------------------------------------------ //
    await queryRunner.query(`
      ALTER TABLE "expense"
        ADD CONSTRAINT "FK_0faf8e64b8acbe65bbd92366578"
        FOREIGN KEY ("currency_id") REFERENCES "currency"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------ //
    // Reverse: restore the original varchar column with numeric codes
    // ------------------------------------------------------------------ //
    await queryRunner.query(`
      ALTER TABLE "expense" DROP CONSTRAINT "FK_0faf8e64b8acbe65bbd92366578"
    `);

    // Re-add the old column as varchar
    await queryRunner.query(`
      ALTER TABLE "expense" ADD COLUMN "currency_old" character varying NOT NULL DEFAULT ''
    `);

    // Backfill old column from the currency table
    await queryRunner.query(`
      UPDATE "expense" e
      SET    "currency_old" = TRIM(c."alphabetic_code")
      FROM   "currency" c
      WHERE  c."id" = e."currency_id"
    `);

    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "currency_id"`);
    await queryRunner.query(`ALTER TABLE "expense" RENAME COLUMN "currency_old" TO "currency"`);
    await queryRunner.query(`ALTER TABLE "expense" ALTER COLUMN "currency" DROP DEFAULT`);

    await queryRunner.query(`DROP TABLE "currency"`);
  }
}
