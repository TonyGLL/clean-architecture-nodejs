import 'reflect-metadata';
import app from './app';
import { config } from '../infraestructure/config/env';
import dbPool from '../infraestructure/database/postgres/config';

const PORT = config.PORT;

dbPool.query('SELECT NOW()')
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        });
    })
    .catch(err => {
        console.log('Failed to connect to the database. Exiting...', err);
        process.exit(1);
    });
