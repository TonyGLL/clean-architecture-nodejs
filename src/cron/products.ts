import { CronJob } from 'cron';
import axios from 'axios';
import { IFakeStoreAPIProduct } from '../application/dtos/products.dto';
import { DOMAIN_TYPES } from '../domain/ioc.types';
import { IProductsRepository } from '../domain/repositories/products.repository';
import { container } from '../infraestructure/ioc/config';
import { withAdvisoryLock } from './advisory-lock';
import { Product } from '../domain/entities/product';
import { logger } from '../infraestructure/config/winston';

// Función para sanitizar texto (remover caracteres no ASCII)
const sanitizeText = (text: string): string => {
    if (!text) return '';
    // Remover caracteres de control y no ASCII
    return text.replace(/[^\x20-\x7E]/g, '');
}

// Arbitrary constant identifying this job in pg_try_advisory_lock
const PRODUCTS_SYNC_LOCK_ID = 727001;

/** Runs the catalog sync only if no other worker is already running it. */
export const runProductsSync = (): Promise<void> => withAdvisoryLock(PRODUCTS_SYNC_LOCK_ID, 'Product sync', fetchExternalData);

export const fetchExternalData = async (): Promise<void> => {
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