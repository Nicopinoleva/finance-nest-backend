import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreditCardCardStatementExpenseForeignKeys1761155773312 implements MigrationInterface {
  name = 'AddCreditCardCardStatementExpenseForeignKeys1761155773312';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "credit_card_statement" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "billing_period_start" date NOT NULL, "billing_period_end" date NOT NULL, "due_date" date NOT NULL, "due_amount" integer NOT NULL, "minimum_payment" integer NOT NULL, "previous_statement_debt" integer NOT NULL, "total_operations" integer NOT NULL, "total_payments" integer NOT NULL, "total_pat" integer NOT NULL, "total_transactions" integer NOT NULL, "total_installments" integer NOT NULL, "total_charges" integer NOT NULL, "total_unbilled_installments" integer, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "credit_card_id" uuid NOT NULL, "created_by_id" uuid NOT NULL, "updated_by_id" uuid, CONSTRAINT "PK_b06f3c0f69c052e8faae52e21fc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "expense" ADD "credit_card_statement_id" uuid`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "parent_installment_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_df7be1540776dfbfaf6e4557fc0" FOREIGN KEY ("credit_card_statement_id") REFERENCES "credit_card_statement"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_71ebe6a9d42cce30bec2ed8303e" FOREIGN KEY ("parent_installment_id") REFERENCES "expense"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_card_statement" ADD CONSTRAINT "FK_79018fd3361fe551a83ae7038ca" FOREIGN KEY ("credit_card_id") REFERENCES "payment_method"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_card_statement" ADD CONSTRAINT "FK_311cf9597ed886894eb3b963d45" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_card_statement" ADD CONSTRAINT "FK_2c56ab5da045d4366f8005ad2c3" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "credit_card_statement" DROP CONSTRAINT "FK_2c56ab5da045d4366f8005ad2c3"`);
    await queryRunner.query(`ALTER TABLE "credit_card_statement" DROP CONSTRAINT "FK_311cf9597ed886894eb3b963d45"`);
    await queryRunner.query(`ALTER TABLE "credit_card_statement" DROP CONSTRAINT "FK_79018fd3361fe551a83ae7038ca"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_71ebe6a9d42cce30bec2ed8303e"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_df7be1540776dfbfaf6e4557fc0"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "parent_installment_id"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "credit_card_statement_id"`);
    await queryRunner.query(`DROP TABLE "credit_card_statement"`);
  }
}
