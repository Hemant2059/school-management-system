import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParentDashboardTables1771381692454 implements MigrationInterface {
    name = 'AddParentDashboardTables1771381692454'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."student_guardians_relationship_enum" AS ENUM('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER')`);
        await queryRunner.query(`CREATE TABLE "student_guardians" ("id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "student_id" bigint NOT NULL, "guardian_id" bigint NOT NULL, "relationship" "public"."student_guardians_relationship_enum" NOT NULL DEFAULT 'GUARDIAN', "is_primary_contact" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_11ef78f5131711d8da1b14e3332" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_160bf4c447a9c01ef589e50263" ON "student_guardians" ("school_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8194052bdd62204f061dd44e0c" ON "student_guardians" ("student_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ec3cd56a2093be19f778af57c6" ON "student_guardians" ("guardian_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_aa0b42c8310d3fb35b846bdce5" ON "student_guardians" ("student_id", "guardian_id") `);
        await queryRunner.query(`ALTER TABLE "guardians" ADD "user_id" bigint`);
        await queryRunner.query(`CREATE INDEX "IDX_f1d05a3a2d70db0a25479b6718" ON "guardians" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "guardians" ADD CONSTRAINT "FK_f1d05a3a2d70db0a25479b67189" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_guardians" ADD CONSTRAINT "FK_160bf4c447a9c01ef589e50263c" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_guardians" ADD CONSTRAINT "FK_8194052bdd62204f061dd44e0c9" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_guardians" ADD CONSTRAINT "FK_ec3cd56a2093be19f778af57c63" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("guardian_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student_guardians" DROP CONSTRAINT "FK_ec3cd56a2093be19f778af57c63"`);
        await queryRunner.query(`ALTER TABLE "student_guardians" DROP CONSTRAINT "FK_8194052bdd62204f061dd44e0c9"`);
        await queryRunner.query(`ALTER TABLE "student_guardians" DROP CONSTRAINT "FK_160bf4c447a9c01ef589e50263c"`);
        await queryRunner.query(`ALTER TABLE "guardians" DROP CONSTRAINT "FK_f1d05a3a2d70db0a25479b67189"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f1d05a3a2d70db0a25479b6718"`);
        await queryRunner.query(`ALTER TABLE "guardians" DROP COLUMN "user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aa0b42c8310d3fb35b846bdce5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ec3cd56a2093be19f778af57c6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8194052bdd62204f061dd44e0c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_160bf4c447a9c01ef589e50263"`);
        await queryRunner.query(`DROP TABLE "student_guardians"`);
        await queryRunner.query(`DROP TYPE "public"."student_guardians_relationship_enum"`);
    }

}
