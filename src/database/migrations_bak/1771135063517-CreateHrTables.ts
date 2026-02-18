import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHrTables1771135063517 implements MigrationInterface {
  name = 'CreateHrTables1771135063517';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."staff_gender_enum" AS ENUM('MALE', 'FEMALE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."staff_employment_type_enum" AS ENUM('PERMANENT', 'CONTRACT', 'PART_TIME', 'CASUAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "staff" ("staff_id" BIGSERIAL NOT NULL, "user_id" bigint NOT NULL, "first_name_en" character varying(100) NOT NULL, "middle_name_en" character varying(100), "last_name_en" character varying(100) NOT NULL, "first_name_np" character varying(150), "middle_name_np" character varying(150), "last_name_np" character varying(150), "citizenship_number" character varying(100), "pan_number" character varying(50), "date_of_birth" date, "date_of_birth_bs" character varying(10), "gender" "public"."staff_gender_enum" NOT NULL, "position" character varying(100) NOT NULL, "department" character varying(100), "hire_date" date NOT NULL, "hire_date_bs" character varying(10), "termination_date" date, "employment_type" "public"."staff_employment_type_enum" NOT NULL DEFAULT 'PERMANENT', "is_active" boolean NOT NULL DEFAULT true, "mobile" character varying(20), "email" character varying(100), "province_id" integer, "district_id" integer, "municipality_id" integer, "ward_no" integer, "tole_en" character varying(100), "tole_np" character varying(150), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_cec9365d9fc3a3409158b645f2e" UNIQUE ("user_id"), CONSTRAINT "PK_ce6869e5d8a52ed3edd5cb750f6" PRIMARY KEY ("staff_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cec9365d9fc3a3409158b645f2" ON "staff" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "payroll" ("payroll_id" BIGSERIAL NOT NULL, "staff_id" bigint NOT NULL, "salary_month_bs" character varying(7) NOT NULL, "payment_date" date NOT NULL, "payment_date_bs" character varying(10), "basic_salary" numeric(12,2) NOT NULL DEFAULT '0', "house_rent_allowance" numeric(12,2) NOT NULL DEFAULT '0', "transport_allowance" numeric(12,2) NOT NULL DEFAULT '0', "medical_allowance" numeric(12,2) NOT NULL DEFAULT '0', "other_allowances" numeric(12,2) NOT NULL DEFAULT '0', "gross_salary" numeric(12,2) NOT NULL DEFAULT '0', "cit_deduction" numeric(12,2) NOT NULL DEFAULT '0', "ssf_employee_contribution" numeric(12,2) NOT NULL DEFAULT '0', "ssf_employer_contribution" numeric(12,2) NOT NULL DEFAULT '0', "provident_fund" numeric(12,2) NOT NULL DEFAULT '0', "tax_deduction" numeric(12,2) NOT NULL DEFAULT '0', "other_deductions" numeric(12,2) NOT NULL DEFAULT '0', "total_deductions" numeric(12,2) NOT NULL DEFAULT '0', "net_salary" numeric(12,2) NOT NULL, "pan_number" character varying(50), "is_tax_exempt" boolean NOT NULL DEFAULT false, "remarks" character varying(255), "is_paid" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_14419a71701a710c311f23dc538" PRIMARY KEY ("payroll_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cbe37273cc8dbba2ba49f7cf11" ON "payroll" ("staff_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "leave_types" ("leave_type_id" BIGSERIAL NOT NULL, "leave_type_name" character varying(100) NOT NULL, "leave_type_name_np" character varying(100) NOT NULL, "days_allocated" integer NOT NULL, "is_paid" boolean NOT NULL DEFAULT true, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f3b8ee64d8a55c351f1dab85d4a" PRIMARY KEY ("leave_type_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."leave_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "leave_requests" ("leave_request_id" BIGSERIAL NOT NULL, "staff_id" bigint NOT NULL, "leave_type_id" bigint NOT NULL, "start_date" date NOT NULL, "start_date_bs" character varying(10), "end_date" date NOT NULL, "end_date_bs" character varying(10), "days_requested" integer NOT NULL, "reason" character varying(500) NOT NULL, "status" "public"."leave_requests_status_enum" NOT NULL DEFAULT 'PENDING', "approved_by" bigint, "rejection_reason" character varying(500), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c8f4be9e2ecdc8eba94da1ff54a" PRIMARY KEY ("leave_request_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c56fb4812a75bdfad7a635098f" ON "leave_requests" ("staff_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c56fb4812a75bdfad7a635098f"`,
    );
    await queryRunner.query(`DROP TABLE "leave_requests"`);
    await queryRunner.query(`DROP TYPE "public"."leave_requests_status_enum"`);
    await queryRunner.query(`DROP TABLE "leave_types"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cbe37273cc8dbba2ba49f7cf11"`,
    );
    await queryRunner.query(`DROP TABLE "payroll"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cec9365d9fc3a3409158b645f2"`,
    );
    await queryRunner.query(`DROP TABLE "staff"`);
    await queryRunner.query(`DROP TYPE "public"."staff_employment_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."staff_gender_enum"`);
  }
}
