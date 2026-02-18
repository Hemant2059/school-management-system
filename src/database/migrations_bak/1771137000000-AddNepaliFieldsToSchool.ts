import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddNepaliFieldsToSchool1771137000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('schools', [
      new TableColumn({
        name: 'school_name_nepali',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'established_date_bs',
        type: 'varchar',
        length: '10',
        isNullable: true,
      }),
      new TableColumn({
        name: 'tole_nepali',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'street_address_nepali',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('schools', [
      'school_name_nepali',
      'established_date_bs',
      'tole_nepali',
      'street_address_nepali',
    ]);
  }
}
