import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreditCardAccount1764173511609 implements MigrationInterface {
  name = 'AddCreditCardAccount1764173511609';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "credit_card_account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "limit" integer NOT NULL, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "created_by_id" uuid NOT NULL, "updated_by_id" uuid, CONSTRAINT "PK_aa0ef202014063408e33fc25d68" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "payment_method" ADD "credit_card_account_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "payment_method" ADD CONSTRAINT "FK_8840b710ebe2c9f2049cbdc52db" FOREIGN KEY ("credit_card_account_id") REFERENCES "credit_card_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_card_account" ADD CONSTRAINT "FK_9acbd1afe4de6baec341b190f53" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_card_account" ADD CONSTRAINT "FK_0bea3a06a6b9883bc06dac789ea" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "credit_card_account" DROP CONSTRAINT "FK_0bea3a06a6b9883bc06dac789ea"`);
    await queryRunner.query(`ALTER TABLE "credit_card_account" DROP CONSTRAINT "FK_9acbd1afe4de6baec341b190f53"`);
    await queryRunner.query(`ALTER TABLE "payment_method" DROP CONSTRAINT "FK_8840b710ebe2c9f2049cbdc52db"`);
    await queryRunner.query(`ALTER TABLE "payment_method" DROP COLUMN "credit_card_account_id"`);
    await queryRunner.query(`DROP TABLE "credit_card_account"`);
  }
}
