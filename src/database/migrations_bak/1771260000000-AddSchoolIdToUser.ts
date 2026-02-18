import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddSchoolIdToUser1771260000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add school_id column to users table
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'school_id',
        type: 'bigint',
        isNullable: false,
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['school_id'],
        referencedColumnNames: ['school_id'],
        referencedTableName: 'schools',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // Add index on school_id for better query performance
    await queryRunner.query(
      `CREATE INDEX "IDX_users_school_id" ON "users" ("school_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX "IDX_users_school_id"`);

    // Drop foreign key
    const table = await queryRunner.getTable('users');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('school_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('users', foreignKey);
    }

    // Drop column
    await queryRunner.dropColumn('users', 'school_id');
  }
}
