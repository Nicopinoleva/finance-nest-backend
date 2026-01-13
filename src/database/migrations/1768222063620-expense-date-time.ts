import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpenseDateTime1768222063620 implements MigrationInterface {
  name = 'ExpenseDateTime1768222063620';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename the old column temporarily
    await queryRunner.query(`ALTER TABLE "expense" RENAME COLUMN "date" TO "date_old"`);

    // Create the new column with TIMESTAMP type
    await queryRunner.query(`ALTER TABLE "expense" ADD "date" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT NOW()`);

    // Migrate data from old column to new column with Chile/Santiago timezone
    await queryRunner.query(`UPDATE "expense" SET "date" = ("date_old"::TIMESTAMP AT TIME ZONE 'America/Santiago')`);

    // Drop the old column
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "date_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rename the timestamp column temporarily
    await queryRunner.query(`ALTER TABLE "expense" RENAME COLUMN "date" TO "date_timestamp"`);

    // Create the date column
    await queryRunner.query(`ALTER TABLE "expense" ADD "date" date NOT NULL DEFAULT CURRENT_DATE`);

    // Migrate data back (converting timestamp to date in Santiago timezone)
    await queryRunner.query(`UPDATE "expense" SET "date" = ("date_timestamp" AT TIME ZONE 'America/Santiago')::date`);

    // Drop the timestamp column
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "date_timestamp"`);
  }
}
