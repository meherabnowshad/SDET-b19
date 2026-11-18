
import env from '../config/env.js';
import sequelize from '../config/database.js';
import { User } from '../models/index.js';

const BCRYPT_PATTERN = /^\$2[aby]\$/;

async function warnAboutPlainTextPasswords() {
    const users = await User.scope('withPassword').findAll();
    const plain = users.filter((u) => !BCRYPT_PATTERN.test(u.password || ''));

    if (plain.length === 0) return;

    console.warn(
        `\n! ${plain.length} account(s) still hold a pre-API plain-text password ` +
        `and cannot log in through this API:`
    );
    plain.forEach((u) => console.warn(`    - ${u.email} (id ${u.id})`));
    console.warn(
        '  Fix each one with PATCH /api/users/password after logging in as admin,\n' +
        '  or re-register the account.\n'
    );
}

async function run() {
    await sequelize.authenticate();

    const { firstname, lastname, email, password } = env.admin;
    const existing = await User.findOne({ where: { email } });

    if (existing) {

        await existing.update({
            firstname,
            lastname,
            password,
            role: 'admin',
            isActive: true,
        });
        console.log(`✔ Admin reset: ${email}`);
    } else {
        await User.create({
            firstname,
            lastname,
            email,
            password,
            role: 'admin',
            isActive: true,
        });
        console.log(`✔ Admin created: ${email}`);
    }

    console.log(`  password: ${password}`);

    await warnAboutPlainTextPasswords();
    await sequelize.close();
}

run().catch(async (err) => {
    console.error('Seeding failed:', err.message);
    await sequelize.close().catch(() => { });
    process.exit(1);
});
