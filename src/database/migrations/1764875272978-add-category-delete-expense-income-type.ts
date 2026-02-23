import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryDeleteExpenseIncomeType1764875272978 implements MigrationInterface {
  name = 'AddCategoryDeleteExpenseIncomeType1764875272978';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop old foreign key constraints
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_38270103a6ad8c220fce058ebaf"`);
    await queryRunner.query(`ALTER TABLE "income" DROP CONSTRAINT "FK_3a5de96b0fd3301705ade165220"`);

    // 2. Create the new category table
    await queryRunner.query(
      `CREATE TABLE "category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "parent_category_id" uuid, "created_by_id" uuid NOT NULL, "updated_by_id" uuid, CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`,
    );

    // 3. Migrate data from expense_type to category
    await queryRunner.query(
      `INSERT INTO "category" ("id", "name", "description", "created_at", "updated_at", "created_by_id", "updated_by_id")
       SELECT "id", "name", '', "created_at", "updated_at", "created_by_id", "updated_by_id"
       FROM "expense_type"`,
    );

    // 4. Migrate data from income_type to category (avoiding duplicates if any)
    await queryRunner.query(
      `INSERT INTO "category" ("id", "name", "description", "created_at", "updated_at", "created_by_id", "updated_by_id")
       SELECT "id", "name", '', "created_at", "updated_at", "created_by_id", "updated_by_id"
       FROM "income_type"
       WHERE "id" NOT IN (SELECT "id" FROM "category")`,
    );

    // 5. Rename columns
    await queryRunner.query(`ALTER TABLE "expense" RENAME COLUMN "expense_type_id" TO "category_id"`);
    await queryRunner.query(`ALTER TABLE "income" RENAME COLUMN "income_type_id" TO "category_id"`);

    // 6. Add foreign key constraints for category table
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "FK_d6db2bf1b938f69d2ebac5a9de8" FOREIGN KEY ("parent_category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "FK_d179629f2eb1981cb3055f4774b" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "FK_ddaed427f4c4d4c0bf462b44f25" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // 7. Add foreign key constraints to expense and income tables
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_478b68a9314d8787fb3763a2298" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income" ADD CONSTRAINT "FK_cd2820be0fe815c19a201dec924" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // 8. Drop old tables
    await queryRunner.query(`DROP TABLE "expense_type"`);
    await queryRunner.query(`DROP TABLE "income_type"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate old tables first
    await queryRunner.query(
      `CREATE TABLE "expense_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "created_by_id" uuid NOT NULL, "updated_by_id" uuid, CONSTRAINT "PK_5d0fb2294d86406266f0b2a0373" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "income_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "created_by_id" uuid NOT NULL, "updated_by_id" uuid, CONSTRAINT "PK_5a06c00e05a3c3f7ba210ffe4b7" PRIMARY KEY ("id"))`,
    );

    // Drop constraints
    await queryRunner.query(`ALTER TABLE "income" DROP CONSTRAINT "FK_cd2820be0fe815c19a201dec924"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_478b68a9314d8787fb3763a2298"`);
    await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_ddaed427f4c4d4c0bf462b44f25"`);
    await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_d179629f2eb1981cb3055f4774b"`);
    await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_d6db2bf1b938f69d2ebac5a9de8"`);

    // Drop category table
    await queryRunner.query(`DROP TABLE "category"`);

    // Rename columns back
    await queryRunner.query(`ALTER TABLE "income" RENAME COLUMN "category_id" TO "income_type_id"`);
    await queryRunner.query(`ALTER TABLE "expense" RENAME COLUMN "category_id" TO "expense_type_id"`);

    // Add back foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "expense_type" ADD CONSTRAINT "FK_d20d92b0621a3877230cf0c07c1" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense_type" ADD CONSTRAINT "FK_c2360e15f7e3a1aa05b387c8a18" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income_type" ADD CONSTRAINT "FK_92e2fe4c5c79c9eac3f9d38afa5" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income_type" ADD CONSTRAINT "FK_8c3ea47a346fe7225f0a596db26" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income" ADD CONSTRAINT "FK_3a5de96b0fd3301705ade165220" FOREIGN KEY ("income_type_id") REFERENCES "income_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_38270103a6ad8c220fce058ebaf" FOREIGN KEY ("expense_type_id") REFERENCES "expense_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
