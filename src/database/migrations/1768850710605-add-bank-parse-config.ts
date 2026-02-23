import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBankParseConfig1768850710605 implements MigrationInterface {
  name = 'AddBankParseConfig1768850710605';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "bank_parse_configuration" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "configuration" jsonb NOT NULL, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "payment_method_type_id" uuid NOT NULL, "bank_id" uuid NOT NULL, "created_by_id" uuid, "updated_by_id" uuid, CONSTRAINT "PK_2a1648d0ddeced6b822696bfe03" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_parse_configuration" ADD CONSTRAINT "FK_d7f9aafc0032bca49a169f417c3" FOREIGN KEY ("payment_method_type_id") REFERENCES "payment_method_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_parse_configuration" ADD CONSTRAINT "FK_28082cce74468155339382bad92" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_parse_configuration" ADD CONSTRAINT "FK_298f3d11f95470b4bf0c1c94305" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_parse_configuration" ADD CONSTRAINT "FK_8a9f26d8e3c7e6e8763536fab85" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bank_parse_configuration" DROP CONSTRAINT "FK_8a9f26d8e3c7e6e8763536fab85"`);
    await queryRunner.query(`ALTER TABLE "bank_parse_configuration" DROP CONSTRAINT "FK_298f3d11f95470b4bf0c1c94305"`);
    await queryRunner.query(`ALTER TABLE "bank_parse_configuration" DROP CONSTRAINT "FK_28082cce74468155339382bad92"`);
    await queryRunner.query(`ALTER TABLE "bank_parse_configuration" DROP CONSTRAINT "FK_d7f9aafc0032bca49a169f417c3"`);
    await queryRunner.query(`DROP TABLE "bank_parse_configuration"`);
  }
}
