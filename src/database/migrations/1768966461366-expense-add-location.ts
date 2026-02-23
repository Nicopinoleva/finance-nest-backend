import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpenseAddLocation1768966461366 implements MigrationInterface {
  name = 'ExpenseAddLocation1768966461366';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expense" ADD "location" character varying`);
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_950ac7e8b5de8b8d851d9a91c40"`);
    await queryRunner.query(`ALTER TABLE "expense" ALTER COLUMN "credit_card_statement_reference_id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_950ac7e8b5de8b8d851d9a91c40" FOREIGN KEY ("credit_card_statement_reference_id") REFERENCES "credit_card_statement_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_950ac7e8b5de8b8d851d9a91c40"`);
    await queryRunner.query(`ALTER TABLE "expense" ALTER COLUMN "credit_card_statement_reference_id" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_950ac7e8b5de8b8d851d9a91c40" FOREIGN KEY ("credit_card_statement_reference_id") REFERENCES "credit_card_statement_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "location"`);
  }
}
