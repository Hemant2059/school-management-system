import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1771391837618 implements MigrationInterface {
  name = 'InitialSchema1771391837618';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "guardians" DROP CONSTRAINT "FK_guardians_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_guardians" DROP CONSTRAINT "FK_student_guardians_guardian_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_guardians" DROP CONSTRAINT "FK_student_guardians_student_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_guardians" DROP CONSTRAINT "FK_student_guardians_school_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_guardians_user_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_student_guardians_school_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_student_guardians_student_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_student_guardians_guardian_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_student_guardians_unique"`,
    );
    await queryRunner.query(`ALTER TABLE "students" ADD "bus_stop_id" bigint`);
    await queryRunner.query(
      `ALTER TABLE "students" ADD "hostel_room_id" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "medical_condition" text`,
    );
    await queryRunner.query(`ALTER TABLE "students" ADD "medications" text`);
    await queryRunner.query(`ALTER TABLE "students" ADD "allergies" text`);
    await queryRunner.query(`ALTER TABLE "students" ADD "tags" json`);
    await queryRunner.query(
      `ALTER TABLE "exams" ADD "is_result_published" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "exams" ADD "is_locked" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "exams" ADD "academic_year" character varying(50)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5e614fe1f2e63aa5bc265302f0" ON "students" ("school_id", "admission_number") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_835bbd977a1609507d8196deb8" ON "students" ("school_id", "student_code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bcaf6cdc4b3c25e7d7eec2f575" ON "fee_transactions" ("school_id", "transaction_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1792c6e59c9a94f861d08e1bff" ON "fees" ("school_id", "student_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_db653f9cb0de5735476bcce874" ON "users" ("school_id", "user_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f01413cdc37229045f1cb6c911" ON "exams" ("school_id", "academic_year", "exam_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f1d05a3a2d70db0a25479b6718" ON "guardians" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_160bf4c447a9c01ef589e50263" ON "student_guardians" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8194052bdd62204f061dd44e0c" ON "student_guardians" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ec3cd56a2093be19f778af57c6" ON "student_guardians" ("guardian_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_aa0b42c8310d3fb35b846bdce5" ON "student_guardians" ("student_id", "guardian_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97659d0f3fd8a2e7718f980f67" ON "attendance_records" ("school_id", "academic_year") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cde4449bb076b14503996076bb" ON "attendance_records" ("school_id", "student_id", "attendance_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a68923343c9aeca8c3fa754c82" ON "attendance_records" ("school_id", "attendance_date", "class_id", "section_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_transactions" ADD CONSTRAINT "FK_a2658ed0bdf523d0d693ef37a4b" FOREIGN KEY ("student_fee_id") REFERENCES "fees"("fee_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "timetables" ADD CONSTRAINT "FK_54d3ddcc757a7639a1ca4ea159c" FOREIGN KEY ("class_id") REFERENCES "classes"("class_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "timetables" ADD CONSTRAINT "FK_e7ffbf3bfb6c53237a85ed674d5" FOREIGN KEY ("section_id") REFERENCES "sections"("section_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "timetables" ADD CONSTRAINT "FK_6f592a24e991c80fabe3f3b8447" FOREIGN KEY ("subject_id") REFERENCES "subjects"("subject_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "timetables" ADD CONSTRAINT "FK_82b11ba087125514207fa541c3c" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("teacher_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exams" ADD CONSTRAINT "FK_7fe60823f5f2c03867eafba8fa9" FOREIGN KEY ("class_id") REFERENCES "classes"("class_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exams" ADD CONSTRAINT "FK_2c8692b0432ea36e2aba5b12378" FOREIGN KEY ("section_id") REFERENCES "sections"("section_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exams" ADD CONSTRAINT "FK_432eeeb62e8ff8de6c2a341cd10" FOREIGN KEY ("subject_id") REFERENCES "subjects"("subject_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "marks" ADD CONSTRAINT "FK_8699814252710a57e0fbd5a77e7" FOREIGN KEY ("exam_id") REFERENCES "exams"("exam_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "marks" ADD CONSTRAINT "FK_5226e1592e6291dbe7a07640346" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_issues" ADD CONSTRAINT "FK_63aef0c7c6d4e0f97b537cf7257" FOREIGN KEY ("book_id") REFERENCES "books"("book_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_issues" ADD CONSTRAINT "FK_ab88310641840d2dae8cdb857fa" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_issues" ADD CONSTRAINT "FK_0160f2d2eaaffefede4970413f8" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("teacher_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "guardians" ADD CONSTRAINT "FK_f1d05a3a2d70db0a25479b67189" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_guardians" ADD CONSTRAINT "FK_160bf4c447a9c01ef589e50263c" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_guardians" ADD CONSTRAINT "FK_8194052bdd62204f061dd44e0c9" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_guardians" ADD CONSTRAINT "FK_ec3cd56a2093be19f778af57c63" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("guardian_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_enrollments" ADD CONSTRAINT "FK_08caafd8a026a19ecf54db0e958" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_enrollments" ADD CONSTRAINT "FK_e875df488b1b297f25e3dff3039" FOREIGN KEY ("class_id") REFERENCES "classes"("class_id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_enrollments" ADD CONSTRAINT "FK_a504e03e002336b6bf7f17d6212" FOREIGN KEY ("section_id") REFERENCES "sections"("section_id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" ADD CONSTRAINT "FK_951fd419e8486c10ba6302a934b" FOREIGN KEY ("class_id") REFERENCES "classes"("class_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" ADD CONSTRAINT "FK_87b0fa41748dd5f6e2d86c2ebb8" FOREIGN KEY ("section_id") REFERENCES "sections"("section_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" ADD CONSTRAINT "FK_d8007d24dc3d9da492b2a094ee3" FOREIGN KEY ("subject_id") REFERENCES "subjects"("subject_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" ADD CONSTRAINT "FK_27322fa090b5deacc5785fcb94c" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("teacher_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignments" DROP CONSTRAINT "FK_27322fa090b5deacc5785fcb94c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" DROP CONSTRAINT "FK_d8007d24dc3d9da492b2a094ee3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" DROP CONSTRAINT "FK_87b0fa41748dd5f6e2d86c2ebb8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" DROP CONSTRAINT "FK_951fd419e8486c10ba6302a934b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_enrollments" DROP CONSTRAINT "FK_a504e03e002336b6bf7f17d6212"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_enrollments" DROP CONSTRAINT "FK_e875df488b1b297f25e3dff3039"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_enrollments" DROP CONSTRAINT "FK_08caafd8a026a19ecf54db0e958"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_guardians" DROP CONSTRAINT "FK_ec3cd56a2093be19f778af57c63"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_guardians" DROP CONSTRAINT "FK_8194052bdd62204f061dd44e0c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_guardians" DROP CONSTRAINT "FK_160bf4c447a9c01ef589e50263c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "guardians" DROP CONSTRAINT "FK_f1d05a3a2d70db0a25479b67189"`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_issues" DROP CONSTRAINT "FK_0160f2d2eaaffefede4970413f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_issues" DROP CONSTRAINT "FK_ab88310641840d2dae8cdb857fa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_issues" DROP CONSTRAINT "FK_63aef0c7c6d4e0f97b537cf7257"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marks" DROP CONSTRAINT "FK_5226e1592e6291dbe7a07640346"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marks" DROP CONSTRAINT "FK_8699814252710a57e0fbd5a77e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exams" DROP CONSTRAINT "FK_432eeeb62e8ff8de6c2a341cd10"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exams" DROP CONSTRAINT "FK_2c8692b0432ea36e2aba5b12378"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exams" DROP CONSTRAINT "FK_7fe60823f5f2c03867eafba8fa9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "timetables" DROP CONSTRAINT "FK_82b11ba087125514207fa541c3c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "timetables" DROP CONSTRAINT "FK_6f592a24e991c80fabe3f3b8447"`,
    );
    await queryRunner.query(
      `ALTER TABLE "timetables" DROP CONSTRAINT "FK_e7ffbf3bfb6c53237a85ed674d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "timetables" DROP CONSTRAINT "FK_54d3ddcc757a7639a1ca4ea159c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_transactions" DROP CONSTRAINT "FK_a2658ed0bdf523d0d693ef37a4b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a68923343c9aeca8c3fa754c82"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cde4449bb076b14503996076bb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97659d0f3fd8a2e7718f980f67"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aa0b42c8310d3fb35b846bdce5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ec3cd56a2093be19f778af57c6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8194052bdd62204f061dd44e0c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_160bf4c447a9c01ef589e50263"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f1d05a3a2d70db0a25479b6718"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f01413cdc37229045f1cb6c911"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_db653f9cb0de5735476bcce874"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1792c6e59c9a94f861d08e1bff"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bcaf6cdc4b3c25e7d7eec2f575"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_835bbd977a1609507d8196deb8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5e614fe1f2e63aa5bc265302f0"`,
    );
    await queryRunner.query(`ALTER TABLE "exams" DROP COLUMN "academic_year"`);
    await queryRunner.query(`ALTER TABLE "exams" DROP COLUMN "is_locked"`);
    await queryRunner.query(
      `ALTER TABLE "exams" DROP COLUMN "is_result_published"`,
    );
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "tags"`);
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "allergies"`);
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "medications"`);
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "medical_condition"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "hostel_room_id"`,
    );
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "bus_stop_id"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_student_guardians_unique" ON "student_guardians" ("student_id", "guardian_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_student_guardians_guardian_id" ON "student_guardians" ("guardian_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_student_guardians_student_id" ON "student_guardians" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_student_guardians_school_id" ON "student_guardians" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_guardians_user_id" ON "guardians" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "student_guardians" ADD CONSTRAINT "FK_student_guardians_school_id" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_guardians" ADD CONSTRAINT "FK_student_guardians_student_id" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_guardians" ADD CONSTRAINT "FK_student_guardians_guardian_id" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("guardian_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "guardians" ADD CONSTRAINT "FK_guardians_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
