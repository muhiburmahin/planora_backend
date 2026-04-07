import { Server } from 'http';
import app from './app';
const PORT = 5000;
let server: Server;

async function main() {
    try {
        server = app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
    }

    process.on('unhandledRejection', (error) => {
        console.log('⚠️ Unhandled Rejection detected, shutting down...', error);
        if (server) {
            server.close(() => {
                process.exit(1);
            });
        } else {
            process.exit(1);
        }
    });

    // Uncaught Exception
    process.on('uncaughtException', (error) => {
        console.log('🚨 Uncaught Exception detected, shutting down...', error);
        process.exit(1);
    });
}

main();