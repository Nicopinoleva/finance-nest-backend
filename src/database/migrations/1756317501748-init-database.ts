import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitDatabase1756317501748 implements MigrationInterface {
  name = 'InitDatabase1756317501748';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstname" character varying, "lastname" character varying, "dni" character varying, "email" character varying NOT NULL, "phone" character varying, "is_active" boolean DEFAULT true, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "created_by_id" uuid, "updated_by_id" uuid, CONSTRAINT "UQ_5fe9cfa518b76c96518a206b350" UNIQUE ("dni"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "banks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "created_by_id" uuid, "updated_by_id" uuid, CONSTRAINT "PK_3975b5f684ec241e3901db62d77" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "bank_account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "bank_account_type_id" uuid NOT NULL, "bank_id" uuid NOT NULL, "created_by_id" uuid, "updated_by_id" uuid, CONSTRAINT "PK_f3246deb6b79123482c6adb9745" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "bank_account_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "created_by_id" uuid NOT NULL, "updated_by_id" uuid, CONSTRAINT "PK_3bc977177ee05491337e4e67c0d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "expense_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "created_by_id" uuid NOT NULL, "updated_by_id" uuid, CONSTRAINT "PK_5d0fb2294d86406266f0b2a0373" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_method_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "created_by_id" uuid NOT NULL, "updated_by_id" uuid, CONSTRAINT "PK_8a26a45c049347f51812830df04" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_method" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "created_by_id" uuid NOT NULL, "updated_by_id" uuid, "bank_account_id" uuid, "payment_method_type_id" uuid, CONSTRAINT "PK_7744c2b2dd932c9cf42f2b9bc3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "expense" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "payment_method_id" uuid NOT NULL, "expense_type_id" uuid NOT NULL, "created_by_id" uuid NOT NULL, "updated_by_id" uuid, CONSTRAINT "PK_edd925b450e13ea36197c9590fc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "income_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "created_by_id" uuid NOT NULL, "updated_by_id" uuid, CONSTRAINT "PK_5a06c00e05a3c3f7ba210ffe4b7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "income" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "bank_account_id" uuid NOT NULL, "income_type_id" uuid NOT NULL, "created_by_id" uuid NOT NULL, "updated_by_id" uuid, CONSTRAINT "PK_29a10f17b97568f70cee8586d58" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_1bbd34899b8e74ef2a7f3212806" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_80e310e761f458f272c20ea6add" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "banks" ADD CONSTRAINT "FK_5f4e2301a8121bba4ff19e91389" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "banks" ADD CONSTRAINT "FK_747092898144912262d2f744519" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_account" ADD CONSTRAINT "FK_a3de9998dd51fd8eaad1cdbafd6" FOREIGN KEY ("bank_account_type_id") REFERENCES "bank_account_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_account" ADD CONSTRAINT "FK_24569b6843af6bcef189740e99e" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_account" ADD CONSTRAINT "FK_1c31287d7285bed6d0ffdc89d7c" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_account" ADD CONSTRAINT "FK_86cd24a972fc2823aff55cd4ec6" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_account_type" ADD CONSTRAINT "FK_a882c8cfccc4306c3ab9987101b" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_account_type" ADD CONSTRAINT "FK_0b9bbfcd52061f84c9a5749733e" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense_type" ADD CONSTRAINT "FK_d20d92b0621a3877230cf0c07c1" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense_type" ADD CONSTRAINT "FK_c2360e15f7e3a1aa05b387c8a18" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_types" ADD CONSTRAINT "FK_9997c617e1ac5d960d96104db08" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_types" ADD CONSTRAINT "FK_c3e917a9cc756132d9d97c67e51" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method" ADD CONSTRAINT "FK_0ddd28aeb9c4cd0ff545dd137f0" FOREIGN KEY ("bank_account_id") REFERENCES "bank_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method" ADD CONSTRAINT "FK_516a983cbc61215898da71d2acc" FOREIGN KEY ("payment_method_type_id") REFERENCES "payment_method_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method" ADD CONSTRAINT "FK_c1dd8e03ec45206360a49088380" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method" ADD CONSTRAINT "FK_a03157c82c8f9fe72d527a56bc5" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_97ba2d5f448906458923e273704" FOREIGN KEY ("payment_method_id") REFERENCES "payment_method"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_38270103a6ad8c220fce058ebaf" FOREIGN KEY ("expense_type_id") REFERENCES "expense_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_e106071f918071f9d3ec6e83876" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_290e4c5900020a1e002bfdf1fc6" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income_type" ADD CONSTRAINT "FK_92e2fe4c5c79c9eac3f9d38afa5" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income_type" ADD CONSTRAINT "FK_8c3ea47a346fe7225f0a596db26" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income" ADD CONSTRAINT "FK_56b8f898b6d2b159d1d7dc8029e" FOREIGN KEY ("bank_account_id") REFERENCES "bank_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income" ADD CONSTRAINT "FK_3a5de96b0fd3301705ade165220" FOREIGN KEY ("income_type_id") REFERENCES "income_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income" ADD CONSTRAINT "FK_ef99d3b89e713e53a966780cbff" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income" ADD CONSTRAINT "FK_878180dae057119e4eb55da7fe2" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "income" DROP CONSTRAINT "FK_878180dae057119e4eb55da7fe2"`);
    await queryRunner.query(`ALTER TABLE "income" DROP CONSTRAINT "FK_ef99d3b89e713e53a966780cbff"`);
    await queryRunner.query(`ALTER TABLE "income" DROP CONSTRAINT "FK_3a5de96b0fd3301705ade165220"`);
    await queryRunner.query(`ALTER TABLE "income" DROP CONSTRAINT "FK_56b8f898b6d2b159d1d7dc8029e"`);
    await queryRunner.query(`ALTER TABLE "income_type" DROP CONSTRAINT "FK_8c3ea47a346fe7225f0a596db26"`);
    await queryRunner.query(`ALTER TABLE "income_type" DROP CONSTRAINT "FK_92e2fe4c5c79c9eac3f9d38afa5"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_290e4c5900020a1e002bfdf1fc6"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_e106071f918071f9d3ec6e83876"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_38270103a6ad8c220fce058ebaf"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_97ba2d5f448906458923e273704"`);
    await queryRunner.query(`ALTER TABLE "payment_method" DROP CONSTRAINT "FK_a03157c82c8f9fe72d527a56bc5"`);
    await queryRunner.query(`ALTER TABLE "payment_method" DROP CONSTRAINT "FK_c1dd8e03ec45206360a49088380"`);
    await queryRunner.query(`ALTER TABLE "payment_method" DROP CONSTRAINT "FK_516a983cbc61215898da71d2acc"`);
    await queryRunner.query(`ALTER TABLE "payment_method" DROP CONSTRAINT "FK_0ddd28aeb9c4cd0ff545dd137f0"`);
    await queryRunner.query(`ALTER TABLE "payment_method_types" DROP CONSTRAINT "FK_c3e917a9cc756132d9d97c67e51"`);
    await queryRunner.query(`ALTER TABLE "payment_method_types" DROP CONSTRAINT "FK_9997c617e1ac5d960d96104db08"`);
    await queryRunner.query(`ALTER TABLE "expense_type" DROP CONSTRAINT "FK_c2360e15f7e3a1aa05b387c8a18"`);
    await queryRunner.query(`ALTER TABLE "expense_type" DROP CONSTRAINT "FK_d20d92b0621a3877230cf0c07c1"`);
    await queryRunner.query(`ALTER TABLE "bank_account_type" DROP CONSTRAINT "FK_0b9bbfcd52061f84c9a5749733e"`);
    await queryRunner.query(`ALTER TABLE "bank_account_type" DROP CONSTRAINT "FK_a882c8cfccc4306c3ab9987101b"`);
    await queryRunner.query(`ALTER TABLE "bank_account" DROP CONSTRAINT "FK_86cd24a972fc2823aff55cd4ec6"`);
    await queryRunner.query(`ALTER TABLE "bank_account" DROP CONSTRAINT "FK_1c31287d7285bed6d0ffdc89d7c"`);
    await queryRunner.query(`ALTER TABLE "bank_account" DROP CONSTRAINT "FK_24569b6843af6bcef189740e99e"`);
    await queryRunner.query(`ALTER TABLE "bank_account" DROP CONSTRAINT "FK_a3de9998dd51fd8eaad1cdbafd6"`);
    await queryRunner.query(`ALTER TABLE "banks" DROP CONSTRAINT "FK_747092898144912262d2f744519"`);
    await queryRunner.query(`ALTER TABLE "banks" DROP CONSTRAINT "FK_5f4e2301a8121bba4ff19e91389"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_80e310e761f458f272c20ea6add"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_1bbd34899b8e74ef2a7f3212806"`);
    await queryRunner.query(`DROP TABLE "income"`);
    await queryRunner.query(`DROP TABLE "income_type"`);
    await queryRunner.query(`DROP TABLE "expense"`);
    await queryRunner.query(`DROP TABLE "payment_method"`);
    await queryRunner.query(`DROP TABLE "payment_method_types"`);
    await queryRunner.query(`DROP TABLE "expense_type"`);
    await queryRunner.query(`DROP TABLE "bank_account_type"`);
    await queryRunner.query(`DROP TABLE "bank_account"`);
    await queryRunner.query(`DROP TABLE "banks"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
