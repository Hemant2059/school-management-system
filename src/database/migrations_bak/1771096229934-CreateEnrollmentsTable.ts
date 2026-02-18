import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEnrollmentsTable1771096229934 implements MigrationInterface {
  name = 'CreateEnrollmentsTable1771096229934';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."student_enrollments_status_enum" AS ENUM('ACTIVE', 'PROMOTED', 'REPEATED', 'TRANSFERRED_OUT', 'DROPPED', 'GRADUATED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "student_enrollments" ("enrollment_id" BIGSERIAL NOT NULL, "student_id" bigint NOT NULL, "class_id" bigint NOT NULL, "section_id" bigint, "academic_year" character varying(50) NOT NULL, "enrollment_date" date NOT NULL, "status" "public"."student_enrollments_status_enum" NOT NULL DEFAULT 'ACTIVE', "is_current" boolean NOT NULL DEFAULT true, "roll_number" character varying(20), "board_exam_registration" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" bigint, "updated_by" bigint, CONSTRAINT "PK_f30c325194ec4771788c99bc97e" PRIMARY KEY ("enrollment_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_08caafd8a026a19ecf54db0e95" ON "student_enrollments" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e875df488b1b297f25e3dff303" ON "student_enrollments" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a504e03e002336b6bf7f17d621" ON "student_enrollments" ("section_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a504e03e002336b6bf7f17d621"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e875df488b1b297f25e3dff303"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_08caafd8a026a19ecf54db0e95"`,
    );
    await queryRunner.query(`DROP TABLE "student_enrollments"`);
    await queryRunner.query(
      `DROP TYPE "public"."student_enrollments_status_enum"`,
    );
  }
}
