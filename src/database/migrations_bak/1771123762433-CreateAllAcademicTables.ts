import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAllAcademicTables1771123762433 implements MigrationInterface {
  name = 'CreateAllAcademicTables1771123762433';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "timetables" ("timetable_id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "class_id" bigint NOT NULL, "section_id" bigint, "subject_id" bigint NOT NULL, "teacher_id" bigint NOT NULL, "day_of_week" integer NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "period_number" integer NOT NULL, "room_number" character varying(100), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_fa0e43273e477765a27287cc784" PRIMARY KEY ("timetable_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ba199f123599e28e769f5ee346" ON "timetables" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_54d3ddcc757a7639a1ca4ea159" ON "timetables" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6f592a24e991c80fabe3f3b844" ON "timetables" ("subject_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('INFO', 'WARNING', 'URGENT', 'EXAM', 'FEE', 'ATTENDANCE', 'RESULT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("notification_id" BIGSERIAL NOT NULL, "title" character varying(255) NOT NULL, "message" character varying(1000) NOT NULL, "message_np" character varying(255), "type" "public"."notifications_type_enum" NOT NULL, "school_id" bigint, "class_id" bigint, "section_id" bigint, "student_id" bigint, "guardian_id" bigint, "is_read" boolean NOT NULL DEFAULT false, "is_sms_sent" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eaedfe19f0f765d26afafa85956" PRIMARY KEY ("notification_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f3fdb086b7b384df55f634c54" ON "notifications" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ce06bae9cc27770d5ee158d8ce" ON "notifications" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "assignments" ("assignment_id" BIGSERIAL NOT NULL, "title" character varying(255) NOT NULL, "description" character varying(500) NOT NULL, "class_id" bigint NOT NULL, "section_id" bigint, "subject_id" bigint NOT NULL, "teacher_id" bigint NOT NULL, "due_date" date NOT NULL, "due_date_bs" character varying(10), "total_marks" integer NOT NULL DEFAULT '100', "is_published" boolean NOT NULL DEFAULT true, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_d6c1d70f2bb5464c5b3a5269bb9" PRIMARY KEY ("assignment_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_951fd419e8486c10ba6302a934" ON "assignments" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d8007d24dc3d9da492b2a094ee" ON "assignments" ("subject_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d8007d24dc3d9da492b2a094ee"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_951fd419e8486c10ba6302a934"`,
    );
    await queryRunner.query(`DROP TABLE "assignments"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ce06bae9cc27770d5ee158d8ce"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7f3fdb086b7b384df55f634c54"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6f592a24e991c80fabe3f3b844"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_54d3ddcc757a7639a1ca4ea159"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ba199f123599e28e769f5ee346"`,
    );
    await queryRunner.query(`DROP TABLE "timetables"`);
  }
}
