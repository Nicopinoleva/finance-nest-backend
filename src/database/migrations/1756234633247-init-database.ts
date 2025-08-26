import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitDatabase1756234633247 implements MigrationInterface {
  name = 'InitDatabase1756234633247';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstname" character varying, "lastname" character varying, "dni" character varying, "email" character varying NOT NULL, "phone" character varying, "isActive" boolean DEFAULT true, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "createdById" uuid, "updatedById" uuid, CONSTRAINT "UQ_5fe9cfa518b76c96518a206b350" UNIQUE ("dni"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "banks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "createdById" uuid, "updatedById" uuid, CONSTRAINT "PK_3975b5f684ec241e3901db62d77" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "bank_account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "bankAccountTypeId" uuid NOT NULL, "bankId" uuid NOT NULL, "createdById" uuid, "updatedById" uuid, CONSTRAINT "PK_f3246deb6b79123482c6adb9745" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "bank_account_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "createdById" uuid NOT NULL, "updatedById" uuid, CONSTRAINT "PK_3bc977177ee05491337e4e67c0d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "expense_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "createdById" uuid NOT NULL, "updatedById" uuid, CONSTRAINT "PK_5d0fb2294d86406266f0b2a0373" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_method_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "createdById" uuid NOT NULL, "updatedById" uuid, CONSTRAINT "PK_8a26a45c049347f51812830df04" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_method" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "createdById" uuid NOT NULL, "updatedById" uuid, "bankAccountId" uuid, "paymentMethodTypeId" uuid, CONSTRAINT "PK_7744c2b2dd932c9cf42f2b9bc3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "expense" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "paymentMethodId" uuid NOT NULL, "expenseTypeId" uuid NOT NULL, "createdById" uuid NOT NULL, "updatedById" uuid, CONSTRAINT "PK_edd925b450e13ea36197c9590fc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "income_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "createdById" uuid NOT NULL, "updatedById" uuid, CONSTRAINT "PK_5a06c00e05a3c3f7ba210ffe4b7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "income" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "paymentMethodId" uuid NOT NULL, "incomeTypeId" uuid NOT NULL, "createdById" uuid NOT NULL, "updatedById" uuid, CONSTRAINT "PK_29a10f17b97568f70cee8586d58" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_51d635f1d983d505fb5a2f44c52" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_52e97c477859f8019f3705abd21" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "banks" ADD CONSTRAINT "FK_840efb4d38ca8327d81e0e388c6" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "banks" ADD CONSTRAINT "FK_0866444e4b8a8a59d0f95af1fa8" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_account" ADD CONSTRAINT "FK_c7405cf505333c44f88b559df7a" FOREIGN KEY ("bankAccountTypeId") REFERENCES "bank_account_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_account" ADD CONSTRAINT "FK_57fe4146ab12f9f7d581a42962f" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_account" ADD CONSTRAINT "FK_9b1311b17da1c804379156a294b" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_account" ADD CONSTRAINT "FK_4764b8e246c4d7e7ed23b90f7a1" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_account_type" ADD CONSTRAINT "FK_d457e7e3dc632cdff293526cad1" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_account_type" ADD CONSTRAINT "FK_ad729cff17cc6fd5a5543a7ef7c" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense_type" ADD CONSTRAINT "FK_b5532a31f18348ae4d821e0220d" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense_type" ADD CONSTRAINT "FK_471acd2ed86e5b5ea3af1bd92a3" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_types" ADD CONSTRAINT "FK_9284d6aba24fa91a21986cd7b22" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_types" ADD CONSTRAINT "FK_55711fcaefba349bda8aebbdcc6" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method" ADD CONSTRAINT "FK_7e0e6e1c06c70b829581f628a7e" FOREIGN KEY ("bankAccountId") REFERENCES "bank_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method" ADD CONSTRAINT "FK_39ebc286f919aef8da6a21095b1" FOREIGN KEY ("paymentMethodTypeId") REFERENCES "payment_method_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method" ADD CONSTRAINT "FK_84d9df7d22b623962393c093c8f" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method" ADD CONSTRAINT "FK_bba550834708b1ac4bb23e3630b" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_e513c04b25aa5b3d760b7b78fbd" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_6409b02bdfe2376ca457cb799e6" FOREIGN KEY ("expenseTypeId") REFERENCES "expense_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_33025f4898ea79cc35a3c6da4ca" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ADD CONSTRAINT "FK_106758ff33bf2f0895ccdddfe59" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income_type" ADD CONSTRAINT "FK_19877383f6361f41ab800857095" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income_type" ADD CONSTRAINT "FK_084e92d4a90609ac2040edf0efc" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income" ADD CONSTRAINT "FK_be30de4293bd5dca1d522b6cbcc" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income" ADD CONSTRAINT "FK_162af2f33f209161e7d5310458e" FOREIGN KEY ("incomeTypeId") REFERENCES "income_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income" ADD CONSTRAINT "FK_2a82a606218f5bd00902335bc8e" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income" ADD CONSTRAINT "FK_0bb1a885e2b3aaa949ef36aa2f1" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "income" DROP CONSTRAINT "FK_0bb1a885e2b3aaa949ef36aa2f1"`);
    await queryRunner.query(`ALTER TABLE "income" DROP CONSTRAINT "FK_2a82a606218f5bd00902335bc8e"`);
    await queryRunner.query(`ALTER TABLE "income" DROP CONSTRAINT "FK_162af2f33f209161e7d5310458e"`);
    await queryRunner.query(`ALTER TABLE "income" DROP CONSTRAINT "FK_be30de4293bd5dca1d522b6cbcc"`);
    await queryRunner.query(`ALTER TABLE "income_type" DROP CONSTRAINT "FK_084e92d4a90609ac2040edf0efc"`);
    await queryRunner.query(`ALTER TABLE "income_type" DROP CONSTRAINT "FK_19877383f6361f41ab800857095"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_106758ff33bf2f0895ccdddfe59"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_33025f4898ea79cc35a3c6da4ca"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_6409b02bdfe2376ca457cb799e6"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_e513c04b25aa5b3d760b7b78fbd"`);
    await queryRunner.query(`ALTER TABLE "payment_method" DROP CONSTRAINT "FK_bba550834708b1ac4bb23e3630b"`);
    await queryRunner.query(`ALTER TABLE "payment_method" DROP CONSTRAINT "FK_84d9df7d22b623962393c093c8f"`);
    await queryRunner.query(`ALTER TABLE "payment_method" DROP CONSTRAINT "FK_39ebc286f919aef8da6a21095b1"`);
    await queryRunner.query(`ALTER TABLE "payment_method" DROP CONSTRAINT "FK_7e0e6e1c06c70b829581f628a7e"`);
    await queryRunner.query(`ALTER TABLE "payment_method_types" DROP CONSTRAINT "FK_55711fcaefba349bda8aebbdcc6"`);
    await queryRunner.query(`ALTER TABLE "payment_method_types" DROP CONSTRAINT "FK_9284d6aba24fa91a21986cd7b22"`);
    await queryRunner.query(`ALTER TABLE "expense_type" DROP CONSTRAINT "FK_471acd2ed86e5b5ea3af1bd92a3"`);
    await queryRunner.query(`ALTER TABLE "expense_type" DROP CONSTRAINT "FK_b5532a31f18348ae4d821e0220d"`);
    await queryRunner.query(`ALTER TABLE "bank_account_type" DROP CONSTRAINT "FK_ad729cff17cc6fd5a5543a7ef7c"`);
    await queryRunner.query(`ALTER TABLE "bank_account_type" DROP CONSTRAINT "FK_d457e7e3dc632cdff293526cad1"`);
    await queryRunner.query(`ALTER TABLE "bank_account" DROP CONSTRAINT "FK_4764b8e246c4d7e7ed23b90f7a1"`);
    await queryRunner.query(`ALTER TABLE "bank_account" DROP CONSTRAINT "FK_9b1311b17da1c804379156a294b"`);
    await queryRunner.query(`ALTER TABLE "bank_account" DROP CONSTRAINT "FK_57fe4146ab12f9f7d581a42962f"`);
    await queryRunner.query(`ALTER TABLE "bank_account" DROP CONSTRAINT "FK_c7405cf505333c44f88b559df7a"`);
    await queryRunner.query(`ALTER TABLE "banks" DROP CONSTRAINT "FK_0866444e4b8a8a59d0f95af1fa8"`);
    await queryRunner.query(`ALTER TABLE "banks" DROP CONSTRAINT "FK_840efb4d38ca8327d81e0e388c6"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_52e97c477859f8019f3705abd21"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_51d635f1d983d505fb5a2f44c52"`);
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
