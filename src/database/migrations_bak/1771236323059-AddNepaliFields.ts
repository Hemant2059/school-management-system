import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNepaliFields1771236323059 implements MigrationInterface {
  name = 'AddNepaliFields1771236323059';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_sessions" ("session_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" bigint NOT NULL, "refresh_token_hash" character varying(255) NOT NULL, "device_name" character varying(255), "ip_address" character varying(45), "user_agent" text, "last_active_at" TIMESTAMP NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b6c41d19165af4c69eba9ecda46" PRIMARY KEY ("session_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9658e959c490b0a634dfc5478" ON "user_sessions" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("audit_id" BIGSERIAL NOT NULL, "user_id" bigint, "action" character varying(50) NOT NULL, "module" character varying(50) NOT NULL, "resource_id" text, "details" jsonb, "ip_address" character varying(45), "user_agent" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6f2dad3880d1d6f9bf560ea91c7" PRIMARY KEY ("audit_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bd2726fd31b35443f2245b93ba" ON "audit_logs" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cee5459245f652b75eb2759b4c" ON "audit_logs" ("action") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aca9ec48e47f56efca7d45898d" ON "audit_logs" ("module") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2cd10fda8276bb995288acfbfb" ON "audit_logs" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fee_installments_status_enum" AS ENUM('PENDING', 'PAID', 'OVERDUE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fee_installments" ("installment_id" BIGSERIAL NOT NULL, "fee_id" bigint NOT NULL, "installment_number" integer NOT NULL, "amount" numeric(12,2) NOT NULL, "due_date" date NOT NULL, "status" "public"."fee_installments_status_enum" NOT NULL DEFAULT 'PENDING', "payment_date" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_953bc5fe6dab7c5acc2770631c9" PRIMARY KEY ("installment_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fees_status_enum" AS ENUM('PENDING', 'PARTIAL', 'PAID', 'OVERDUE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fees" ("fee_id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "student_id" bigint NOT NULL, "fee_type" character varying(100) NOT NULL, "amount" numeric(12,2) NOT NULL, "discount_amount" numeric(12,2), "fine_amount" numeric(12,2), "total_amount" numeric(12,2) NOT NULL, "due_date" date NOT NULL, "status" "public"."fees_status_enum" NOT NULL DEFAULT 'PENDING', "payment_date" date, "payment_method" character varying(50), "transaction_id" character varying(100), "notes" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" bigint, "updated_by" bigint, CONSTRAINT "PK_9b3b16e5cc9dd953bfe11115a52" PRIMARY KEY ("fee_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "refresh_token_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "last_login_ip" character varying(45)`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "last_login_agent" text`);
    await queryRunner.query(
      `ALTER TABLE "subjects" ADD "subject_name_nepali" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "schools" ADD "established_date_bs" character varying(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" ADD "address_np" character varying(300)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2e9f764a4c4b81d5b741aaa8fe" ON "exams" ("exam_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7fe60823f5f2c03867eafba8fa" ON "exams" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2c8692b0432ea36e2aba5b1237" ON "exams" ("section_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_432eeeb62e8ff8de6c2a341cd1" ON "exams" ("subject_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_installments" ADD CONSTRAINT "FK_50d6a0582d85ad0d66efb8c991c" FOREIGN KEY ("fee_id") REFERENCES "fees"("fee_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fees" ADD CONSTRAINT "FK_97681df21ec81ea3a54e53e27c8" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fees" ADD CONSTRAINT "FK_1ad84dd647a6c4464ed46829b25" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "fees" DROP CONSTRAINT "FK_1ad84dd647a6c4464ed46829b25"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fees" DROP CONSTRAINT "FK_97681df21ec81ea3a54e53e27c8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_installments" DROP CONSTRAINT "FK_50d6a0582d85ad0d66efb8c991c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_e9658e959c490b0a634dfc54783"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_432eeeb62e8ff8de6c2a341cd1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c8692b0432ea36e2aba5b1237"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7fe60823f5f2c03867eafba8fa"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2e9f764a4c4b81d5b741aaa8fe"`,
    );
    await queryRunner.query(`ALTER TABLE "staff" DROP COLUMN "address_np"`);
    await queryRunner.query(
      `ALTER TABLE "schools" DROP COLUMN "established_date_bs"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subjects" DROP COLUMN "subject_name_nepali"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "last_login_agent"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_login_ip"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "refresh_token_hash" character varying(255)`,
    );
    await queryRunner.query(`DROP TABLE "fees"`);
    await queryRunner.query(`DROP TYPE "public"."fees_status_enum"`);
    await queryRunner.query(`DROP TABLE "fee_installments"`);
    await queryRunner.query(
      `DROP TYPE "public"."fee_installments_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2cd10fda8276bb995288acfbfb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aca9ec48e47f56efca7d45898d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cee5459245f652b75eb2759b4c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bd2726fd31b35443f2245b93ba"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9658e959c490b0a634dfc5478"`,
    );
    await queryRunner.query(`DROP TABLE "user_sessions"`);
  }
}
