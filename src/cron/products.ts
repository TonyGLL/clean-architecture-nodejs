import { CronJob } from 'cron';
import axios from 'axios';
import { IFakeStoreAPIProduct } from '../application/dtos/products.dto';
import { DOMAIN_TYPES } from '../domain/ioc.types';
import { IProductsRepository } from '../domain/repositories/products.repository';
import { container } from '../infraestructure/ioc/config';
import { Pool } from 'pg';
import { INFRASTRUCTURE_TYPES } from '../infraestructure/ioc/types';
import { Product } from '../domain/entities/product';
import { logger } from '../infraestructure/config/winston';

// Función para sanitizar texto (remover caracteres no ASCII)
const sanitizeText = (text: string): string => {
    if (!text) return '';
    // Remover caracteres de control y no ASCII
    return text.replace(/[^\x20-\x7E]/g, '');
}

// Arbitrary constant identifying this job in pg_try_advisory_lock; only one process cluster-wide holds it at a time
const PRODUCTS_SYNC_LOCK_ID = 727001;

/**
 * Runs the catalog sync only if no other worker is already running it
 * (safe even when several worker replicas are deployed).
 */
export const runProductsSync = async (): Promise<void> => {
    const pool = container.get<Pool>(INFRASTRUCTURE_TYPES.PostgresPool);
    const lockClient = await pool.connect();
    try {
        const { rows } = await lockClient.query('SELECT pg_try_advisory_lock($1) AS locked', [PRODUCTS_SYNC_LOCK_ID]);
        if (!rows[0].locked) {
            logger.info('Product sync already running in another worker, skipping');
            return;
        }
        try {
            await fetchExternalData();
        } finally {
            await lockClient.query('SELECT pg_advisory_unlock($1)', [PRODUCTS_SYNC_LOCK_ID]);
        }
    } finally {
        lockClient.release();
    }
};

export const fetchExternalData = async () => {
    try {
        // Hacer una única petición GET a un sitio externo
        const { data } = await axios.get<IFakeStoreAPIProduct[]>('https://fakestoreapi.com/products');

        const products: Product[] = data.map((item: IFakeStoreAPIProduct) => (
            {
                id: item.id,
                name: sanitizeText(item.title),
                description: sanitizeText(item.description),
                price: item.price,
                image: sanitizeText(item.image),
                category: sanitizeText(item.category),
                sku: sanitizeText(`${item.id.toString().padStart(6, '0')}`),
                stock: 100,
                quantity: 0,
                reviews: 0,
                rating: 0
            })
        );

        const productsRepository = container.get<IProductsRepository>(DOMAIN_TYPES.IProductsRepository);
        await productsRepository.upsertProductsWithCategories(products);
    } catch (error) {
        logger.error('Product sync failed', { error });
        throw error; // Opcional: relanzar el error si necesitas manejo adicional
    }
}

// Configuración del cron job para ejecutarse cada día a medianoche
export const productsJob = new CronJob(
    '0 0 * * *', // Ejecutar diariamente a medianoche (00:00)
    () => runProductsSync().catch(() => undefined), // errors are already logged
    null, // onComplete
    false, // No iniciar automáticamente
    'America/Mexico_City' // timeZone
);