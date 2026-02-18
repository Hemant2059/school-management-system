import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAcademicModules1771122901121 implements MigrationInterface {
  name = 'CreateAcademicModules1771122901121';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."subjects_subject_type_enum" AS ENUM('COMPULSORY', 'ELECTIVE', 'OPTIONAL', 'ADDITIONAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subjects_subject_group_enum" AS ENUM('SCIENCE', 'MANAGEMENT', 'HUMANITIES', 'EDUCATION', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subjects" ("subject_id" BIGSERIAL NOT NULL, "subject_name" character varying(200) NOT NULL, "subject_code" character varying(50) NOT NULL, "subject_type" "public"."subjects_subject_type_enum" NOT NULL DEFAULT 'COMPULSORY', "subject_group" "public"."subjects_subject_group_enum", "credit_hours" numeric(4,2) NOT NULL DEFAULT '0', "is_theory" boolean NOT NULL DEFAULT true, "is_practical" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_d84405cc8a36ffb373df40ed3bc" UNIQUE ("subject_code"), CONSTRAINT "PK_3573ed298f466a8ba663579e077" PRIMARY KEY ("subject_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "marks" ("mark_id" BIGSERIAL NOT NULL, "exam_id" bigint NOT NULL, "student_id" bigint NOT NULL, "theory_marks" numeric(6,2), "practical_marks" numeric(6,2), "total_marks" numeric(6,2), "grade" character varying(5), "grade_point" numeric(4,2), "remarks" character varying(255), "is_submitted" boolean NOT NULL DEFAULT false, "is_verified" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_69fb4732dce7930212da1414827" PRIMARY KEY ("mark_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8699814252710a57e0fbd5a77e" ON "marks" ("exam_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5226e1592e6291dbe7a0764034" ON "marks" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."exams_exam_type_enum" AS ENUM('UNIT_TEST', 'TERMINAL', 'FINAL', 'SEE', 'NEB', 'BOARD', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "exams" ("exam_id" BIGSERIAL NOT NULL, "exam_name" character varying(200) NOT NULL, "exam_code" character varying(50) NOT NULL, "exam_type" "public"."exams_exam_type_enum" NOT NULL, "class_id" bigint NOT NULL, "section_id" bigint, "subject_id" bigint NOT NULL, "exam_date" date NOT NULL, "exam_date_bs" character varying(10), "start_time" TIME, "end_time" TIME, "full_marks" integer NOT NULL, "pass_marks" integer NOT NULL, "is_published" boolean NOT NULL DEFAULT true, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_7fa41a3a161c719dbb3bbd67eef" PRIMARY KEY ("exam_id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "exams"`);
    await queryRunner.query(`DROP TYPE "public"."exams_exam_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5226e1592e6291dbe7a0764034"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8699814252710a57e0fbd5a77e"`,
    );
    await queryRunner.query(`DROP TABLE "marks"`);
    await queryRunner.query(`DROP TABLE "subjects"`);
    await queryRunner.query(`DROP TYPE "public"."subjects_subject_group_enum"`);
    await queryRunner.query(`DROP TYPE "public"."subjects_subject_type_enum"`);
  }
}
