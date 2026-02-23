import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpenseInstallmentsFulfilled1764197350556 implements MigrationInterface {
  name = 'AddExpenseInstallmentsFulfilled1764197350556';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expense" ADD "installments_fulfilled" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "installments_fulfilled"`);
  }
}
