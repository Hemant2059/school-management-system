import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNepalCompliance1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add columns to students
    await queryRunner.query(
      `ALTER TABLE "students" ADD "birth_certificate_number" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "is_govt_mandated_free_seat" boolean DEFAULT false`,
    );

    // 2. Add columns to fees and fee_structures
    await queryRunner.query(
      `ALTER TABLE "fees" ADD "fiscal_year_bs" character varying(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "fees" ADD "scholarship_percent" decimal(5,2) DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_structures" ADD "is_govt_mandated_free_seat" boolean DEFAULT false`,
    );

    // 3. Administrative Hierarchical Tables
    await queryRunner.query(`
      CREATE TABLE "provinces" (
        "id" integer NOT NULL,
        CONSTRAINT "PK_provinces" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "districts" (
        "id" integer NOT NULL,
        "province_id" integer NOT NULL,
        CONSTRAINT "PK_districts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_districts_provinces" FOREIGN KEY ("province_id") REFERENCES "provinces"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "local_bodies" (
        "id" integer NOT NULL,
        "district_id" integer NOT NULL,
        "type" character varying(50),
        CONSTRAINT "PK_local_bodies" PRIMARY KEY ("id"),
        CONSTRAINT "FK_local_bodies_districts" FOREIGN KEY ("district_id") REFERENCES "districts"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "wards" (
        "id" SERIAL NOT NULL,
        "local_body_id" integer NOT NULL,
        "ward_number" integer NOT NULL,
        CONSTRAINT "PK_wards" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_wards_local_body_ward" UNIQUE ("local_body_id", "ward_number"),
        CONSTRAINT "FK_wards_local_bodies" FOREIGN KEY ("local_body_id") REFERENCES "local_bodies"("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "wards"`);
    await queryRunner.query(`DROP TABLE "local_bodies"`);
    await queryRunner.query(`DROP TABLE "districts"`);
    await queryRunner.query(`DROP TABLE "provinces"`);
    await queryRunner.query(
      `ALTER TABLE "fees" DROP COLUMN "scholarship_percent"`,
    );
    await queryRunner.query(`ALTER TABLE "fees" DROP COLUMN "fiscal_year_bs"`);
    await queryRunner.query(
      `ALTER TABLE "fee_structures" DROP COLUMN "is_govt_mandated_free_seat"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "is_govt_mandated_free_seat"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "birth_certificate_number"`,
    );
  }
}
