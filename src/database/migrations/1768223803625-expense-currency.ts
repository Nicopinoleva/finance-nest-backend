import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpenseCurrency1768223803625 implements MigrationInterface {
  name = 'ExpenseCurrency1768223803625';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expense" ADD "currency" character varying NOT NULL DEFAULT 'CLP'`);
    await queryRunner.query(`ALTER TABLE "expense" ALTER COLUMN "date" DROP DEFAULT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expense" ALTER COLUMN "date" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "currency"`);
  }
}
