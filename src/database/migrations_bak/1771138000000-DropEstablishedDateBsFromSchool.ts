import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DropEstablishedDateBsFromSchool1771138000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('schools', 'established_date_bs');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'schools',
      new TableColumn({
        name: 'established_date_bs',
        type: 'varchar',
        length: '10',
        isNullable: true,
      }),
    );
  }
}
