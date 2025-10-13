import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpenseAttributes1760369481135 implements MigrationInterface {
  name = 'AddExpenseAttributes1760369481135';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "name"`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "description" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "operation_amount" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "total_amount" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "monthly_installment" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "installment" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "date" date NOT NULL`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "reference_code" character varying`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "credit_card_statement_reference_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_950ac7e8b5de8b8d851d9a91c40" FOREIGN KEY ("credit_card_statement_reference_id") REFERENCES "credit_card_statement_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_950ac7e8b5de8b8d851d9a91c40"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "credit_card_statement_reference_id"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "reference_code"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "date"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "installment"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "monthly_installment"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "total_amount"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "operation_amount"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "name" character varying NOT NULL`);
  }
}
