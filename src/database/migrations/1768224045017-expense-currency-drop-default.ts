import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpenseCurrencyDropDefault1768224045017 implements MigrationInterface {
  name = 'ExpenseCurrencyDropDefault1768224045017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expense" ALTER COLUMN "currency" DROP DEFAULT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expense" ALTER COLUMN "currency" SET DEFAULT 'CLP'`);
  }
}
