import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpenseCurrentInstallmentTotalInstallments1761927962393 implements MigrationInterface {
  name = 'AddExpenseCurrentInstallmentTotalInstallments1761927962393';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "installment"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "monthly_installment"`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "monthly_amount" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "current_installment" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "total_installments" integer NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "total_installments"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "current_installment"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "monthly_amount"`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "installment" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "monthly_installment" integer NOT NULL`);
  }
}
