import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentMethodIsAdditionalOrderIsActive1764185787720 implements MigrationInterface {
  name = 'AddPaymentMethodIsAdditionalOrderIsActive1764185787720';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_method" ADD "is_additional" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "payment_method" ADD "order" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payment_method" ADD "is_active" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_method" DROP COLUMN "is_active"`);
    await queryRunner.query(`ALTER TABLE "payment_method" DROP COLUMN "order"`);
    await queryRunner.query(`ALTER TABLE "payment_method" DROP COLUMN "is_additional"`);
  }
}
