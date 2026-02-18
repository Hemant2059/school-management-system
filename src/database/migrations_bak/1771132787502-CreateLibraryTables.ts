import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLibraryTables1771132787502 implements MigrationInterface {
  name = 'CreateLibraryTables1771132787502';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."books_book_type_enum" AS ENUM('TEXTBOOK', 'REFERENCE', 'NOVEL', 'ENCYCLOPEDIA', 'MAGAZINE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "books" ("book_id" BIGSERIAL NOT NULL, "title_en" character varying(255) NOT NULL, "author_en" character varying(255), "publisher_en" character varying(255), "title_np" character varying(300), "author_np" character varying(255), "publisher_np" character varying(255), "isbn" character varying(100) NOT NULL, "book_code" character varying(50) NOT NULL, "book_type" "public"."books_book_type_enum" NOT NULL, "is_see_reference" boolean NOT NULL DEFAULT false, "is_neb_reference" boolean NOT NULL DEFAULT false, "curriculum_level" character varying(100), "subject" character varying(100), "acquisition_date" date NOT NULL, "acquisition_date_bs" character varying(10), "price" numeric(10,2) NOT NULL, "currency" character varying(50), "total_copies" integer NOT NULL DEFAULT '1', "issued_copies" integer NOT NULL DEFAULT '0', "damaged_copies" integer NOT NULL DEFAULT '0', "description" character varying(500), "language" character varying(100), "edition" character varying(100), "pages" integer, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_552bd343dabd693159e284fe517" PRIMARY KEY ("book_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_54337dc30d9bb2c3fadebc6909" ON "books" ("isbn") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a54396d6d0c0850690ffc6441a" ON "books" ("book_code") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."book_issues_status_enum" AS ENUM('ISSUED', 'RETURNED', 'OVERDUE', 'LOST')`,
    );
    await queryRunner.query(
      `CREATE TABLE "book_issues" ("issue_id" BIGSERIAL NOT NULL, "book_id" bigint NOT NULL, "student_id" bigint NOT NULL, "teacher_id" bigint, "issue_date" date NOT NULL, "issue_date_bs" character varying(10), "due_date" date NOT NULL, "due_date_bs" character varying(10), "return_date" date, "return_date_bs" character varying(10), "fine_amount" numeric(10,2) NOT NULL DEFAULT '0', "days_overdue" integer NOT NULL DEFAULT '0', "status" "public"."book_issues_status_enum" NOT NULL DEFAULT 'ISSUED', "remarks" character varying(500), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_42cdfa18aa8e02cf94967122866" PRIMARY KEY ("issue_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_63aef0c7c6d4e0f97b537cf725" ON "book_issues" ("book_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ab88310641840d2dae8cdb857f" ON "book_issues" ("student_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ab88310641840d2dae8cdb857f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_63aef0c7c6d4e0f97b537cf725"`,
    );
    await queryRunner.query(`DROP TABLE "book_issues"`);
    await queryRunner.query(`DROP TYPE "public"."book_issues_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a54396d6d0c0850690ffc6441a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_54337dc30d9bb2c3fadebc6909"`,
    );
    await queryRunner.query(`DROP TABLE "books"`);
    await queryRunner.query(`DROP TYPE "public"."books_book_type_enum"`);
  }
}
