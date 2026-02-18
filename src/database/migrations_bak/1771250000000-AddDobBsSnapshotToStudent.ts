import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDobBsSnapshotToStudent1771250000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'students',
      new TableColumn({
        name: 'dob_bs_snapshot',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('students', 'dob_bs_snapshot');
  }
}
