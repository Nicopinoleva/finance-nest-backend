import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreditCardCardStatementReference1760369181233 implements MigrationInterface {
  name = 'AddCreditCardCardStatementReference1760369181233';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "credit_card_statement_reference" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "PK_f95e2c4b4c559e3a9ed9e6db5c3" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "credit_card_statement_reference"`);
  }
}
