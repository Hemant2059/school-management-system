import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateAdminTables1771239000000 implements MigrationInterface {
  name = 'CreateAdminTables1771239000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Provinces
    await queryRunner.createTable(
      new Table({
        name: 'provinces',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true },
          { name: 'name_en', type: 'varchar', length: '100', isNullable: true },
          { name: 'name_np', type: 'varchar', length: '150', isNullable: true },
        ],
      }),
      true,
    );

    // 2. Districts
    await queryRunner.createTable(
      new Table({
        name: 'districts',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true },
          { name: 'province_id', type: 'integer' },
          { name: 'name_en', type: 'varchar', length: '100', isNullable: true },
          { name: 'name_np', type: 'varchar', length: '150', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'districts',
      new TableForeignKey({
        columnNames: ['province_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'provinces',
        onDelete: 'CASCADE',
      }),
    );

    // 3. Local Bodies
    await queryRunner.createTable(
      new Table({
        name: 'local_bodies',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true },
          { name: 'district_id', type: 'integer' },
          { name: 'type', type: 'varchar', length: '50', isNullable: true },
          { name: 'name_en', type: 'varchar', length: '150', isNullable: true },
          { name: 'name_np', type: 'varchar', length: '200', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'local_bodies',
      new TableForeignKey({
        columnNames: ['district_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'districts',
        onDelete: 'CASCADE',
      }),
    );

    // 4. Wards
    await queryRunner.createTable(
      new Table({
        name: 'wards',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'local_body_id', type: 'integer' },
          { name: 'ward_number', type: 'integer' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'wards',
      new TableForeignKey({
        columnNames: ['local_body_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'local_bodies',
        onDelete: 'CASCADE',
      }),
    );

    // Unique index on [local_body_id, ward_number]
    await queryRunner.createIndex(
      'wards',
      new TableIndex({
        columnNames: ['local_body_id', 'ward_number'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const wardsTable = await queryRunner.getTable('wards');
    const localBodiesTable = await queryRunner.getTable('local_bodies');
    const districtsTable = await queryRunner.getTable('districts');

    // Drop foreign keys and tables in reverse order
    if (wardsTable) {
      const foreignKey = wardsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('local_body_id') !== -1,
      );
      if (foreignKey) await queryRunner.dropForeignKey('wards', foreignKey);
    }
    await queryRunner.dropTable('wards');

    if (localBodiesTable) {
      const foreignKey = localBodiesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('district_id') !== -1,
      );
      if (foreignKey)
        await queryRunner.dropForeignKey('local_bodies', foreignKey);
    }
    await queryRunner.dropTable('local_bodies');

    if (districtsTable) {
      const foreignKey = districtsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('province_id') !== -1,
      );
      if (foreignKey) await queryRunner.dropForeignKey('districts', foreignKey);
    }
    await queryRunner.dropTable('districts');

    await queryRunner.dropTable('provinces');
  }
}
