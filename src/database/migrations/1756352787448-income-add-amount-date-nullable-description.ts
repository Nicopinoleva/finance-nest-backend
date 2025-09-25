import { MigrationInterface, QueryRunner } from 'typeorm';

export class IncomeAddAmountDateNullableDescription1756352787448 implements MigrationInterface {
  name = 'IncomeAddAmountDateNullableDescription1756352787448';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "income" ADD "amount" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "income" ADD "date" date NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "income" ALTER COLUMN "description" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "income" ALTER COLUMN "description" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "income" DROP COLUMN "date"`);
    await queryRunner.query(`ALTER TABLE "income" DROP COLUMN "amount"`);
  }
}
