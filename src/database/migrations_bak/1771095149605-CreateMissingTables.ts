import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMissingTables1771095149605 implements MigrationInterface {
  name = 'CreateMissingTables1771095149605';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."teachers_gender_enum" AS ENUM('MALE', 'FEMALE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."teachers_employment_type_enum" AS ENUM('PERMANENT', 'CONTRACTUAL', 'PART_TIME', 'ADJUNCT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."teachers_current_status_enum" AS ENUM('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "teachers" ("teacher_id" BIGSERIAL NOT NULL, "teacher_code" character varying(50) NOT NULL, "employee_id" character varying(50) NOT NULL, "first_name_en" character varying(100) NOT NULL, "middle_name_en" character varying(100), "last_name_en" character varying(100) NOT NULL, "first_name_np" character varying(150), "middle_name_np" character varying(150), "last_name_np" character varying(150), "display_name" character varying(255), "date_of_birth" date, "gender" "public"."teachers_gender_enum" NOT NULL, "blood_group" character varying(10), "nationality" character varying(50) DEFAULT 'Nepali', "religion" character varying(50), "highest_qualification" character varying(200), "specialization" character varying(200), "university_board" character varying(255), "passing_year" integer, "teaching_license_number" character varying(100), "license_expiry_date" date, "personal_mobile" character varying(20), "official_mobile" character varying(20), "personal_email" character varying(100), "official_email" character varying(100), "permanent_province_id" integer, "permanent_district_id" integer, "permanent_municipality_id" integer, "permanent_ward_no" integer, "permanent_tole_en" character varying(100), "permanent_address_en" character varying(255), "permanent_tole_np" character varying(150), "permanent_address_np" character varying(300), "joining_date" date NOT NULL, "employment_type" "public"."teachers_employment_type_enum" NOT NULL DEFAULT 'PERMANENT', "department" character varying(100), "current_status" "public"."teachers_current_status_enum" NOT NULL DEFAULT 'ACTIVE', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_8293816d01c0d112a8bfcbcea6a" UNIQUE ("teacher_code"), CONSTRAINT "UQ_41a9b4d0b9007c9630463244316" UNIQUE ("employee_id"), CONSTRAINT "PK_8554ca4826231daa07720e5e0d5" PRIMARY KEY ("teacher_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."classes_education_level_enum" AS ENUM('PRIMARY', 'LOWER_SECONDARY', 'SECONDARY', 'HIGHER_SECONDARY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "classes" ("class_id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "class_name" character varying(100) NOT NULL, "class_code" character varying(20) NOT NULL, "class_order" integer NOT NULL, "education_level" "public"."classes_education_level_enum" NOT NULL, "min_age" integer, "max_age" integer, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_1c29abc497051d41c2d6e276a05" PRIMARY KEY ("class_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_398f3990f5da4a1efda173f576" ON "classes" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "sections" ("section_id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "class_id" bigint NOT NULL, "section_name" character varying(100) NOT NULL, "section_code" character varying(20) NOT NULL, "section_order" integer NOT NULL DEFAULT '0', "capacity" integer, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_c5641bfa4992d9bb24205e4cf12" PRIMARY KEY ("section_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff9259b86078bdc799eab2ee8e" ON "sections" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_27db91d7369af6f181412afa99" ON "sections" ("class_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ADD CONSTRAINT "FK_398f3990f5da4a1efda173f576f" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sections" ADD CONSTRAINT "FK_ff9259b86078bdc799eab2ee8ea" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sections" ADD CONSTRAINT "FK_27db91d7369af6f181412afa99f" FOREIGN KEY ("class_id") REFERENCES "classes"("class_id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sections" DROP CONSTRAINT "FK_27db91d7369af6f181412afa99f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sections" DROP CONSTRAINT "FK_ff9259b86078bdc799eab2ee8ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" DROP CONSTRAINT "FK_398f3990f5da4a1efda173f576f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_27db91d7369af6f181412afa99"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ff9259b86078bdc799eab2ee8e"`,
    );
    await queryRunner.query(`DROP TABLE "sections"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_398f3990f5da4a1efda173f576"`,
    );
    await queryRunner.query(`DROP TABLE "classes"`);
    await queryRunner.query(
      `DROP TYPE "public"."classes_education_level_enum"`,
    );
    await queryRunner.query(`DROP TABLE "teachers"`);
    await queryRunner.query(
      `DROP TYPE "public"."teachers_current_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."teachers_employment_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."teachers_gender_enum"`);
  }
}
