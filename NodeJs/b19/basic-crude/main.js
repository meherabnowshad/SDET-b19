import { listUsers,userRegistration, updateUser } from './index.js';
import { initDB, closeDB } from './db.js';

await initDB();
// await userRegistration('User1', 'john.doe@example.com', '123-456-7890', 'password123');
// await userRegistration('User2', 'jane.smith@example.com', '098-765-4321', 'password456');
// await userRegistration('User3', 'bob.johnson@example.com', '555-555-5555', 'password789');

// await updateUserName(2, 'Jane Smith');
// await updateUserName(3, 'Bob Johnson');

await updateUser(2, { name: 'Smith Jane', phoneNumber: '111-222-3333' });

await listUsers();
await closeDB();