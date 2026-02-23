import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpenseCategoryNullable1768192901560 implements MigrationInterface {
  name = 'ExpenseCategoryNullable1768192901560';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "description" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_478b68a9314d8787fb3763a2298"`);
    await queryRunner.query(`ALTER TABLE "expense" ALTER COLUMN "category_id" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_478b68a9314d8787fb3763a2298" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_478b68a9314d8787fb3763a2298"`);
    await queryRunner.query(`ALTER TABLE "expense" ALTER COLUMN "category_id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_478b68a9314d8787fb3763a2298" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "description" SET NOT NULL`);
  }
}
