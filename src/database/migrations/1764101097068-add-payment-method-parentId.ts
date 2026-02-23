import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentMethodParentId1764101097068 implements MigrationInterface {
  name = 'AddPaymentMethodParentId1764101097068';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_method" ADD "parent_payment_method_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "payment_method" ADD CONSTRAINT "FK_8fbd5e81547bd503b0f41236280" FOREIGN KEY ("parent_payment_method_id") REFERENCES "payment_method"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_method" DROP CONSTRAINT "FK_8fbd5e81547bd503b0f41236280"`);
    await queryRunner.query(`ALTER TABLE "payment_method" DROP COLUMN "parent_payment_method_id"`);
  }
}
