import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpenseAmountsFloats1768225128101 implements MigrationInterface {
  name = 'ExpenseAmountsFloats1768225128101';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expense" ADD "source_currency_amount" numeric(15,4)`);

    await queryRunner.query(
      `ALTER TABLE "expense" ALTER COLUMN "operation_amount" TYPE numeric(15,4) USING "operation_amount"::numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ALTER COLUMN "total_amount" TYPE numeric(15,4) USING "total_amount"::numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ALTER COLUMN "monthly_amount" TYPE numeric(15,4) USING "monthly_amount"::numeric`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert columns back to integer (data will be truncated to whole numbers)
    await queryRunner.query(
      `ALTER TABLE "expense" ALTER COLUMN "monthly_amount" TYPE integer USING "monthly_amount"::integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ALTER COLUMN "total_amount" TYPE integer USING "total_amount"::integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ALTER COLUMN "operation_amount" TYPE integer USING "operation_amount"::integer`,
    );
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "source_currency_amount"`);
  }
}
