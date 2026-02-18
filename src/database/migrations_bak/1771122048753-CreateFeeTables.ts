import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeeTables1771122048753 implements MigrationInterface {
  name = 'CreateFeeTables1771122048753';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."fee_transactions_payment_method_enum" AS ENUM('CASH', 'BANK', 'CHEQUE', 'ESEWA', 'KHALTI', 'FONEPAY', 'CONNECTIPS', 'IMEPAY', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fee_transactions" ("transaction_id" BIGSERIAL NOT NULL, "student_fee_id" bigint NOT NULL, "amount" numeric(12,2) NOT NULL, "payment_method" "public"."fee_transactions_payment_method_enum" NOT NULL, "transaction_reference" character varying(100), "bank_name" character varying(100), "cheque_number" character varying(50), "received_by" bigint NOT NULL, "receipt_number" character varying(50) NOT NULL, "remarks" character varying(500), "is_verified" boolean NOT NULL DEFAULT true, "transaction_date" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5e73990660924f88d55ac138657" UNIQUE ("receipt_number"), CONSTRAINT "PK_7a6bc17b396a9648d909dd219e7" PRIMARY KEY ("transaction_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a2658ed0bdf523d0d693ef37a4" ON "fee_transactions" ("student_fee_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."student_fees_status_enum" AS ENUM('PENDING', 'PARTIAL', 'PAID', 'WAIVED', 'OVERDUE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "student_fees" ("student_fee_id" BIGSERIAL NOT NULL, "student_id" bigint NOT NULL, "fee_structure_id" bigint NOT NULL, "academic_year_id" bigint NOT NULL, "total_amount" numeric(12,2) NOT NULL, "paid_amount" numeric(12,2) NOT NULL DEFAULT '0', "discount_amount" numeric(12,2) NOT NULL DEFAULT '0', "waiver_amount" numeric(12,2) NOT NULL DEFAULT '0', "status" "public"."student_fees_status_enum" NOT NULL DEFAULT 'PENDING', "installment_number" integer NOT NULL DEFAULT '1', "due_date" date, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_cc1d3be210de215270a925e28f7" PRIMARY KEY ("student_fee_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9e8969b8c743de99403b16b592" ON "student_fees" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "fee_structures" ("structure_id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "academic_year_id" bigint NOT NULL, "class_id" bigint NOT NULL, "section_id" bigint, "category_id" bigint NOT NULL, "amount" numeric(12,2) NOT NULL, "is_installment" boolean NOT NULL DEFAULT false, "installment_count" integer NOT NULL DEFAULT '1', "due_date" date, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_065477931c20f7126c554fc9118" PRIMARY KEY ("structure_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a8e6efa842ecb2b8e35fbe0cd4" ON "fee_structures" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e8d5f252faed8dfe19f49bbd78" ON "fee_structures" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fee_categories_category_type_enum" AS ENUM('TUITION', 'ADMISSION', 'EXAMINATION', 'TRANSPORT', 'HOSTEL', 'MISC', 'FINE', 'LIBRARY', 'SPORTS', 'LAB')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fee_categories" ("category_id" BIGSERIAL NOT NULL, "category_name" character varying(100) NOT NULL, "category_code" character varying(50) NOT NULL, "category_type" "public"."fee_categories_category_type_enum" NOT NULL, "description" character varying(500), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_5231baea758b2d2934450e4e3cb" UNIQUE ("category_code"), CONSTRAINT "PK_33607e8476bcbf5d31205549f51" PRIMARY KEY ("category_id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "fee_categories"`);
    await queryRunner.query(
      `DROP TYPE "public"."fee_categories_category_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e8d5f252faed8dfe19f49bbd78"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a8e6efa842ecb2b8e35fbe0cd4"`,
    );
    await queryRunner.query(`DROP TABLE "fee_structures"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9e8969b8c743de99403b16b592"`,
    );
    await queryRunner.query(`DROP TABLE "student_fees"`);
    await queryRunner.query(`DROP TYPE "public"."student_fees_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a2658ed0bdf523d0d693ef37a4"`,
    );
    await queryRunner.query(`DROP TABLE "fee_transactions"`);
    await queryRunner.query(
      `DROP TYPE "public"."fee_transactions_payment_method_enum"`,
    );
  }
}
