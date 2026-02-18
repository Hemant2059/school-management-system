import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransportTables1771133692683 implements MigrationInterface {
  name = 'CreateTransportTables1771133692683';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vehicles" ("vehicle_id" BIGSERIAL NOT NULL, "vehicle_number" character varying(50) NOT NULL, "vehicle_name" character varying(100) NOT NULL, "vehicle_type" character varying(50) NOT NULL, "capacity" integer NOT NULL, "manufacturer" character varying(100), "year" integer, "color" character varying(100), "chassis_number" character varying(255), "engine_number" character varying(255), "insurance_expiry" date, "permit_expiry" date, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97a57b7389989efc352bef8af3a" UNIQUE ("vehicle_number"), CONSTRAINT "PK_daf0b353d75b92156fdbe18791e" PRIMARY KEY ("vehicle_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "transport_fees" ("fee_id" BIGSERIAL NOT NULL, "route_id" bigint NOT NULL, "section_id" bigint, "monthly_fee" numeric(12,2) NOT NULL, "admission_fee" numeric(12,2), "currency" character varying(50) NOT NULL DEFAULT 'NPR', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dd8143849703008112aaa9a3b12" PRIMARY KEY ("fee_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_652d9a3d83a7ebd69378fa45cf" ON "transport_fees" ("route_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "transport_assignments" ("assignment_id" BIGSERIAL NOT NULL, "student_id" bigint NOT NULL, "route_id" bigint NOT NULL, "stop_id" bigint NOT NULL, "vehicle_id" bigint NOT NULL, "assignment_date" date NOT NULL, "assignment_date_bs" character varying(10), "is_active" boolean NOT NULL DEFAULT true, "remarks" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_91b7e77e6c2a689dc7364a37eba" PRIMARY KEY ("assignment_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c8ba38ddfe036dfc247f75dd0a" ON "transport_assignments" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "routes" ("route_id" BIGSERIAL NOT NULL, "route_name" character varying(200) NOT NULL, "route_code" character varying(50) NOT NULL, "province_id" integer, "district_id" integer, "municipality_id" integer, "route_description" character varying(255) NOT NULL, "distance_km" numeric(10,2) NOT NULL, "estimated_time" TIME, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_645e8597b5e7b45d76e78a1dc53" UNIQUE ("route_code"), CONSTRAINT "PK_0eb3f18d38d72ae9a1fce9c5c58" PRIMARY KEY ("route_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "route_stops" ("stop_id" BIGSERIAL NOT NULL, "route_id" bigint NOT NULL, "stop_name" character varying(200) NOT NULL, "stop_name_np" character varying(200), "stop_order" integer NOT NULL, "latitude" numeric(10,7), "longitude" numeric(11,7), "arrival_time" TIME, "departure_time" TIME, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3d326d5552dacba78e0aba897c3" PRIMARY KEY ("stop_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b16cab5c66870949cbb4ee748c" ON "route_stops" ("route_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b16cab5c66870949cbb4ee748c"`,
    );
    await queryRunner.query(`DROP TABLE "route_stops"`);
    await queryRunner.query(`DROP TABLE "routes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c8ba38ddfe036dfc247f75dd0a"`,
    );
    await queryRunner.query(`DROP TABLE "transport_assignments"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_652d9a3d83a7ebd69378fa45cf"`,
    );
    await queryRunner.query(`DROP TABLE "transport_fees"`);
    await queryRunner.query(`DROP TABLE "vehicles"`);
  }
}
