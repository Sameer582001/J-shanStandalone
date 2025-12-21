import { query } from './src/config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const runMigration = async () => {
    try {
        const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', '003_create_fast_track.sql');
        console.log('Reading migration file from:', migrationPath);

        if (!fs.existsSync(migrationPath)) {
            console.error('Migration file not found at:', migrationPath);
            process.exit(1);
        }

        const sql = fs.readFileSync(migrationPath, 'utf-8');

        console.log('Running migration...');
        await query(sql, []);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
