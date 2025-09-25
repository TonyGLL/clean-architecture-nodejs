import 'reflect-metadata';
import app from './app';
import { config } from '../infraestructure/config/env';

const PORT = config.PORT;

const server = app.listen(PORT, () => {
    console.log('Server running on port:', PORT);
});

process.on('SIGINT', () => {
    console.log('\n Shutting down server...');
    server.close(() => {
        console.log('Server off.');
        process.exit(0);
    });
});
