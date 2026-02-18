import { DataSource } from 'typeorm';
import { databaseConfig } from './src/config/database.config'; // Adjust path as needed

async function run() {
    const dataSource = new DataSource(databaseConfig as any);
    await dataSource.initialize();
    console.log('Running migrations...');
    await dataSource.runMigrations();
    console.log('Migrations complete.');
    await dataSource.destroy();
}

run().catch(err => console.error(err));
