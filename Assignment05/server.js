import app from './app.js';
import env from './config/env.js';
import { initDB } from './models/index.js';

async function start() {
    try {
        await initDB();
        app.listen(env.port, () => {
            console.log(`Server is running on http://localhost:${env.port}`);
        });
    } catch (err) {
        console.error('Failed to start the server:', err.message);
        process.exit(1);
    }
}

start();
