import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttendanceTable1771120819326 implements MigrationInterface {
  name = 'CreateAttendanceTable1771120819326';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."attendance_records_status_enum" AS ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."attendance_records_session_enum" AS ENUM('MORNING', 'AFTERNOON', 'EVENING', 'FULL_DAY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "attendance_records" ("attendance_id" BIGSERIAL NOT NULL, "student_id" bigint NOT NULL, "class_id" bigint NOT NULL, "section_id" bigint, "attendance_date" date NOT NULL, "attendance_date_bs" character varying(10), "status" "public"."attendance_records_status_enum" NOT NULL, "academic_year" character varying(50) NOT NULL, "session" "public"."attendance_records_session_enum" NOT NULL DEFAULT 'FULL_DAY', "remarks" character varying(500), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" bigint, "updated_by" bigint, CONSTRAINT "PK_f11d869536b0bfe0bba1e0d5d32" PRIMARY KEY ("attendance_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dbace05c012526710663f8d891" ON "attendance_records" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cc48ccbd03396874857ab06ac3" ON "attendance_records" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_12de84e2146a7fe49ee40daed7" ON "attendance_records" ("section_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_12de84e2146a7fe49ee40daed7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cc48ccbd03396874857ab06ac3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dbace05c012526710663f8d891"`,
    );
    await queryRunner.query(`DROP TABLE "attendance_records"`);
    await queryRunner.query(
      `DROP TYPE "public"."attendance_records_session_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."attendance_records_status_enum"`,
    );
  }
}
