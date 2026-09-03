
import mysql from 'mysql2/promise';
import env from '../config/env.js';
import sequelize from '../config/database.js';
import '../models/index.js';

const LEGACY_RENAMES = [
    { table: 'users', from: 'createdAt', to: 'createAt' },
    { table: 'users', from: 'updatedAt', to: 'updateAt' },
    { table: 'blogs', from: 'createdAt', to: 'createAt' },
    { table: 'blogs', from: 'updatedAt', to: 'updateAt' },
];

const CASE_FIXES = [
    { table: 'users', to: 'firstname' },
    { table: 'users', to: 'lastname' },
];

async function createDatabase() {
    const connection = await mysql.createConnection({
        host: env.db.host,
        port: env.db.port,
        user: env.db.user,
        password: env.db.password,
    });

    await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${env.db.name}\`
         CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✔ Database \`${env.db.name}\` is ready`);

    await connection.end();
}

async function describeTable(table) {
    const [rows] = await sequelize.query(
        `SELECT COLUMN_NAME AS name, COLUMN_TYPE AS type, IS_NULLABLE AS nullable
           FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table`,
        { replacements: { table } }
    );
    return rows;
}

async function applyLegacyRenames() {
    for (const { table, from, to } of LEGACY_RENAMES) {
        const columns = await describeTable(table);
        if (columns.length === 0) continue;

        const hasFrom = columns.some((c) => c.name === from);
        const hasTo = columns.some((c) => c.name === to);

        if (hasFrom && !hasTo) {
            await sequelize.query(
                `ALTER TABLE \`${table}\` RENAME COLUMN \`${from}\` TO \`${to}\``
            );
            console.log(`✔ Renamed ${table}.${from} -> ${table}.${to}`);
        } else if (hasFrom && hasTo) {
            console.warn(
                `! ${table} has both ${from} and ${to}. Drop the unused ${from} column manually.`
            );
        }
    }
}

async function applyCaseFixes() {
    for (const { table, to } of CASE_FIXES) {
        const columns = await describeTable(table);
        const current = columns.find((c) => c.name.toLowerCase() === to.toLowerCase());

        if (!current || current.name === to) continue;

        const nullClause = current.nullable === 'YES' ? 'NULL' : 'NOT NULL';
        try {
            await sequelize.query(
                `ALTER TABLE \`${table}\` CHANGE COLUMN \`${current.name}\` \`${to}\` ${current.type} ${nullClause}`
            );
            console.log(`✔ Normalised ${table}.${current.name} -> ${table}.${to}`);
        } catch (err) {

            console.warn(`! Could not normalise ${table}.${current.name}: ${err.message}`);
        }
    }
}

async function run() {
    await createDatabase();
    await sequelize.authenticate();

    await applyLegacyRenames();
    await applyCaseFixes();

    await sequelize.sync();
    console.log('✔ Tables synced');

    await ensureProfileImageColumn();

    for (const table of ['users', 'blogs']) {
        const columns = await describeTable(table);
        console.log(`\n${table}: ${columns.map((c) => c.name).join(', ')}`);
    }

    await sequelize.close();
    console.log('\nSetup complete. Next: npm run seed:admin');
}

async function ensureProfileImageColumn() {
    const columns = await describeTable('users');
    if (columns.some((c) => c.name === 'profileImage')) return;
    await sequelize.query(
        'ALTER TABLE `users` ADD COLUMN `profileImage` VARCHAR(500) NULL DEFAULT NULL'
    );
    console.log('✔ Added users.profileImage');
}

run().catch(async (err) => {
    console.error('Setup failed:', err.message);
    await sequelize.close().catch(() => { });
    process.exit(1);
});
