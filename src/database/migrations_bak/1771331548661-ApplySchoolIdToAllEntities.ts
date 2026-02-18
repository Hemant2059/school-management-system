import { MigrationInterface, QueryRunner } from 'typeorm';

export class ApplySchoolIdToAllEntities1771331548661 implements MigrationInterface {
  name = 'ApplySchoolIdToAllEntities1771331548661';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "districts" DROP CONSTRAINT "FK_9d451638507b11822dc411a2dfe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "local_bodies" DROP CONSTRAINT "FK_24bc58f2e9ebf8e51bb96802061"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wards" DROP CONSTRAINT "FK_5ab5b8680dd7e4bb8b0dac21a5c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" RENAME COLUMN "title" TO "school_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "caste_ethnicity_code" character varying(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "citizenship_number" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "birth_certificate_number" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "is_govt_mandated_free_seat" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_installments" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fees" ADD "fiscal_year_bs" character varying(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "fees" ADD "scholarship_percent" numeric(5,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "audit_logs" ADD "school_id" bigint`);
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_fees" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_assignments" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "routes" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_stops" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "teachers" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "subjects" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD "retry_count" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD "requires_manual_followup" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "marks" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_issues" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ADD "payroll_month" smallint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ADD "payroll_year" smallint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ADD "fiscal_year_bs" character varying(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ADD "allowances" numeric(12,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ADD "deductions" numeric(12,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payroll_payment_status_enum" AS ENUM('PENDING', 'PROCESSED', 'PAID', 'CANCELLED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ADD "payment_status" "public"."payroll_payment_status_enum" NOT NULL DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ADD "payment_method" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ADD "transaction_reference" character varying(100)`,
    );
    await queryRunner.query(`ALTER TABLE "payroll" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "leave_types" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "leave_requests" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "guardians" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_fees" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_transactions" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_structures" ADD "is_govt_mandated_free_seat" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_categories" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "exams" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_enrollments" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" DROP COLUMN "salary_month_bs"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ADD "salary_month_bs" character varying(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ALTER COLUMN "basic_salary" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ALTER COLUMN "payment_date" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ALTER COLUMN "is_paid" SET DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" DROP COLUMN "school_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" ADD "school_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70adc3fbcff99006535a6a50a4" ON "fee_installments" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a74f2b3656ded5519934973c17" ON "user_sessions" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_25e1cf8f41bae2f3d11f3c2a02" ON "users" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dfa425a9b20aa546ef0280a876" ON "audit_logs" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eef3362babd6fffbbd92e5de29" ON "vehicles" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eafe5529e56fded4e0ab473c57" ON "transport_fees" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_132884ca0af2e838e02b30d7e9" ON "transport_assignments" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eefdc041df6651285ca2b0e771" ON "routes" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_497f704d8b00ccccd7629b3b57" ON "route_stops" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5656d1b6d40765ea6b135b35d4" ON "teachers" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_07a82eb883094a6990b914cc15" ON "subjects" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_666f4dac581787f5f242316c00" ON "marks" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bdef14085ea004c6f6b95cb441" ON "books" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_10dcf8f0ac34ea42363eb9ed21" ON "book_issues" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_351341ffb6055ef0907b18e28b" ON "staff" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ad4f2785bd8a0e083f85668019" ON "payroll" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1f3cc81275258be8878f90c662" ON "leave_types" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_21bbb78f818e5f587b19744ce5" ON "leave_requests" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f7e300b647548abd1f0ae128ca" ON "guardians" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6ba7816f0566c77b5ced3a8712" ON "student_fees" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1ecc8950a45ec0aefd45dfc3e0" ON "fee_transactions" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c4cf9799c2377cf705783de565" ON "fee_categories" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_990f1559338541918a5a10d5cc" ON "exams" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6969e646aa55906ab338683340" ON "student_enrollments" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5ade718880c9f245516bc1014a" ON "attendance_records" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eb259758723e7365358b8e64a9" ON "assignments" ("school_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_installments" ADD CONSTRAINT "FK_70adc3fbcff99006535a6a50a4b" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_a74f2b3656ded5519934973c17d" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_25e1cf8f41bae2f3d11f3c2a028" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_dfa425a9b20aa546ef0280a8769" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_eef3362babd6fffbbd92e5de292" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_fees" ADD CONSTRAINT "FK_eafe5529e56fded4e0ab473c574" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_assignments" ADD CONSTRAINT "FK_132884ca0af2e838e02b30d7e97" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "routes" ADD CONSTRAINT "FK_eefdc041df6651285ca2b0e7719" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_stops" ADD CONSTRAINT "FK_497f704d8b00ccccd7629b3b57e" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teachers" ADD CONSTRAINT "FK_5656d1b6d40765ea6b135b35d4b" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subjects" ADD CONSTRAINT "FK_07a82eb883094a6990b914cc15e" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "marks" ADD CONSTRAINT "FK_666f4dac581787f5f242316c009" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ADD CONSTRAINT "FK_bdef14085ea004c6f6b95cb4411" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_issues" ADD CONSTRAINT "FK_10dcf8f0ac34ea42363eb9ed216" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" ADD CONSTRAINT "FK_351341ffb6055ef0907b18e28b9" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ADD CONSTRAINT "FK_ad4f2785bd8a0e083f856680195" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ADD CONSTRAINT "FK_cbe37273cc8dbba2ba49f7cf119" FOREIGN KEY ("staff_id") REFERENCES "staff"("staff_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leave_types" ADD CONSTRAINT "FK_1f3cc81275258be8878f90c662f" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leave_requests" ADD CONSTRAINT "FK_21bbb78f818e5f587b19744ce5c" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "guardians" ADD CONSTRAINT "FK_f7e300b647548abd1f0ae128ca7" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_fees" ADD CONSTRAINT "FK_6ba7816f0566c77b5ced3a87120" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_transactions" ADD CONSTRAINT "FK_1ecc8950a45ec0aefd45dfc3e0d" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_categories" ADD CONSTRAINT "FK_c4cf9799c2377cf705783de565d" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exams" ADD CONSTRAINT "FK_990f1559338541918a5a10d5ccc" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_enrollments" ADD CONSTRAINT "FK_6969e646aa55906ab338683340a" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "districts" ADD CONSTRAINT "FK_9d451638507b11822dc411a2dfe" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "local_bodies" ADD CONSTRAINT "FK_24bc58f2e9ebf8e51bb96802061" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wards" ADD CONSTRAINT "FK_5ab5b8680dd7e4bb8b0dac21a5c" FOREIGN KEY ("local_body_id") REFERENCES "local_bodies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" ADD CONSTRAINT "FK_5ade718880c9f245516bc1014a1" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" ADD CONSTRAINT "FK_eb259758723e7365358b8e64a9d" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignments" DROP CONSTRAINT "FK_eb259758723e7365358b8e64a9d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" DROP CONSTRAINT "FK_5ade718880c9f245516bc1014a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wards" DROP CONSTRAINT "FK_5ab5b8680dd7e4bb8b0dac21a5c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "local_bodies" DROP CONSTRAINT "FK_24bc58f2e9ebf8e51bb96802061"`,
    );
    await queryRunner.query(
      `ALTER TABLE "districts" DROP CONSTRAINT "FK_9d451638507b11822dc411a2dfe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_enrollments" DROP CONSTRAINT "FK_6969e646aa55906ab338683340a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exams" DROP CONSTRAINT "FK_990f1559338541918a5a10d5ccc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_categories" DROP CONSTRAINT "FK_c4cf9799c2377cf705783de565d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_transactions" DROP CONSTRAINT "FK_1ecc8950a45ec0aefd45dfc3e0d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_fees" DROP CONSTRAINT "FK_6ba7816f0566c77b5ced3a87120"`,
    );
    await queryRunner.query(
      `ALTER TABLE "guardians" DROP CONSTRAINT "FK_f7e300b647548abd1f0ae128ca7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leave_requests" DROP CONSTRAINT "FK_21bbb78f818e5f587b19744ce5c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leave_types" DROP CONSTRAINT "FK_1f3cc81275258be8878f90c662f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" DROP CONSTRAINT "FK_cbe37273cc8dbba2ba49f7cf119"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" DROP CONSTRAINT "FK_ad4f2785bd8a0e083f856680195"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" DROP CONSTRAINT "FK_351341ffb6055ef0907b18e28b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_issues" DROP CONSTRAINT "FK_10dcf8f0ac34ea42363eb9ed216"`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" DROP CONSTRAINT "FK_bdef14085ea004c6f6b95cb4411"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marks" DROP CONSTRAINT "FK_666f4dac581787f5f242316c009"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subjects" DROP CONSTRAINT "FK_07a82eb883094a6990b914cc15e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teachers" DROP CONSTRAINT "FK_5656d1b6d40765ea6b135b35d4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_stops" DROP CONSTRAINT "FK_497f704d8b00ccccd7629b3b57e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "routes" DROP CONSTRAINT "FK_eefdc041df6651285ca2b0e7719"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_assignments" DROP CONSTRAINT "FK_132884ca0af2e838e02b30d7e97"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_fees" DROP CONSTRAINT "FK_eafe5529e56fded4e0ab473c574"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT "FK_eef3362babd6fffbbd92e5de292"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_dfa425a9b20aa546ef0280a8769"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_25e1cf8f41bae2f3d11f3c2a028"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_a74f2b3656ded5519934973c17d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_installments" DROP CONSTRAINT "FK_70adc3fbcff99006535a6a50a4b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eb259758723e7365358b8e64a9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5ade718880c9f245516bc1014a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6969e646aa55906ab338683340"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_990f1559338541918a5a10d5cc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c4cf9799c2377cf705783de565"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1ecc8950a45ec0aefd45dfc3e0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6ba7816f0566c77b5ced3a8712"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f7e300b647548abd1f0ae128ca"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_21bbb78f818e5f587b19744ce5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1f3cc81275258be8878f90c662"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ad4f2785bd8a0e083f85668019"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_351341ffb6055ef0907b18e28b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_10dcf8f0ac34ea42363eb9ed21"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bdef14085ea004c6f6b95cb441"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_666f4dac581787f5f242316c00"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_07a82eb883094a6990b914cc15"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5656d1b6d40765ea6b135b35d4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_497f704d8b00ccccd7629b3b57"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eefdc041df6651285ca2b0e771"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_132884ca0af2e838e02b30d7e9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eafe5529e56fded4e0ab473c57"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eef3362babd6fffbbd92e5de29"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dfa425a9b20aa546ef0280a876"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_25e1cf8f41bae2f3d11f3c2a02"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a74f2b3656ded5519934973c17"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_70adc3fbcff99006535a6a50a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" DROP COLUMN "school_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" ADD "school_id" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ALTER COLUMN "is_paid" SET DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ALTER COLUMN "payment_date" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ALTER COLUMN "basic_salary" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" DROP COLUMN "salary_month_bs"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" ADD "salary_month_bs" character varying(7) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" DROP COLUMN "school_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_enrollments" DROP COLUMN "school_id"`,
    );
    await queryRunner.query(`ALTER TABLE "exams" DROP COLUMN "school_id"`);
    await queryRunner.query(
      `ALTER TABLE "fee_categories" DROP COLUMN "school_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_structures" DROP COLUMN "is_govt_mandated_free_seat"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_transactions" DROP COLUMN "school_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_fees" DROP COLUMN "school_id"`,
    );
    await queryRunner.query(`ALTER TABLE "guardians" DROP COLUMN "school_id"`);
    await queryRunner.query(
      `ALTER TABLE "leave_requests" DROP COLUMN "school_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leave_types" DROP COLUMN "school_id"`,
    );
    await queryRunner.query(`ALTER TABLE "payroll" DROP COLUMN "deleted_at"`);
    await queryRunner.query(
      `ALTER TABLE "payroll" DROP COLUMN "transaction_reference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" DROP COLUMN "payment_method"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll" DROP COLUMN "payment_status"`,
    );
    await queryRunner.query(`DROP TYPE "public"."payroll_payment_status_enum"`);
    await queryRunner.query(`ALTER TABLE "payroll" DROP COLUMN "deductions"`);
    await queryRunner.query(`ALTER TABLE "payroll" DROP COLUMN "allowances"`);
    await queryRunner.query(
      `ALTER TABLE "payroll" DROP COLUMN "fiscal_year_bs"`,
    );
    await queryRunner.query(`ALTER TABLE "payroll" DROP COLUMN "payroll_year"`);
    await queryRunner.query(
      `ALTER TABLE "payroll" DROP COLUMN "payroll_month"`,
    );
    await queryRunner.query(`ALTER TABLE "payroll" DROP COLUMN "school_id"`);
    await queryRunner.query(`ALTER TABLE "staff" DROP COLUMN "school_id"`);
    await queryRunner.query(
      `ALTER TABLE "book_issues" DROP COLUMN "school_id"`,
    );
    await queryRunner.query(`ALTER TABLE "books" DROP COLUMN "school_id"`);
    await queryRunner.query(`ALTER TABLE "marks" DROP COLUMN "school_id"`);
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN "requires_manual_followup"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN "retry_count"`,
    );
    await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN "school_id"`);
    await queryRunner.query(`ALTER TABLE "teachers" DROP COLUMN "school_id"`);
    await queryRunner.query(
      `ALTER TABLE "route_stops" DROP COLUMN "school_id"`,
    );
    await queryRunner.query(`ALTER TABLE "routes" DROP COLUMN "school_id"`);
    await queryRunner.query(
      `ALTER TABLE "transport_assignments" DROP COLUMN "school_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_fees" DROP COLUMN "school_id"`,
    );
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "school_id"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "school_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "school_id"`);
    await queryRunner.query(
      `ALTER TABLE "user_sessions" DROP COLUMN "school_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fees" DROP COLUMN "scholarship_percent"`,
    );
    await queryRunner.query(`ALTER TABLE "fees" DROP COLUMN "fiscal_year_bs"`);
    await queryRunner.query(
      `ALTER TABLE "fee_installments" DROP COLUMN "school_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "is_govt_mandated_free_seat"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "birth_certificate_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "citizenship_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "caste_ethnicity_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" RENAME COLUMN "school_id" TO "title"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wards" ADD CONSTRAINT "FK_5ab5b8680dd7e4bb8b0dac21a5c" FOREIGN KEY ("local_body_id") REFERENCES "local_bodies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "local_bodies" ADD CONSTRAINT "FK_24bc58f2e9ebf8e51bb96802061" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "districts" ADD CONSTRAINT "FK_9d451638507b11822dc411a2dfe" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
